import { Triggers } from "convex-helpers/server/triggers"
import type { DataModel } from "@/convex/_generated/dataModel"
import { signatoryCount, signatoryReferrals, signatoryUpvotes } from "./aggregates"

/**
 * Database triggers for keeping aggregates in sync with table changes.
 *
 * These triggers automatically update aggregate counts when documents are
 * inserted, updated, or deleted. This ensures denormalized counts (like
 * upvoteCount on signatories) stay in sync with the actual data.
 *
 * Usage: Wrap mutations with triggers.wrapDB to enable automatic updates.
 * See convex-helpers documentation for more details.
 */

export const triggers = new Triggers<DataModel>()

// Keep signatoryCount aggregate in sync with signatories table
triggers.register("signatories", signatoryCount.trigger())

// Keep signatoryReferrals aggregate in sync with signatories table
// This counts how many signatories each person has referred
triggers.register("signatories", signatoryReferrals.trigger())

// Keep signatoryUpvotes aggregate in sync with upvotes table
triggers.register("upvotes", signatoryUpvotes.trigger())
