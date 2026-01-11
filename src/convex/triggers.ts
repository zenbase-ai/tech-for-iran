import { Triggers } from "convex-helpers/server/triggers"
import type { DataModel } from "@/convex/_generated/dataModel"
import { signatureCount, signatureReferrals, upvoteCount } from "./aggregates"

/**
 * Database triggers for keeping aggregates in sync with table changes.
 *
 * These triggers automatically update aggregate counts when documents are
 * inserted, updated, or deleted. This ensures denormalized counts (like
 * upvoteCount on signatures) stay in sync with the actual data.
 *
 * Usage: Wrap mutations with triggers.wrapDB to enable automatic updates.
 * See convex-helpers documentation for more details.
 */

export const triggers = new Triggers<DataModel>()

// Keep signatureCount aggregate in sync with signatures table
triggers.register("signatures", signatureCount.trigger())

// Keep signatureReferrals aggregate in sync with signatures table
// This counts how many signatures each person has referred
triggers.register("signatures", signatureReferrals.trigger())

// Keep upvoteCount aggregate in sync with upvotes table
triggers.register("upvotes", upvoteCount.trigger())
