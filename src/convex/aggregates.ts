import { TableAggregate } from "@convex-dev/aggregate"
import { components } from "@/convex/_generated/api"
import type { DataModel, Id } from "@/convex/_generated/dataModel"

/**
 * Aggregate for counting total signatories.
 *
 * Used to display "1,247 founders have signed the letter" on the success state
 * and wall header. Uses null key since we just need a total count.
 */
export const signatureCount = new TableAggregate<{
  Key: null
  DataModel: DataModel
  TableName: "signatures"
}>(components.signatureCount, {
  sortKey: () => null,
})

/**
 * Aggregate for counting referrals per signature.
 *
 * Namespaced by referredBy so we can efficiently count how many people
 * each signature has referred (for "Kaz has inspired 47 others" stat).
 */
export const signatureReferrals = new TableAggregate<{
  Namespace: Id<"signatures">
  Key: null
  DataModel: DataModel
  TableName: "signatures"
}>(components.signatureReferrals, {
  namespace: (doc) => doc.referredBy ?? ("" as Id<"signatures">),
  sortKey: () => null,
})

/**
 * Aggregate for counting total upvotes.
 *
 * Used to display total vote count in the navigation bar.
 * Uses null key since we just need a total count.
 */
export const upvoteCount = new TableAggregate<{
  Key: null
  DataModel: DataModel
  TableName: "upvotes"
}>(components.upvoteCount, {
  sortKey: () => null,
})
