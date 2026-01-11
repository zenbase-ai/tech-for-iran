import { v } from "convex/values"
import { mutation } from "@/convex/_helpers/server"

export const toggle = mutation({
  args: {
    signatureId: v.id("signatures"),
    anonId: v.string(),
  },
  handler: async (ctx, { signatureId, anonId }) => {
    const signature = await ctx.db.get(signatureId)
    if (!signature) {
      return
    }

    const existing = await ctx.db
      .query("upvotes")
      .withIndex("by_signatureId_anonId", (q) =>
        q.eq("signatureId", signatureId).eq("anonId", anonId)
      )
      .first()

    if (existing) {
      await ctx.db.delete(existing._id)
      await ctx.db.patch(signatureId, { upvoteCount: Math.max(0, signature.upvoteCount - 1) })
    } else {
      await ctx.db.insert("upvotes", { signatureId, anonId })
      await ctx.db.patch(signatureId, { upvoteCount: signature.upvoteCount + 1 })
    }
  },
})
