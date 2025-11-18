import { paginationOptsValidator } from "convex/server"
import { v } from "convex/values"
import { getManyFrom, getOneFrom } from "convex-helpers/server/relationships"
import { omit, pick, zip } from "es-toolkit"
import { internalQuery } from "@/convex/_generated/server"
import { BadRequestError, NotFoundError } from "@/convex/_helpers/errors"
import { authQuery, memberQuery } from "@/convex/_helpers/server"
import { pflatMap, pmap } from "@/lib/parallel"

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

export const list = authQuery({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { paginationOpts }) => {
    const { userId } = ctx

    const posts = await ctx.db
      .query("posts")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .paginate(paginationOpts)

    const page = await pflatMap(posts.page, async (post) => {
      if (!post.text) {
        return []
      }

      const [pod, stats] = await Promise.all([
        ctx.db.get(post.podId),
        ctx.db
          .query("stats")
          .withIndex("by_userId", (q) => q.eq("userId", userId).eq("postId", post._id))
          .first(),
      ])

      if (!pod) {
        return []
      }

      return [
        {
          post: omit(post, ["author"]),
          stats,
          pod,
        },
      ]
    })

    return { ...posts, page }
  },
})
