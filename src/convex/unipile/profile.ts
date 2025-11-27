import { v } from "convex/values"
import { internalAction } from "@/convex/_generated/server"
import { unipile } from "@/lib/server/unipile"

type BaseProfile = {
  provider_id: string
  public_identifier: string
  first_name: string
  last_name: string
  headline: string
  summary: string
  location: string
  profile_picture_url: string
}

type GetOwn = BaseProfile & {
  object: "AccountOwnerProfile"
  public_profile_url: string
}

export const getOwn = internalAction({
  args: {
    unipileId: v.string(),
  },
  handler: async (_ctx, { unipileId: account_id }) =>
    await unipile.get<GetOwn>("api/v1/users/me", { searchParams: { account_id } }).json(),
})

type Get = BaseProfile & {
  object: "UserProfile"
  provider: "LINKEDIN"
  is_relationship: boolean
  profile_picture_url_large: string
  invitation?: {
    type: "SENT" | "RECEIVED"
  }
}

export const get = internalAction({
  args: {
    unipileId: v.string(),
    id: v.string(),
  },
  handler: async (_ctx, { id, unipileId: account_id }) =>
    await unipile.get<Get>(`api/v1/users/${id}`, { searchParams: { account_id } }).json(),
})

type SendConnectionRequest = {
  object: "UserInvitationSent"
  invitation_id: string
  usage: number
}

export const sendConnectionRequest = internalAction({
  args: {
    unipileId: v.string(),
    id: v.string(),
    message: v.optional(v.string()),
  },
  handler: async (_ctx, args) =>
    await unipile
      .post<SendConnectionRequest>("api/v1/users/invite", {
        json: {
          account_id: args.unipileId,
          provider_id: args.id,
          message: args.message,
        },
      })
      .json(),
})
