import { v } from "convex/values"
import { internalAction } from "@/convex/_generated/server"
import { unipile } from "@/lib/server/unipile"

type GetOwn = {
  object: "AccountOwnerProfile"
  first_name: string
  last_name: string
  profile_picture_url: string
  public_profile_url?: string
  public_identifier: string
  location?: string
  headline?: string
}

export const getOwn = internalAction({
  args: {
    unipileId: v.string(),
  },
  handler: async (_ctx, { unipileId }) =>
    await unipile
      .get<GetOwn>("api/v1/users/me", { searchParams: { account_id: unipileId } })
      .json(),
})
