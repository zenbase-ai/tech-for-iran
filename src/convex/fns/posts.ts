import { v } from "convex/values"
import { getOneFrom } from "convex-helpers/server/relationships"
import { pick, zip } from "es-toolkit"
import {
  derivePostTargetCount,
  parsePostURN,
  SubmitPostSchema,
} from "@/app/(auth)/pods/[podId]/posts/-submit/schema"
import { internal } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { podMembers } from "@/convex/aggregates"
import { BadRequestError, errorMessage } from "@/convex/helpers/errors"
import {
  connectedAction,
  connectedMemberMutation,
  memberQuery,
  update,
} from "@/convex/helpers/server"
import { rateLimitError, ratelimits } from "@/convex/ratelimits"
import { workflow } from "@/convex/workflows/engagement"
import { pmap } from "@/lib/parallel"
import { unipile } from "@/lib/server/unipile"

export type Latest = Array<{
  firstName: string
  lastName: string
  picture: string
  url: string
  _creationTime: number
}>

export const latest = memberQuery({
  args: {
    podId: v.id("pods"),
    take: v.number(),
  },
  handler: async (ctx, { podId, take }): Promise<Latest> => {
    if (take <= 0 || 10 < take) {
      throw new BadRequestError("Invalid take value, must be between 1 and 10.")
    }

    const posts = await ctx.db
      .query("posts")
      .withIndex("by_podId", (q) => q.eq("podId", podId).eq("status", "success"))
      .order("desc")
      .take(take)

    const profiles = await pmap(posts, async ({ userId }) =>
      getOneFrom(ctx.db, "linkedinProfiles", "by_userId", userId),
    )

    return zip(profiles, posts).flatMap(([profile, { url, _creationTime }]) => {
      if (!profile) {
        return []
      }

      return [{ url, _creationTime, ...pick(profile, ["firstName", "lastName", "picture"]) }]
    })
  },
})

type Submit = { postId: Id<"posts">; success: string } | { postId: null; error: string }

export const submit = connectedMemberMutation({
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
    const postId = await ctx.db.insert("posts", update({ userId, podId, url, urn }))

    const memberCount = await podMembers.count(ctx, { bounds: { prefix: [podId] } })
    const targetCount = derivePostTargetCount(args.targetCount, memberCount)
    if (targetCount <= 0) {
      return { postId: null, error: "Target count must be greater than 0." }
    }

    const context = { postId }
    const onComplete = internal.workflows.engagement.onComplete
    const workflowId = await workflow.start(
      ctx,
      internal.workflows.engagement.perform,
      { ...data, postId, userId, podId, urn, targetCount },
      { context, onComplete, startAsync: true },
    )

    await ctx.db.patch(postId, { workflowId, status: "pending" })

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

export const validateURL = connectedAction({
  args: {
    url: v.string(),
  },
  handler: async (ctx, { url }): Promise<ValidateURL> => {
    const urn = parsePostURN(url)
    if (!urn) {
      return { success: false, error: "Failed to parse URL, please try again." }
    }

    try {
      const searchParams = { account_id: ctx.account.unipileId }
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
