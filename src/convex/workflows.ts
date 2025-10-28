import { WorkflowManager } from "@convex-dev/workflow"
import { components } from "./_generated/api"

export const workflow = new WorkflowManager(components.workflow, {
  workpoolOptions: {
    maxParallelism: 10, // Limit concurrent reactions to avoid rate limits
  },
})

// // Mutation to start the engagement workflow
// export const startEngagementWorkflow = mutation({
//   args: {
//     postId: v.id("posts"),
//     authorUserId: v.string(),
//     squadId: v.id("squads"),
//     postUrl: v.string(),
//     reactionTypes: v.array(v.string()),
//     targetCount: v.optional(v.number()),
//   },
//   handler: async (ctx, args): Promise<string> => {
//     const workflowId: string = await workflow.start(
//       ctx,
//       internal.workflows.handlePostEngagement,
//       args,
//     )

//     // Store workflow ID in the post record for tracking
//     await ctx.db.patch(args.postId, { workflowId })

//     return workflowId
//   },
// })

// // Internal action to send a single reaction via Unipile AND log it in the database atomically
// export const sendReactionAndLog = internalAction({
//   args: {
//     unipileAccountId: v.string(),
//     postUrn: v.string(),
//     reactionType: v.string(),
//     postId: v.id("posts"),
//     userId: v.string(),
//   },
//   handler: async (ctx, args): Promise<{ success: boolean; error?: string }> => {
//     try {
//       // Step 1: Send reaction via Unipile API
//       await ctx.runAction(internal.unipile.addReaction, {
//         accountId: args.unipileAccountId,
//         postUrn: args.postUrn,
//         reactionType: args.reactionType,
//       })

//       // Step 2: If API call succeeded, log engagement in database
//       await ctx.runMutation(internal.mutations.createEngagement, {
//         postId: args.postId,
//         userId: args.userId,
//         reactionType: args.reactionType,
//       })

//       return { success: true }
//     } catch (error) {
//       // If either step fails, return failure (no partial success)
//       return {
//         success: false,
//         error: error instanceof Error ? error.message : String(error),
//       }
//     }
//   },
// })

// // Main engagement workflow
// export const handlePostEngagement = workflow.define({
//   args: {
//     postId: v.id("posts"),
//     authorUserId: v.string(),
//     squadId: v.id("squads"),
//     postUrl: v.string(),
//     reactionTypes: v.array(v.string()), // Array of allowed reaction types
//     targetCount: v.optional(v.number()), // Default 40
//   },
//   handler: async (step, args) => {
//     const targetCount = args.targetCount ?? 40
//     let successCount = 0
//     let failedCount = 0

//     // Step 1: Extract post URN from URL
//     const postUrn = parsePostURN(args.postUrl)
//     if (!postUrn) {
//       // Invalid URN - workflow will end without engagements (status computed as "failed")
//       return { success: 0, failed: 0 }
//     }

//     // Step 3: Get available squad members (excluding post author, respecting daily limits)
//     const availableMembers = await step.runQuery(
//       internal.queries.getAvailableSquadMembers,
//       { squadId: args.squadId, excludeUserId: args.authorUserId },
//       { name: "Get available squad members" },
//     )

//     if (availableMembers.length === 0) {
//       // No members available - workflow ends without engagements
//       return { success: 0, failed: 0 }
//     }

//     // Step 4: Select random members (up to targetCount)
//     const selectedMembers = sampleSize(
//       availableMembers,
//       Math.min(targetCount, availableMembers.length),
//     )

//     // Step 5: Send reactions with delays
//     // We use runAfter to schedule each reaction with cumulative delays
//     let cumulativeDelayMs = 0

//     for (let i = 0; i < selectedMembers.length; i++) {
//       const member = selectedMembers[i]

//       // Random delay between 5-15 seconds
//       const delayMs = randomInt(5000, 15000)
//       cumulativeDelayMs += delayMs

//       // Choose a random reaction type from the allowed types
//       const reactionType = sample(args.reactionTypes) ?? "LIKE"
//       const { unipileAccountId } = member

//       // Defensive check for unipileAccountId (should always exist due to query filter)
//       if (!unipileAccountId) {
//         console.error(`Member ${member.userId} missing unipileAccountId, skipping`)
//         failedCount++
//         continue
//       }

//       // Send the reaction via Unipile AND log it in the database atomically
//       const result = await step.runAction(
//         internal.workflows.sendReactionAndLog,
//         {
//           unipileAccountId,
//           postUrn,
//           reactionType,
//           postId: args.postId,
//           userId: member.userId,
//         },
//         {
//           name: `Send ${reactionType} from ${member.userId}`,
//           runAfter: cumulativeDelayMs,
//           retry: { maxAttempts: 3, initialBackoffMs: 1000, base: 2 },
//         },
//       )

//       if (result.success) {
//         successCount++
//       } else {
//         console.error(`Failed to send reaction for user ${member.userId}:`, result.error)
//         failedCount++
//       }
//     }

//     // Status is now computed dynamically based on engagements
//     return { success: successCount, failed: failedCount }
//   },
// })
