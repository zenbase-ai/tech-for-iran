import { v } from "convex/values"
import { getOneFrom } from "convex-helpers/server/relationships"
import { omit, zip } from "es-toolkit"
import {
  derivePostTargetCount,
  parsePostURN,
  SubmitPostSchema,
} from "@/app/(auth)/pods/[podId]/posts/-submit/schema"
import { api, internal } from "@/convex/_generated/api"
import { aggregateMembers, aggregatePosts } from "@/convex/aggregates"
import { authAction, authMutation, authQuery } from "@/convex/helpers/convex"
import { BadRequestError, errorMessage, NotFoundError } from "@/convex/helpers/errors"
import { needsReconnection } from "@/convex/helpers/linkedin"
import { unipile } from "@/convex/helpers/unipile"
import { workflow } from "@/convex/workflows/engagement"
import { pmap } from "../helpers/collections"
import { rateLimitMessage, ratelimits } from "@/convex/ratelimits"

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
      return { success: null, error: errorMessage(error) }
    }

    const urn = parsePostURN(data.url)
    if (!urn) {
      return { success: null, error: "Failed to parse URL, please try again." }
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
      throw new NotFoundError()
    }
    if (!membership) {
      return { success: null, error: "You are not a member of this pod." }
    }
    if (!profile) {
      return { success: null, error: "Please connect your LinkedIn." }
    }
    if (needsReconnection(account?.status)) {
      return { success: null, error: "Please reconnect your LinkedIn." }
    }
    if (await getOneFrom(ctx.db, "posts", "byURN", urn, "urn")) {
      return { success: null, error: "Cannot resubmit a post." }
    }

    {
      const { ok, retryAfter } = await ratelimits.check(ctx, "submitPost", {
        key: `[podId:${podId}]-[userId:${userId}]`,
      })
      if (!ok) {
        return { success: null, error: rateLimitMessage(retryAfter) }
      }
    }

    const { url } = data
    const postId = await ctx.db.insert("posts", { userId, podId, url, urn })

    const [post, membersCount] = await Promise.all([
      ctx.db.get(postId),
      aggregateMembers.count(ctx, { namespace: podId }),
    ])
    if (!post) {
      return { success: null, error: "Failed to create post, please try again." }
    }

    {
      const { ok, retryAfter } = await ratelimits.limit(ctx, "submitPost", {
        key: `[podId:${podId}]-[userId:${userId}]`,
      })
      if (!ok) {
        return { success: null, error: rateLimitMessage(retryAfter) }
      }
    }

    const targetCount = derivePostTargetCount(args.targetCount, membersCount)
    const context = { postId }
    const onComplete = internal.workflows.engagement.onWorkflowComplete
    const workflowId = await workflow.start(
      ctx,
      internal.workflows.engagement.perform,
      { ...data, postId, userId, podId, urn, targetCount },
      { context, onComplete, startAsync: true },
    )

    await Promise.all([
      ctx.db.patch(postId, { workflowId, status: "pending" }),
      aggregatePosts.insert(ctx, post),
    ])

    return { success: "Watch out for the results!", error: null }
  },
})

type FetchUnipilePost = {
  object: "Post"
  provider: "LINKEDIN"
  share_url: string
  text: string
  parsed_datetime: string
  is_repost: boolean
  author: {
    public_identifier: string
    id: string
    name: string
    is_company: boolean
    headline: string
  }
}

type ValidateURL = { success: true; error: null } | { success: false; error: string }

export const validateURL = authAction({
  args: {
    url: v.string(),
  },
  handler: async (ctx, args): Promise<ValidateURL> => {
    const urn = parsePostURN(args.url)
    if (!urn) {
      return { success: false, error: "Failed to parse URL, please try again." }
    }
    const { account, needsReconnection } = await ctx.runQuery(api.fns.linkedin.getState, {})
    if (!account) {
      return { success: false, error: "Please connect your LinkedIn." }
    }
    if (needsReconnection) {
      return { success: false, error: "Please reconnect your LinkedIn." }
    }
    try {
      const searchParams = { account_id: account.unipileId }
      const data = await unipile
        .get<FetchUnipilePost>(`api/v1/posts/${urn}`, { searchParams })
        .json()

      if (data.is_repost) {
        return { success: false, error: "Cannot boost a repost." }
      }
      return { success: true, error: null }
    } catch (error) {
      return { success: false, error: errorMessage(error) }
    }
  },
})
