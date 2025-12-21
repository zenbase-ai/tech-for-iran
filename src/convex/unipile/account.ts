import { v } from "convex/values"
import { internalAction } from "@/convex/_generated/server"
import { unipile } from "@/convex/unipile/client"

export const disconnect = internalAction({
  args: {
    unipileId: v.string(),
  },
  handler: async (_ctx, { unipileId }) => {
    await unipile.delete<void>(`accounts/${unipileId}`)
    return true
  },
})

type AccountsData = {
  items: unknown[]
}

export const count = internalAction({
  handler: async (): Promise<number> =>
    await unipile
      .get<AccountsData>("accounts", { searchParams: { limit: 250 } })
      .json()
      .then(
        ({ items }) => items.length,
        (error) => {
          console.error("unipile:accounts", error)
          return 0
        }
      ),
})
