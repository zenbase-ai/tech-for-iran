import { TableAggregate } from "@convex-dev/aggregate"
import { components } from "@/convex/_generated/api"
import type { DataModel, Id } from "@/convex/_generated/dataModel"

/**
 * Aggregate for counting total signatories.
 *
 * Used to display "1,247 founders have signed the letter" on the success state
 * and wall header. Uses null key since we just need a total count.
 */
export const signatoryCount = new TableAggregate<{
  Key: null
  DataModel: DataModel
  TableName: "signatories"
}>(components.signatoryCount, {
  sortKey: () => null,
})

/**
 * Aggregate for counting upvotes per signatory.
 *
 * Namespaced by signatoryId so we can efficiently count upvotes for each
 * signatory and keep their upvoteCount field in sync via triggers.
 */
export const signatoryUpvotes = new TableAggregate<{
  Namespace: Id<"signatories">
  Key: null
  DataModel: DataModel
  TableName: "upvotes"
}>(components.signatoryUpvotes, {
  namespace: (doc) => doc.signatoryId,
  sortKey: () => null,
})

/**
 * Aggregate for counting referrals per signatory.
 *
 * Namespaced by referredBy so we can efficiently count how many people
 * each signatory has referred (for "Kaz has inspired 47 others" stat).
 */
export const signatoryReferrals = new TableAggregate<{
  Namespace: Id<"signatories">
  Key: null
  DataModel: DataModel
  TableName: "signatories"
}>(components.signatoryReferrals, {
  namespace: (doc) => doc.referredBy ?? ("" as Id<"signatories">),
  sortKey: () => null,
})
