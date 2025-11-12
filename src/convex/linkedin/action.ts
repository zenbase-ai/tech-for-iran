import { v } from "convex/values"
import { internal } from "@/convex/_generated/api"
import { internalAction } from "@/convex/_generated/server"
import { errorMessage } from "@/convex/_helpers/errors"
import { authAction, connectedAction } from "@/convex/_helpers/server"
import { unipile } from "@/lib/server/unipile"

export const refreshState = connectedAction({
  args: {},
  handler: async (ctx) => {
    const { unipileId } = ctx.account
    try {
      await ctx.runAction(internal.linkedin.action.refreshProfile, { unipileId })
      return { success: "Your profile has been refreshed." }
    } catch (error) {
      return { error: errorMessage(error) }
    }
  },
})

export const disconnectAccount = authAction({
  args: {},
  handler: async (ctx) => {
    const { userId } = ctx
    const { unipileId } = await ctx.runMutation(internal.linkedin.mutate.deleteAccount, {
      userId,
    })
    try {
      await unipile.delete<void>(`api/v1/accounts/${unipileId}`)
      await ctx.runAction(internal.linkedin.action.deleteUnipileAccount, { unipileId })
      return { success: "LinkedIn disconnected." }
    } catch (error) {
      return { error: errorMessage(error) }
    }
  },
})

type FetchUnipileAccount = {
  object: "AccountOwnerProfile"
  first_name: string
  last_name: string
  profile_picture_url: string
  public_profile_url?: string
  public_identifier: string
  location?: string
  headline?: string
}

export const refreshProfile = internalAction({
  args: {
    unipileId: v.string(),
  },
  handler: async (ctx, { unipileId }) => {
    const data = await unipile
      .get<FetchUnipileAccount>("api/v1/users/me", { searchParams: { account_id: unipileId } })
      .json()

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

export const deleteUnipileAccount = internalAction({
  args: {
    unipileId: v.string(),
  },
  handler: async (_ctx, { unipileId }) =>
    await unipile.delete<void>(`api/v1/accounts/${unipileId}`),
})
