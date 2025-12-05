import { vWorkflowId, type WorkflowId, WorkflowManager } from "@convex-dev/workflow"
import { vResultValidator } from "@convex-dev/workpool"
import { v } from "convex/values"
import { pick } from "es-toolkit"
import { components, internal } from "@/convex/_generated/api"
import { internalMutation, update } from "@/convex/_helpers/server"
import { AvailableMember } from "./query"

export const workflow = new WorkflowManager(components.workflow, {
  workpoolOptions: {
    maxParallelism: 16,
    defaultRetryBehavior: {
      maxAttempts: 3,
      initialBackoffMs: 500,
      base: 2,
    },
  },
})

const workflowArgs = {
  userId: v.string(),
  podId: v.id("pods"),
  postId: v.id("posts"),
  skipUserIds: v.array(v.string()),
  urn: v.string(),
  reactionTypes: v.array(v.string()),
  comments: v.boolean(),
}

type Start = {
  workflowId: WorkflowId
}

export const start = internalMutation({
  args: workflowArgs,
  handler: async (ctx, args): Promise<Start> => {
    const workflowId = await workflow.start(ctx, internal.engagement.workflow.perform, args, {
      context: pick(args, ["userId", "postId"]),
      onComplete: internal.engagement.workflow.onComplete,
      startAsync: true,
    })

    await ctx.db.patch(args.postId, update({ workflowId, status: "pending" } as const))
    return { workflowId }
  },
})

/**
 * Main engagement workflow - durable background job for scheduled LinkedIn reactions
 *
 * WORKFLOW CONFIGURATION:
 * - Uses workpool with maxParallelism: 10 (max 10 concurrent workflow executions)
 * - Retry behavior: max 3 attempts, 250ms initial backoff, exponential base 2
 * - Transient API errors (429, 500, 503, 504) trigger automatic retries
 *
 * EXECUTION FLOW:
 * 1. Sets post status to "processing"
 * 2. Loops up to `targetCount` times attempting engagements:
 *    a. Generates random delay and reaction type:
 *       - Delay = randomInt(minDelay, maxDelay + 1) * 1000ms + randomInt(0, 2501)ms jitter
 *       - Reaction type randomly selected from user-provided options
 *    b. Schedules `performOne` action with delay (relative to current step execution time, not workflow start)
 *    c. `performOne` returns:
 *       - true: engagement succeeded (inserted to DB, counted via aggregates)
 *       - false: API call failed (logs error, workflow continues to next iteration)
 *       - null: no available accounts (breaks loop early, stops trying)
 * 3. On workflow completion, `onComplete` handler updates post status:
 *    - Maps workflow result kind ("success"/"failed"/"canceled") to post status
 *
 * ENGAGEMENT COUNTING:
 * - Total engagements tracked via aggregates (postEngagements) - NOT stored directly on posts
 * - Aggregates automatically maintain counts as engagements are inserted
 * - Query aggregate to get actual engagement count for a post
 * - Note: successCount/failedCount fields in posts schema are unused (legacy)
 *
 * ACCOUNT SELECTION (selectAvailableAccount):
 * - Excludes: post author, users who already engaged on this post
 * - Filters out: unhealthy accounts (needsConnection status), users at daily limit
 * - Daily limit check: counts engagements in past 24 hours vs account.maxActions
 * - Randomly samples one account from available candidates
 * - Returns null if no accounts available (triggers early workflow termination)
 *
 * TIMING DETAILS:
 * - Each reaction scheduled with independent delay relative to when that step runs
 * - Delays help avoid LinkedIn rate limits and make engagement appear organic
 * - Example: minDelay=1, maxDelay=30 → 1-30 seconds + 0-2.5s jitter per reaction
 */
export const perform = workflow.define({
  args: workflowArgs,
  handler: async (step, { podId, postId, skipUserIds, urn, reactionTypes, comments }) => {
    const minDelay = 10
    const maxDelay = 30

    const [targetCount] = await Promise.all([
      step.runQuery(internal.engagement.query.targetCount, { podId }),
      step.runMutation(internal.engagement.mutate.patchPostStatus, {
        postId,
        status: "processing",
      }),
    ])

    const post = await step.runQuery(internal.posts.query.get, { postId })

    for (let iteration = 0; iteration < targetCount; iteration++) {
      const availableMembers = await step.runQuery(internal.engagement.query.availableMembers, {
        podId,
        skipUserIds,
      })
      if (availableMembers.length === 0) {
        break // no available profiles, stop trying
      }

      const { account, profile } = AvailableMember.parse(
        await step.runAction(internal.engagement.generate.sample, { items: availableMembers })
      )

      const { unipileId, userId } = account
      skipUserIds.push(userId)

      const [reactDelay, reactionType] = await Promise.all([
        step.runAction(internal.engagement.generate.delay, { minDelay, maxDelay }),
        step.runAction(internal.engagement.generate.reaction, { reactionTypes }),
      ])

      const react = await step.runAction(
        internal.unipile.post.react,
        { unipileId, urn, reactionType },
        { runAfter: reactDelay }
      )
      await step.runMutation(internal.engagement.mutate.upsertEngagement, {
        userId,
        postId,
        reactionType,
        error: react.error,
      })

      if (comments) {
        const [commentDelay, commentText] = await Promise.all([
          step.runAction(internal.engagement.generate.delay, { minDelay, maxDelay }),
          step.runAction(internal.engagement.generate.comment, {
            profile,
            reactionType,
            post: pick(post, ["text", "author"]),
            prompt: account.commentPrompt,
          }),
        ])

        if (commentText) {
          const comment = await step.runAction(
            internal.unipile.post.comment,
            { unipileId, urn, commentText },
            { runAfter: commentDelay }
          )
          await step.runMutation(internal.engagement.mutate.upsertEngagement, {
            userId,
            postId,
            reactionType: "comment",
            error: comment.error,
          })
        }
      }
    }
  },
})

export const onComplete = internalMutation({
  args: {
    workflowId: vWorkflowId,
    result: vResultValidator,
    context: v.object({
      userId: v.string(),
      postId: v.id("posts"),
    }),
  },
  handler: async (ctx, { workflowId, context, result }) => {
    await workflow.cleanup(ctx, workflowId)

    const { userId, postId } = context
    const { kind: status } = result
    await ctx.db.patch(postId, update({ status }))

    const oneMinute = 60 * 1000
    const oneHour = 60 * oneMinute
    const oneDay = 24 * oneHour

    for (const syncDelay of [
      15 * oneMinute,
      30 * oneMinute,
      60 * oneMinute,
      4 * oneHour,
      12 * oneHour,
    ]) {
      await ctx.scheduler.runAfter(syncDelay, internal.posts.action.sync, { postId })
    }

    await ctx.scheduler.runAfter(oneDay, internal.emails.postEngagement, { userId, postId })

    return true
  },
})
