import { v } from "convex/values"
import { getOneFrom } from "convex-helpers/server/relationships"
import { pick, zip } from "es-toolkit"
import { internal } from "@/convex/_generated/api"
import type { Doc } from "@/convex/_generated/dataModel"
import { internalQuery } from "@/convex/_generated/server"
import { BadRequestError, NotFoundError } from "@/convex/_helpers/errors"
import { memberQuery } from "@/convex/_helpers/server"
import { pmap } from "@/lib/utils"

export const latest = memberQuery({
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
      .withIndex("by_podId", (q) => q.eq("podId", podId).eq("status", "success"))
      .order("desc")
      .take(take)

    const profiles = await pmap(posts, async ({ userId }) =>
      getOneFrom(ctx.db, "linkedinProfiles", "by_userId", userId)
    )

    return zip(profiles, posts).flatMap(([profile, post]) => {
      if (!profile) {
        return []
      }

      return [
        {
          post: pick(post, ["_id", "podId", "url", "text", "_creationTime"]),
          profile: pick(profile, ["firstName", "lastName", "picture", "url", "headline"]),
        },
      ]
    })
  },
})

export const get = internalQuery({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, { postId }) => {
    const post = await ctx.db.get(postId)
    if (!post) {
      throw new NotFoundError()
    }

    return post
  },
})

export const stats = memberQuery({
  args: {
    podId: v.id("pods"),
    postId: v.id("posts"),
  },
  handler: async (ctx, { postId }): Promise<[Doc<"stats"> | null, Doc<"stats"> | null]> =>
    await Promise.all([
      ctx.runQuery(internal.stats.query.first, { postId }),
      ctx.runQuery(internal.stats.query.last, { postId }),
    ]),
})
