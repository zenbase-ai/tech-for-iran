import { v } from "convex/values"
import { DateTime } from "luxon"
import { internal } from "@/convex/_generated/api"
import { internalAction } from "@/convex/_generated/server"
import { errorMessage } from "@/convex/_helpers/errors"
import { authAction, connectedAction } from "@/convex/_helpers/server"
import { env } from "@/lib/env.mjs"
import { linkedinProfileURL } from "@/lib/linkedin"
import { convexSiteURL } from "@/lib/server/convex"
import { unipile } from "@/lib/server/unipile"
import { url } from "@/lib/utils"

export const syncOwn = connectedAction({
  args: {},
  handler: async (ctx) => {
    const { unipileId } = ctx.account
    try {
      await ctx.runAction(internal.linkedin.action.sync, { unipileId })
      return {}
    } catch (error) {
      return { error: errorMessage(error) }
    }
  },
})

export const disconnectOwn = authAction({
  args: {},
  handler: async (ctx) => {
    const { userId } = ctx
    const { unipileId } = await ctx.runMutation(internal.linkedin.mutate.deleteAccountAndProfile, {
      userId,
    })
    try {
      await ctx.runAction(internal.unipile.account.disconnect, { unipileId })
      return {}
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
      providerId: data.provider_id,
      firstName: data.first_name,
      lastName: data.last_name,
      picture: data.profile_picture_url,
      url: linkedinProfileURL(data),
      location: data.location,
      headline: data.headline,
    })
  },
})

type GenerateHostedAuthURL = {
  url: string
}

export const generateHostedAuthURL = authAction({
  args: {
    inviteCode: v.optional(v.string()),
  },
  handler: async (ctx, { inviteCode }) =>
    await unipile
      .post<GenerateHostedAuthURL>("api/v1/hosted/accounts/link", {
        json: {
          api_url: env.UNIPILE_API_URL,
          type: "create",
          providers: ["LINKEDIN"],
          expiresOn: DateTime.utc().plus({ minutes: 10 }).toISO(),
          name: ctx.userId, // so we can identify the account in the webhook
          success_redirect_url: url("/connect/callback", {
            searchParams: { inviteCode, success: "Account connected!" },
          }),
          failure_redirect_url: url("/connect", {
            searchParams: { inviteCode, error: "Something went wrong. Please try again." },
          }),
          notify_url: `${convexSiteURL}/webhooks/unipile`,
          sync_limit: {
            MESSAGING: {
              chats: 0,
              messages: 0,
            },
          },
        },
      })
      .json(),
})
