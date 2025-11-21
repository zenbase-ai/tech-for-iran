import { v } from "convex/values"
import { internalAction } from "@/convex/_generated/server"
import { errorMessage } from "@/convex/_helpers/errors"
import { unipile } from "@/lib/server/unipile"

type Disconnect = {
  error?: string
}

export const disconnect = internalAction({
  args: {
    unipileId: v.string(),
  },
  handler: async (_ctx, { unipileId }): Promise<Disconnect> => {
    try {
      await unipile.delete<void>(`api/v1/accounts/${unipileId}`)
      return {}
    } catch (error) {
      return { error: errorMessage(error) }
    }
  },
})
