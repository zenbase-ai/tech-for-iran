import { WorkflowManager } from "@convex-dev/workflow"
import { v } from "convex/values"
import { randomInt, sample, sampleSize } from "es-toolkit"
import { components, internal } from "./_generated/api"
import { internalAction, mutation } from "./_generated/server"
import type { Doc } from "./_generated/dataModel"

export const workflow = new WorkflowManager(components.workflow, {
  workpoolOptions: {
    maxParallelism: 10, // Limit concurrent reactions to avoid rate limits
  },
})

// Mutation to start the engagement workflow
export const startEngagementWorkflow = mutation({
  args: {
    postId: v.id("posts"),
    authorUserId: v.id("profiles"),
    squadId: v.id("squads"),
    postUrl: v.string(),
    reactionTypes: v.array(v.string()),
    targetCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const workflowId = await workflow.start(ctx, internal.workflows.handlePostEngagement, args)
    return workflowId
  },
})

// Internal action to send a single reaction via Unipile
export const sendReaction = internalAction({
  args: {
    unipileAccountId: v.string(),
    postUrn: v.string(),
    reactionType: v.string(),
  },
  handler: async (ctx, args) =>
    await ctx.runAction(internal.unipile.addReactionAction, {
      accountId: args.unipileAccountId,
      postUrn: args.postUrn,
      reactionType: args.reactionType,
    }),
})

// Main engagement workflow
export const handlePostEngagement = workflow.define({
  args: {
    postId: v.id("posts"),
    authorUserId: v.id("profiles"),
    squadId: v.id("squads"),
    postUrl: v.string(),
    reactionTypes: v.array(v.string()), // Array of allowed reaction types
    targetCount: v.optional(v.number()), // Default 40
  },
  handler: async (step, args) => {
    const targetCount = args.targetCount ?? 40
    let successCount = 0
    let failedCount = 0

    // Step 1: Extract post URN from URL
    const postUrn = await step.runAction(
      internal.workflows.extractPostUrn,
      { postUrl: args.postUrl },
      { name: "Extract post URN from URL" },
    )

    if (!postUrn) {
      // Update post status to failed
      await step.runMutation(
        internal.mutations.updatePostStatus,
        { postId: args.postId, status: "failed" },
        { name: "Update post status to failed (invalid URN)" },
      )
      return { success: 0, failed: 0 }
    }

    // Step 2: Update post status to processing
    await step.runMutation(
      internal.mutations.updatePostStatus,
      { postId: args.postId, status: "processing" },
      { name: "Update post status to processing" },
    )

    // Step 3: Get available squad members (excluding post author, respecting daily limits)
    const availableMembers = await step.runQuery(
      internal.queries.getAvailableSquadMembers,
      { squadId: args.squadId, excludeUserId: args.authorUserId },
      { name: "Get available squad members" },
    )

    if (availableMembers.length === 0) {
      // No members available, mark as completed
      await step.runMutation(
        internal.mutations.updatePostStatus,
        { postId: args.postId, status: "completed" },
        { name: "Update post status to completed (no members)" },
      )
      return { success: 0, failed: 0 }
    }

    // Step 4: Select random members (up to targetCount)
    const selectedMembers = sampleSize(
      availableMembers,
      Math.min(targetCount, availableMembers.length),
    ) as Doc<"profiles">[]

    // Step 5: Send reactions with delays
    // We use runAfter to schedule each reaction with cumulative delays
    let cumulativeDelayMs = 0

    for (let i = 0; i < selectedMembers.length; i++) {
      const member = selectedMembers[i]

      try {
        // Random delay between 5-15 seconds
        const delayMs = randomInt(5000, 15000)
        cumulativeDelayMs += delayMs

        // Choose a random reaction type from the allowed types
        const reactionType = sample(args.reactionTypes) ?? "LIKE"
        const { unipileAccountId } = member

        // Send the reaction via Unipile with cumulative delay
        await step.runAction(
          internal.workflows.sendReaction,
          { unipileAccountId, postUrn, reactionType },
          {
            name: `Send ${reactionType} from ${member.clerkUserId}`,
            runAfter: cumulativeDelayMs,
            retry: {
              maxAttempts: 3,
              initialBackoffMs: 1000,
              base: 2,
            },
          },
        )

        // Log the engagement in the database
        await step.runMutation(
          internal.mutations.createEngagement,
          { postId: args.postId, reactorId: member._id, reactionType },
          { name: `Log engagement for ${member.clerkUserId}`, runAfter: cumulativeDelayMs + 500 }, // Run slightly after the reaction
        )

        successCount++
      } catch (error) {
        console.error(`Failed to send reaction for user ${member.clerkUserId}:`, error)
        failedCount++
        // Continue with next member even if this one fails
      }
    }

    // Step 6: Update post status to completed (after all reactions)
    await step.runMutation(
      internal.mutations.updatePostStatus,
      { postId: args.postId, status: "completed" },
      { name: "Update post status to completed", runAfter: cumulativeDelayMs + 1000 }, // Run after all reactions complete
    )

    return { success: successCount, failed: failedCount }
  },
})
