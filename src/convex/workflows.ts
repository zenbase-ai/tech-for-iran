import { vWorkflowId, WorkflowManager } from "@convex-dev/workflow"
import { vResultValidator } from "@convex-dev/workpool"
import { v } from "convex/values"
import { randomInt, sample } from "es-toolkit"
import { components, internal } from "./_generated/api"
import { internalAction, internalMutation } from "./_generated/server"
import { postEngagementCount } from "./aggregates"

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

// Internal action to send a single reaction via Unipile AND log it in the database atomically
export const sendReactionAndLog = internalAction({
  args: {
    podId: v.id("pods"),
    postUrn: v.string(),
    reactionType: v.string(),
    postId: v.id("posts"),
    excludeUserIds: v.array(v.string()),
  },
  handler: async (ctx, args): Promise<{ success: boolean; userId?: string; error?: string }> => {
    try {
      // Step 1: Select an available pod member
      const member = await ctx.runQuery(internal.pods.selectAvailableMember, {
        podId: args.podId,
        excludeUserIds: args.excludeUserIds,
      })

      if (!member) {
        return {
          success: false,
          error: "No available members",
        }
      }

      // Step 2: Send reaction via Unipile API
      await ctx.runAction(internal.linkedin.react, {
        accountId: member.unipileId,
        postUrn: args.postUrn,
        reactionType: args.reactionType,
      })

      // Step 3: If API call succeeded, log engagement in database
      await ctx.runMutation(internal.posts.createEngagement, {
        postId: args.postId,
        userId: member.userId,
        reactionType: args.reactionType,
      })

      return { success: true, userId: member.userId }
    } catch (error) {
      // If either step fails, return failure (no partial success)
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  },
})

// Internal mutation to handle workflow completion
export const handleWorkflowCompletion = internalMutation({
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
    let workflowSuccessCount = 0
    let failedCount = 0

    if (kind === "success") {
      // Workflow completed successfully
      status = "completed"
      workflowSuccessCount = args.result.returnValue.successCount
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
    if (status === "completed" && workflowSuccessCount !== aggregateCount) {
      console.error(
        `[Workflow Validation] Mismatch detected for post ${postId}: ` +
          `workflow reported ${workflowSuccessCount} successes, ` +
          `but aggregate shows ${aggregateCount} total engagements`,
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
export const postEngagementWorkflow = workflow.define({
  args: {
    postId: v.id("posts"),
    userId: v.string(),
    podId: v.id("pods"),
    urn: v.string(),
    reactionTypes: v.array(v.string()), // Array of allowed reaction types
    targetCount: v.optional(v.number()), // Default 40
    minDelay: v.optional(v.number()), // Default 5000ms (5 seconds)
    maxDelay: v.optional(v.number()), // Default 15000ms (15 seconds)
  },
  handler: async (step, args): Promise<{ successCount: number; failedCount: number }> => {
    const targetCount = args.targetCount ?? 40
    const minDelay = args.minDelay ?? 5000
    const maxDelay = args.maxDelay ?? 15000
    let successCount = 0
    let failedCount = 0

    // Track users who have already reacted (to prevent duplicates)
    const excludeUserIds = [args.userId]

    // Send reactions with delays
    // We use runAfter to schedule each reaction with cumulative delays
    let cumulativeDelayMs = 0

    for (let i = 0; i < targetCount; i++) {
      // Random delay between minDelay and maxDelay
      const delayMs = randomInt(minDelay, maxDelay)
      cumulativeDelayMs += delayMs

      // Choose a random reaction type from the allowed types
      const reactionType = sample(args.reactionTypes) ?? "like"

      // Send the reaction via Unipile AND log it in the database atomically
      const result = await step.runAction(
        internal.workflows.sendReactionAndLog,
        { podId: args.podId, postUrn: args.urn, reactionType, postId: args.postId, excludeUserIds },
        { name: `Send ${reactionType} reaction #${i + 1}`, runAfter: cumulativeDelayMs },
      )

      if (result.success && result.userId) {
        successCount++
        // Add this user to the exclude list so they don't get selected again
        excludeUserIds.push(result.userId)
      } else {
        failedCount++
        // If we can't find any available members, stop trying
        if (result.error === "No available members") {
          break
        }
      }
    }

    // Status is now computed dynamically based on engagements
    return { successCount, failedCount }
  },
})
