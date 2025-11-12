import { v } from "convex/values"
import * as z from "zod"
import { parsePostURN, SubmitPost } from "@/app/(auth)/pods/[podId]/posts/_submit/schema"
import { internal } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { internalAction } from "@/convex/_generated/server"
import { errorMessage } from "@/convex/_helpers/errors"
import { connectedMemberAction } from "@/convex/_helpers/server"
import { unipile } from "@/lib/server/unipile"

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
      const { error: limitError } = await ctx.runMutation(internal.posts.mutate.submitLimit, {
        userId,
      })
      if (limitError) {
        return { postId: null, error: limitError }
      }
    }

    const { urn, error: validateError } = await ctx.runAction(internal.posts.action.validateURL, {
      unipileId: ctx.account.unipileId,
      url: data.url,
    })
    if (urn === null) {
      return { postId: null, error: validateError }
    }

    return await ctx.runMutation(internal.posts.mutate.create, { userId, podId, urn, ...data })
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
