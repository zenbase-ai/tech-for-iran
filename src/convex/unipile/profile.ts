import { v } from "convex/values"
import { internalAction } from "@/convex/_generated/server"
import { unipile } from "@/convex/unipile/client"
import { errorMessage } from "@/lib/utils"
import type { OwnProfile, Posts, Profile } from "@/schemas/unipile"

export const getOwn = internalAction({
  args: {
    unipileId: v.string(),
  },
  handler: async (_ctx, { unipileId: account_id }) =>
    await unipile.get<OwnProfile>("users/me", { searchParams: { account_id } }).json(),
})

export const get = internalAction({
  args: {
    unipileId: v.string(),
    id: v.string(),
  },
  handler: async (_ctx, { id, unipileId: account_id }) =>
    await unipile.get<Profile>(`users/${id}`, { searchParams: { account_id } }).json(),
})

export const posts = internalAction({
  args: {
    unipileId: v.string(),
    id: v.string(),
    limit: v.optional(v.number()),
    isCompany: v.optional(v.boolean()),
  },
  handler: async (_, { unipileId, id, limit = 10, isCompany = false }) => {
    try {
      const data = await unipile
        .get<Posts>(`users/${id}/posts`, {
          searchParams: {
            account_id: unipileId,
            is_company: isCompany,
            limit,
          },
        })
        .json()
      return { data, error: null }
    } catch (error: unknown) {
      return { data: null, error: errorMessage(error) }
    }
  },
})

// export const sendConnectionRequest = internalAction({
//   args: {
//     unipileId: v.string(),
//     id: v.string(),
//     message: v.optional(v.string()),
//   },
//   handler: async (_ctx, { unipileId, id, message }) =>
//     await unipile
//       .post("users/invite", {
//         json: {
//           account_id: unipileId,
//           provider_id: id,
//           message,
//         },
//       })
//       .json<{
//         object: "UserInvitationSent"
//         invitation_id: string
//         usage: number
//       }>(),
// })
