import { v } from "convex/values"
import { internalAction } from "@/convex/_generated/server"
import { unipile } from "@/lib/server/unipile"

export const disconnect = internalAction({
  args: {
    unipileId: v.string(),
  },
  handler: async (_ctx, { unipileId }) => {
    await unipile.delete<void>(`api/v1/accounts/${unipileId}`)
    return true
  },
})
