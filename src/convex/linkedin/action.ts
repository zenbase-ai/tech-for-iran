import { generateObject } from "ai"
import { v } from "convex/values"
import { DateTime } from "luxon"
import * as z from "zod"
import { internal } from "@/convex/_generated/api"
import { internalAction } from "@/convex/_generated/server"
import { errorMessage } from "@/convex/_helpers/errors"
import { authAction, connectedAction } from "@/convex/_helpers/server"
import { env } from "@/lib/env.mjs"
import { profileURL } from "@/lib/linkedin"
import { CONVEX_SITE_URL } from "@/lib/server/convex"
import { openai } from "@/lib/server/openai"
import { UnipileAPIError, unipile } from "@/lib/server/unipile"
import { url } from "@/lib/utils"
import { settingsConfig } from "@/schemas/settings-config"

export const syncOwn = connectedAction({
  args: {},
  handler: async (ctx) => {
    const { unipileId } = ctx.account
    try {
      await ctx.runAction(internal.linkedin.action.sync, { unipileId })
      return { success: "Profile synced!" }
    } catch (error) {
      console.error("linkedin:action/syncOwn", error)
      return { error: errorMessage(error) }
    }
  },
})

export const sync = internalAction({
  args: {
    unipileId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const { location, ...data } = await ctx.runAction(internal.unipile.profile.getOwn, args)

      await ctx.runMutation(internal.linkedin.mutate.updateProfile, {
        ...args,
        providerId: data.provider_id,
        firstName: data.first_name,
        lastName: data.last_name,
        picture: data.profile_picture_url,
        url: profileURL(data),
        headline: data.occupation,
        location,
      })

      const timezone = await ctx.runAction(internal.linkedin.action.inferTimezone, { location })
      await ctx.runMutation(internal.linkedin.mutate.updateAccountTimezone, { ...args, timezone })

      const status = "SYNC_SUCCESS"
      await ctx.runMutation(internal.linkedin.mutate.upsertAccountStatus, { ...args, status })
    } catch (error) {
      if (error instanceof UnipileAPIError) {
        await ctx.runMutation(internal.linkedin.mutate.upsertAccountStatus, {
          ...args,
          status: "ERROR",
        })
      }
      throw error
    }
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
          notify_url: `${CONVEX_SITE_URL}/webhooks/unipile`,
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

const TimezoneSchema = z.object({
  timezone: z.string(), // IANA timezone identifier
  confidence: z.enum(["high", "medium", "low"]),
})

export const inferTimezone = internalAction({
  args: {
    location: v.string(),
  },
  handler: async (_ctx, { location }): Promise<string> => {
    // Empty/invalid location → default
    if (!location || location.trim() === "") {
      return settingsConfig.defaultValues.timezone
    }

    const { object } = await generateObject({
      model: openai("gpt-5-mini-2025-08-07"),
      schema: TimezoneSchema,
      prompt: `Infer the IANA timezone identifier from this LinkedIn location: "${location}"

Examples:
- "San Francisco, California" → America/Los_Angeles
- "London, UK" → Europe/London
- "New York, NY" → America/New_York
- "Remote" → America/New_York (default for ambiguous)
- "Tokyo" → Asia/Tokyo

Return the most likely IANA timezone. If uncertain, default to America/New_York.`,
    })

    return object.timezone
  },
})
