import { v } from "convex/values"
import { internal } from "@/convex/_generated/api"
import { internalAction } from "@/convex/_generated/server"
import { errorMessage } from "@/convex/_helpers/errors"
import { authAction, connectedAction } from "@/convex/_helpers/server"

export const syncOwn = connectedAction({
  args: {},
  handler: async (ctx) => {
    const { unipileId } = ctx.account
    try {
      await ctx.runAction(internal.linkedin.action.sync, { unipileId })
      return { success: "Sync complete." }
    } catch (error) {
      return { error: errorMessage(error) }
    }
  },
})

export const disconnectOwn = authAction({
  args: {},
  handler: async (ctx) => {
    const { userId } = ctx
    const { unipileId } = await ctx.runMutation(internal.linkedin.mutate.disconnect, {
      userId,
    })
    try {
      await ctx.runAction(internal.unipile.account.disconnect, { unipileId })
      return { success: "LinkedIn disconnected." }
    } catch (error) {
      return { error: errorMessage(error) }
    }
  },
})

export const sync = internalAction({
  args: {
    unipileId: v.string(),
  },
  handler: async (ctx, { unipileId }) => {
    const data = await ctx.runAction(internal.unipile.profile.getOwn, { unipileId })

    await ctx.runMutation(internal.linkedin.mutate.upsertProfile, {
      unipileId,
      firstName: data.first_name,
      lastName: data.last_name,
      picture: data.profile_picture_url,
      url: data.public_profile_url || `https://www.linkedin.com/in/${data.public_identifier}`,
      location: data.location,
      headline: data.headline,
    })
  },
})
