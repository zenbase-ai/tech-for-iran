import { v } from "convex/values"
import { getOneFrom } from "convex-helpers/server/relationships"
import { clamp, pick, zip } from "es-toolkit"
import * as z from "zod"
import {
  calculateTargetCount,
  parsePostURN,
  SubmitPost,
} from "@/app/(auth)/pods/[podId]/posts/-submit/schema"
import { internal } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { internalAction } from "@/convex/_generated/server"
import { podMembers } from "@/convex/aggregates"
import { BadRequestError, errorMessage } from "@/convex/helpers/errors"
import {
  connectedMemberAction,
  internalMutation,
  memberQuery,
  update,
} from "@/convex/helpers/server"
import { rateLimitError, ratelimits } from "@/convex/ratelimits"
import { workflow } from "@/convex/workflows/engagement"
import { pmap } from "@/lib/parallel"
import { unipile } from "@/lib/server/unipile"

type Latest = Array<{
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

const submitArgs = {
  podId: v.id("pods"),
  url: v.string(),
  reactionTypes: v.array(v.string()),
  targetCount: v.number(),
  minDelay: v.number(),
  maxDelay: v.number(),
}
type Submit = { postId: Id<"posts">; success: string } | { postId: null; error: string }

export const submit = connectedMemberAction({
  args: submitArgs,
  handler: async (ctx, { podId, ...args }): Promise<Submit> => {
    const { userId } = ctx
    const { data, success, error: parseError } = SubmitPost.safeParse(args)
    if (!success) {
      return { postId: null, error: errorMessage(parseError) }
    }

    if (ctx.account.role !== "sudo") {
      const { error: limitError } = await ctx.runMutation(internal.fns.posts.submitLimit, {
        userId,
      })
      if (limitError) {
        return { postId: null, error: limitError }
      }
    }

    const { urn, error: validateError } = await ctx.runAction(internal.fns.posts.validateURL, {
      unipileId: ctx.account.unipileId,
      url: data.url,
    })
    if (urn === null) {
      return { postId: null, error: validateError }
    }

    return await ctx.runMutation(internal.fns.posts.create, { userId, podId, urn, ...data })
  },
})

export const submitLimit = internalMutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    const ratelimit = await ratelimits.limit(ctx, "submitPost", { key: userId })
    if (!ratelimit.ok) {
      return { error: rateLimitError(ratelimit) }
    }
    return { error: null }
  },
})

export const create = internalMutation({
  args: {
    userId: v.string(),
    urn: v.string(),
    ...submitArgs,
  },
  handler: async (ctx, args) => {
    if (await getOneFrom(ctx.db, "posts", "by_urn", args.urn)) {
      return { postId: null, error: "Cannot resubmit a post." }
    }

    const postId = await ctx.db.insert(
      "posts",
      update(pick(args, ["userId", "podId", "url", "urn"])),
    )

    const memberCount = await podMembers.count(ctx, { bounds: { prefix: [args.podId] } })
    const { min: minTargetCount, max: maxTargetCount } = calculateTargetCount(memberCount)
    const targetCount = clamp(args.targetCount, minTargetCount, maxTargetCount)

    const context = { postId }
    const onComplete = internal.workflows.engagement.onComplete
    const workflowId = await workflow.start(
      ctx,
      internal.workflows.engagement.perform,
      { ...args, postId, targetCount },
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

const ValidateURL = z.union([
  z.object({ urn: z.null(), error: z.string() }),
  z.object({ urn: z.string(), error: z.union([z.string(), z.null()]) }),
])
type ValidateURL = z.infer<typeof ValidateURL>

export const validateURL = internalAction({
  args: {
    unipileId: v.string(),
    url: v.string(),
  },
  handler: async (_ctx, { unipileId, url }): Promise<ValidateURL> => {
    const urn = parsePostURN(url)
    if (!urn) {
      return { urn, error: "Failed to parse URL, please try again." }
    }

    try {
      const searchParams = { account_id: unipileId }
      const data = await unipile
        .get<FetchUnipilePost>(`api/v1/posts/${urn}`, { searchParams })
        .json()

      if (data.is_repost) {
        return { urn, error: "Cannot boost a repost." }
      }
      return { urn, error: null }
    } catch (error) {
      return { urn, error: errorMessage(error) }
    }
  },
})
