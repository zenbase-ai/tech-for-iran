import { paginationOptsValidator } from "convex/server"
import { v } from "convex/values"
import { getOneFrom } from "convex-helpers/server/relationships"
import { omit, zip } from "es-toolkit"
import * as z from "zod"
import {
  derivePostTargetCount,
  parsePostURN,
  SubmitPostSchema,
} from "@/app/(auth)/pods/[podId]/posts/-submit/schema"
import { internal } from "@/convex/_generated/api"
import { podMemberCount, podPostCount, postEngagementCount } from "@/convex/aggregates"
import { authMutation, authQuery } from "@/convex/helpers/convex"
import { BadRequestError, NotFoundError, UnauthorizedError } from "@/convex/helpers/errors"
import { needsReconnection } from "@/convex/helpers/linkedin"
import { humanizeDuration, rateLimiter } from "@/convex/limiter"
import { workflow } from "@/convex/workflows/engagement"
import { pmap } from "./helpers/collections"

export const get = authQuery({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId)
    if (!post) {
      return null
    }
    if (post.userId !== ctx.userId) {
      throw new UnauthorizedError()
    }

    // Use stored status if available, otherwise compute dynamically for backwards compatibility
    let status: string
    if (post.status) {
      // Use the stored status from workflow completion
      status = post.status
    } else {
      // Fallback to dynamic computation for legacy posts without status field
      const engagementCount = await postEngagementCount.count(ctx, { namespace: args.postId })
      const postAge = Date.now() - post._creationTime

      if (!post.workflowId) {
        status = "pending"
      } else if (engagementCount > 0) {
        status = "completed"
      } else if (postAge > 60 * 60 * 1000) {
        status = "failed"
      } else {
        status = "processing"
      }
    }

    return { ...post, status }
  },
})

export const engagements = authQuery({
  args: {
    postId: v.id("posts"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId)
    if (!post) {
      throw new NotFoundError()
    }
    if (post.userId !== ctx.userId) {
      throw new UnauthorizedError()
    }

    return await ctx.db
      .query("engagements")
      .withIndex("byPostAndUser", (q) => q.eq("postId", args.postId))
      .paginate(args.paginationOpts)
  },
})

export const latest = authQuery({
  args: {
    podId: v.id("pods"),
    take: v.number(),
  },
  handler: async (ctx, args) => {
    if (args.take <= 0 || 6 <= args.take) {
      throw new BadRequestError("Invalid take value, must be between 1 and 6.")
    }

    const posts = await ctx.db
      .query("posts")
      .withIndex("byPod", (q) => q.eq("podId", args.podId))
      .order("desc")
      .filter((q) => q.eq(q.field("status"), "completed"))
      .take(args.take)

    const profiles = await pmap(posts, async ({ userId }) =>
      getOneFrom(ctx.db, "linkedinProfiles", "byUserAndAccount", userId, "userId"),
    )

    return zip(posts, profiles)
      .map(([post, profile]) =>
        profile ? { ...post, profile: omit(profile, ["unipileId"]) } : null,
      )
      .filter((p) => p != null)
      .reverse()
  },
})

export const submit = authMutation({
  args: {
    podId: v.id("pods"),
    url: v.string(),
    reactionTypes: v.array(v.string()),
    targetCount: v.number(),
    minDelay: v.number(),
    maxDelay: v.number(),
  },
  handler: async (ctx, args) => {
    const { userId } = ctx
    const { podId } = args

    const { data, success, error } = SubmitPostSchema.safeParse(args)
    if (!success) {
      return { error: z.prettifyError(error) }
    }

    const { url } = data
    const urn = parsePostURN(data.url)
    if (!urn) {
      return { error: "Failed to parse URL, please try again." }
    }

    const [pod, membership, account, profile] = await Promise.all([
      ctx.db.get(podId),
      ctx.db
        .query("memberships")
        .withIndex("byUserAndPod", (q) => q.eq("userId", userId).eq("podId", podId))
        .first(),
      getOneFrom(ctx.db, "linkedinAccounts", "byUserAndAccount", userId, "userId"),
      getOneFrom(ctx.db, "linkedinProfiles", "byUserAndAccount", userId, "userId"),
    ])

    if (!pod) {
      return { error: "Pod not found, try reloading the page." }
    }
    if (!membership) {
      return { error: "You are not a member of this pod." }
    }
    if (!profile || !account) {
      return { error: "Please connect your LinkedIn." }
    }
    if (needsReconnection(account.status)) {
      return { error: "Please reconnect your LinkedIn." }
    }

    if (
      await ctx.db
        .query("posts")
        .withIndex("byURL", (q) => q.eq("url", data.url))
        .first()
    ) {
      return { error: "Cannot resubmit a post." }
    }

    const { ok, retryAfter } = await rateLimiter.limit(ctx, "submitPost", {
      key: `[podId:${podId}]-[userId:${userId}]`,
    })
    if (!ok) {
      return { error: `Too many requests, please try again in ${humanizeDuration(retryAfter)}.` }
    }

    const postId = await ctx.db.insert("posts", {
      userId,
      podId,
      url,
      urn,
      status: "pending",
    })

    const [post, memberCount] = await Promise.all([
      ctx.db.get(postId),
      podMemberCount.count(ctx, { namespace: podId }),
    ])
    if (!post) {
      return { error: "Failed to create post, please try again." }
    }

    const workflowId = await workflow.start(
      ctx,
      internal.workflows.engagement.perform,
      {
        ...data,
        postId,
        userId,
        podId,
        urn,
        targetCount: derivePostTargetCount(args.targetCount, memberCount),
      },
      {
        context: { postId },
        onComplete: internal.workflows.engagement.onWorkflowComplete,
        startAsync: true,
      },
    )

    await Promise.all([
      podPostCount.insert(ctx, post),
      ctx.db.patch(postId, { workflowId, status: "processing" }),
    ])

    return { success: "Watch out for the results!" }
  },
})
