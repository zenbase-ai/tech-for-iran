import { v } from "convex/values"
import { getOneFrom } from "convex-helpers/server/relationships"
import { omit, zip } from "es-toolkit"
import {
  derivePostTargetCount,
  parsePostURN,
  SubmitPostSchema,
} from "@/app/(auth)/pods/[podId]/posts/-submit/schema"
import { api, internal } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { aggregatePodMembers, aggregatePodPosts } from "@/convex/aggregates"
import { authAction, authMutation, authQuery } from "@/convex/helpers/convex"
import { BadRequestError, errorMessage, NotFoundError } from "@/convex/helpers/errors"
import { rateLimitError, ratelimits } from "@/convex/ratelimits"
import { workflow } from "@/convex/workflows/engagement"
import { needsReconnection } from "@/lib/linkedin"
import { pmap } from "@/lib/parallel"
import { unipile } from "@/lib/server/unipile"

export const latest = authQuery({
  args: {
    podId: v.id("pods"),
    take: v.number(),
  },
  handler: async (ctx, { podId, take }) => {
    if (take <= 0 || 10 < take) {
      throw new BadRequestError("Invalid take value, must be between 1 and 10.")
    }

    const posts = await ctx.db
      .query("posts")
      .withIndex("by_podId", (q) => q.eq("podId", podId))
      .order("desc")
      .filter((q) => q.eq(q.field("status"), "completed"))
      .take(take)

    const profiles = await pmap(posts, async ({ userId }) =>
      getOneFrom(ctx.db, "linkedinProfiles", "by_userId", userId),
    )

    return zip(posts, profiles).flatMap(([{ url, _creationTime }, profile]) =>
      profile ? [{ url, _creationTime, profile: omit(profile, ["unipileId"]) }] : [],
    )
  },
})

type Submit = { postId: Id<"posts">; success: string } | { postId: null; error: string }

export const submit = authMutation({
  args: {
    podId: v.id("pods"),
    url: v.string(),
    reactionTypes: v.array(v.string()),
    targetCount: v.number(),
    minDelay: v.number(),
    maxDelay: v.number(),
  },
  handler: async (ctx, { podId, ...args }): Promise<Submit> => {
    const { userId } = ctx

    const { data, success, error } = SubmitPostSchema.safeParse(args)
    if (!success) {
      return { postId: null, error: errorMessage(error) }
    }

    const urn = parsePostURN(data.url)
    if (!urn) {
      return { postId: null, error: "Failed to parse URL." }
    }

    const [pod, account, profile, membership] = await Promise.all([
      ctx.db.get(podId),
      getOneFrom(ctx.db, "linkedinAccounts", "by_userId", userId),
      getOneFrom(ctx.db, "linkedinProfiles", "by_userId", userId),
      ctx.db
        .query("memberships")
        .withIndex("by_userId", (q) => q.eq("userId", userId).eq("podId", podId))
        .first(),
    ])

    if (!pod) {
      throw new NotFoundError()
    }
    if (!membership) {
      return { postId: null, error: "You are not a member of this pod." }
    }
    if (!profile) {
      return { postId: null, error: "Please connect your LinkedIn." }
    }
    if (needsReconnection(account?.status)) {
      return { postId: null, error: "Please reconnect your LinkedIn." }
    }
    if (await getOneFrom(ctx.db, "posts", "by_urn", urn)) {
      return { postId: null, error: "Cannot resubmit a post." }
    }

    const ratelimit = await ratelimits.limit(ctx, "submitPost", {
      key: `[podId:${podId}]-[userId:${userId}]`,
    })
    if (!ratelimit.ok) {
      return { postId: null, error: rateLimitError(ratelimit) }
    }

    const { url } = data
    const postId = await ctx.db.insert("posts", { userId, podId, url, urn })

    const [post, membersCount] = await Promise.all([
      ctx.db.get(postId),
      aggregatePodMembers.count(ctx, { namespace: podId }),
    ])
    if (!post) {
      return { postId: null, error: "Failed to create post, please try again." }
    }

    const targetCount = derivePostTargetCount(args.targetCount, membersCount)
    const context = { postId }
    const onComplete = internal.workflows.engagement.onComplete
    const workflowId = await workflow.start(
      ctx,
      internal.workflows.engagement.perform,
      { ...data, postId, userId, podId, urn, targetCount },
      { context, onComplete, startAsync: true },
    )

    await Promise.all([
      ctx.db.patch(postId, { workflowId, status: "pending" }),
      aggregatePodPosts.insert(ctx, post),
    ])

    return { postId, success: "Stay tuned for the engagements!" }
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
  handler: async (ctx, { url }): Promise<ValidateURL> => {
    const urn = parsePostURN(url)
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
