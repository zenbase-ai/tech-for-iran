import { vWorkflowId, WorkflowManager } from "@convex-dev/workflow"
import { vResultValidator } from "@convex-dev/workpool"
import { v } from "convex/values"
import { getOneFrom } from "convex-helpers/server/relationships"
import { randomInt, sample } from "es-toolkit"
import { DateTime } from "luxon"
import type { DeepNonNullable, DeepRequired } from "ts-essentials"
import { components, internal } from "./_generated/api"
import { internalAction, internalMutation, internalQuery } from "./_generated/server"
import { postEngagementCount } from "./aggregates"
import { pmap } from "./helpers/collections"
import { ConflictError, errorMessage } from "./helpers/errors"
import { type LinkedInReactionType, needsReconnection } from "./helpers/linkedin"
import { UnipileAPIError, unipile } from "./helpers/unipile"

export const workflow = new WorkflowManager(components.workflow, {
  workpoolOptions: {
    maxParallelism: 10,
    defaultRetryBehavior: {
      maxAttempts: 3,
      initialBackoffMs: 250,
      base: 2,
    },
  },
})

/**
 * Main engagement workflow
 *
 * DUAL COUNTING SYSTEM:
 * This workflow uses both manual counting AND aggregates by design:
 *
 * 1. Manual Counts (successCount/failedCount in workflow):
 *    - Tracks what THIS specific workflow run accomplished
 *    - Includes failure tracking (failed API calls, no available members)
 *    - Useful for debugging specific workflow executions
 *    - Returned as workflow result and compared against aggregate
 *
 * 2. Aggregate Count (postEngagementCount from aggregates.ts):
 *    - Source of truth for total engagements across ALL attempts
 *    - Automatically maintained by @convex-dev/aggregate
 *    - Only counts successful engagements (inserted into DB)
 *    - Survives workflow retries, failures, and cancellations
 *
 * In handleWorkflowCompletion, we validate the manual count against the aggregate
 * and always store the aggregate count as authoritative in the post document.
 */
export const perform = workflow.define({
  args: {
    postId: v.id("posts"),
    userId: v.string(),
    podId: v.id("pods"),
    urn: v.string(),
    reactionTypes: v.array(v.string()), // Array of allowed reaction types
    targetCount: v.optional(v.number()), // Default 40
    minDelay: v.optional(v.number()), // Default 5s
    maxDelay: v.optional(v.number()), // Default 15s
  },
  handler: async (step, args): Promise<{ successCount: number; failedCount: number }> => {
    const targetCount = args.targetCount ?? 40
    // Incoming minDelay/maxDelay are provided in SECONDS by submit validator; convert to ms here
    const minDelaySeconds = args.minDelay ?? 5
    const maxDelaySeconds = args.maxDelay ?? 15
    let successCount = 0
    let failedCount = 0

    // Track users who have already reacted (to prevent duplicates)
    const excludeUserIds = [args.userId]

    // Send reactions with delays (schedule each step after a per-iteration jitter)

    for (let i = 0; i < targetCount; i++) {
      // Random delay between minDelayMs and maxDelayMs (randomInt uses exclusive upper bound)
      const delayMs = randomInt(minDelaySeconds, maxDelaySeconds + 1) * 1000

      // Choose a random reaction type from the allowed types
      const reactionType = sample(args.reactionTypes) ?? "like"

      // Send the reaction via Unipile AND log it in the database atomically
      const result = await step.runAction(
        internal.engage.performOne,
        { podId: args.podId, postUrn: args.urn, reactionType, postId: args.postId, excludeUserIds },
        // Because we await each action, runAfter is relative to now; use the per-iteration delay only
        { name: `Send ${reactionType} reaction #${i + 1}`, runAfter: delayMs },
      )

      if ("userId" in result) {
        excludeUserIds.push(result.userId)
        successCount++
      } else if (result.error === "UNAVAILABLE_MEMBER") {
        break
      } else {
        failedCount++
      }
    }

    // Status is now computed dynamically based on engagements
    return { successCount, failedCount }
  },
})

// Internal action to send a single reaction via Unipile AND log it in the database atomically
export type PerformOneResult = { userId: string } | { error: unknown; message?: string }

export const performOne = internalAction({
  args: {
    podId: v.id("pods"),
    postUrn: v.string(),
    reactionType: v.string(),
    postId: v.id("posts"),
    excludeUserIds: v.array(v.string()),
  },
  handler: async (ctx, args): Promise<PerformOneResult> => {
    // Step 1: Select an available pod member
    const account = await ctx.runQuery(internal.engage.availableAccount, {
      podId: args.podId,
      postId: args.postId,
      excludeUserIds: args.excludeUserIds,
    })

    if (!account) {
      return { error: "UNAVAILABLE_MEMBER" }
    }

    // Step 2: Send reaction via Unipile API
    // Note: internal.linkedin.react throws on transient errors to trigger retry
    const [success, data] = await ctx.runAction(internal.engage.react, {
      accountId: account.unipileId,
      postUrn: args.postUrn,
      reactionType: args.reactionType,
    })
    if (!success) {
      return { error: data, message: "Failed to send reaction to LinkedIn" }
    }

    // Step 3: Log engagement in database
    try {
      await ctx.runMutation(internal.engage.log, {
        userId: account.userId,
        postId: args.postId,
        reactionType: args.reactionType,
      })

      return { userId: account.userId }
    } catch (dbError) {
      // API succeeded but DB logging failed - orphaned reaction
      return {
        error: errorMessage(dbError),
        message: "Failed to log reaction to database",
      }
    }
  },
})

export const availableAccount = internalQuery({
  args: {
    podId: v.id("pods"),
    postId: v.id("posts"),
    excludeUserIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const excludeUserIds = new Set(args.excludeUserIds)

    const members = await ctx.db
      .query("memberships")
      .withIndex("byPod", (q) => q.eq("podId", args.podId))
      .collect()

    // Check each candidate for availability in parallel
    const startOfDay = DateTime.utc().startOf("day").toMillis()

    const availableAccounts = (
      await pmap(members, async ({ userId }) => {
        if (excludeUserIds.has(userId)) {
          return null
        }

        // Check LinkedIn account health status
        const account = await getOneFrom(
          ctx.db,
          "linkedinAccounts",
          "byUserAndAccount",
          userId,
          "userId",
        )

        if (!account?.userId || needsReconnection(account.status)) {
          return null
        }

        // Already engaged on this post?
        const alreadyEngaged = await ctx.db
          .query("engagements")
          .withIndex("byPostAndUser", (q) => q.eq("postId", args.postId).eq("userId", userId))
          .first()

        if (alreadyEngaged) {
          return null
        }

        // Count today's engagements for this user
        const engagementsToday = await ctx.db
          .query("engagements")
          .withIndex("byUser", (q) => q.eq("userId", userId).gte("_creationTime", startOfDay))
          .collect()

        // Return candidate if user hasn't hit their daily limit
        if (engagementsToday.length >= account.maxActions) {
          return null
        }

        return account as DeepRequired<DeepNonNullable<typeof account>>
      })
    ).filter(Boolean)

    const account = sample(availableAccounts)
    if (!account) {
      return null
    }

    return account
  },
})

/**
 * Add a reaction to a LinkedIn post
 * POST /api/v1/posts/reaction
 *
 * Throws on transient errors (429, 500, 503, 504) to trigger retry.
 * Converts permanent errors to regular errors for caller handling.
 */
export const react = internalAction({
  args: {
    accountId: v.string(),
    postUrn: v.string(),
    reactionType: v.string(),
  },
  handler: async (_ctx, args): Promise<[boolean, unknown]> => {
    try {
      const response = await unipile("POST", "/api/v1/posts/reaction", {
        account_id: args.accountId,
        post_id: args.postUrn,
        reaction_type: args.reactionType.toLowerCase() as LinkedInReactionType,
      })

      return [true, response]
    } catch (error: unknown) {
      if (error instanceof UnipileAPIError) {
        const status = error.data.status
        const isTransient = [429, 500, 503, 504].includes(status)
        if (isTransient) {
          throw error // triggers retries
        }
      }

      return [false, errorMessage(error)]
    }
  },
})

export const log = internalMutation({
  args: {
    postId: v.id("posts"),
    userId: v.string(),
    reactionType: v.string(),
  },
  handler: async (ctx, args) => {
    // Check for duplicate engagement
    const existing = await ctx.db
      .query("engagements")
      .withIndex("byPostAndUser", (q) => q.eq("postId", args.postId).eq("userId", args.userId))
      .first()

    if (existing) {
      throw new ConflictError()
    }

    const engagementId = await ctx.db.insert("engagements", args)

    // Update aggregate
    const engagement = await ctx.db.get(engagementId)
    if (engagement) {
      await postEngagementCount.insert(ctx, engagement)
    }

    return engagementId
  },
})

// Internal mutation to handle workflow completion
export const onWorkflowComplete = internalMutation({
  args: {
    workflowId: vWorkflowId,
    result: vResultValidator,
    context: v.object({
      postId: v.id("posts"),
    }),
  },
  handler: async (ctx, args) => {
    const { postId } = args.context
    const { kind } = args.result

    // Determine final status based on workflow result
    let status: "completed" | "failed" | "canceled"
    let successCount = 0
    let failedCount = 0

    if (kind === "success") {
      // Workflow completed successfully
      status = "completed"
      successCount = args.result.returnValue.successCount
      failedCount = args.result.returnValue.failedCount
    } else if (kind === "failed") {
      // Workflow failed with an error
      status = "failed"
    } else {
      // Workflow was canceled
      status = "canceled"
    }

    // Validate against aggregate (source of truth for total engagements)
    const aggregateCount = await postEngagementCount.count(ctx, { namespace: postId })

    // Log any mismatches for debugging (helps catch issues with workflow logic)
    if (status === "completed" && successCount !== aggregateCount) {
      console.error(
        `[Workflow Validation] Mismatch detected for post ${postId}: workflow reported ${successCount} successes, but aggregate shows ${aggregateCount} total engagements`,
      )
    }

    // Update the post with final status and metrics
    // Use aggregate count as authoritative (survives retries, always accurate)
    await ctx.db.patch(postId, {
      status,
      successCount: aggregateCount, // Aggregate is source of truth
      failedCount, // Only workflow knows about failures (not inserted to DB)
      completedAt: Date.now(),
    })
  },
})
