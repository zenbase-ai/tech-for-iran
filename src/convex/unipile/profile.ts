import { v } from "convex/values"
import * as z from "zod"
import { internalAction } from "@/convex/_generated/server"
import { unipile } from "@/lib/server/unipile"
import { ProfilePrototype } from "./schemas"

const OwnProfile = ProfilePrototype.extend({
  object: z.literal("AccountOwnerProfile"),
  public_profile_url: z.string(),
  occupation: z.string(),
})
type OwnProfile = z.infer<typeof OwnProfile>

export const getOwn = internalAction({
  args: {
    unipileId: v.string(),
  },
  handler: async (_ctx, { unipileId: account_id }) =>
    await unipile.get<OwnProfile>("api/v1/users/me", { searchParams: { account_id } }).json(),
})

const Profile = ProfilePrototype.extend({
  object: z.literal("UserProfile"),
  provider: z.literal("LINKEDIN"),
  is_relationship: z.boolean(),
  profile_picture_url_large: z.string(),
  headline: z.string(),
  invitation: z
    .object({
      type: z.enum(["SENT", "RECEIVED"]),
    })
    .optional(),
})
type Profile = z.infer<typeof Profile>

export const get = internalAction({
  args: {
    unipileId: v.string(),
    id: v.string(),
  },
  handler: async (_ctx, { id, unipileId: account_id }) =>
    await unipile.get<Profile>(`api/v1/users/${id}`, { searchParams: { account_id } }).json(),
})

type SendConnectionRequest = {
  object: "UserInvitationSent"
  invitation_id: string
  usage: number
}

export const sendConnectionRequest = internalAction({
  args: {
    fromUnipileId: v.string(),
    toProviderId: v.string(),
    message: v.optional(v.string()),
  },
  handler: async (_ctx, args) =>
    await unipile
      .post<SendConnectionRequest>("api/v1/users/invite", {
        json: {
          account_id: args.fromUnipileId,
          provider_id: args.toProviderId,
          message: args.message,
        },
      })
      .json(),
})
