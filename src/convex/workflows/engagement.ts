import { vWorkflowId, WorkflowManager } from "@convex-dev/workflow"
import { vResultValidator } from "@convex-dev/workpool"
import { v } from "convex/values"
import { getManyFrom, getOneFrom } from "convex-helpers/server/relationships"
import { randomInt, sample } from "es-toolkit"
import * as z from "zod"
import { components, internal } from "@/convex/_generated/api"
import { internalAction, internalQuery } from "@/convex/_generated/server"
import { errorMessage } from "@/convex/helpers/errors"
import { internalMutation, update } from "@/convex/helpers/server"
import { accountActionsRateLimit, ratelimits } from "@/convex/ratelimits"
import { LinkedInReaction, requiresConnection } from "@/lib/linkedin"
import { pflatMap } from "@/lib/parallel"
import { UnipileAPIError, unipile } from "@/lib/server/unipile"

export const workflow = new WorkflowManager(components.workflow, {
  workpoolOptions: {
    maxParallelism: 32,
    defaultRetryBehavior: {
      maxAttempts: 3,
      initialBackoffMs: 500,
      base: 2,
    },
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
  args: {
    userId: v.string(),
    postId: v.id("posts"),
    podId: v.id("pods"),
    urn: v.string(),
    reactionTypes: v.array(v.string()),
    targetCount: v.number(),
    minDelay: v.number(),
    maxDelay: v.number(),
  },
  handler: async (
    step,
    { userId, postId, podId, urn, reactionTypes, targetCount, minDelay, maxDelay },
  ) => {
    const skipUserIds = [userId]

    await step.runMutation(internal.workflows.engagement.patchPostStatus, {
      postId,
      status: "processing",
    })

    let i = 1

    for (; i <= targetCount; i++) {
      const [runAfter, reactionType] = await step.runAction(
        internal.workflows.engagement.performOneRandomParams,
        { i, minDelay, maxDelay, reactionTypes },
      )

      const success = await step.runAction(
        internal.workflows.engagement.performOne,
        { podId, postId, urn, reactionType, skipUserIds },
        { runAfter }, // runAfter is relative to now; not workflow start
      )

      if (success === null) {
        break
      }
    }
  },
})

export const performOneRandomParams = internalAction({
  args: {
    i: v.number(), // cache buster
    minDelay: v.number(),
    maxDelay: v.number(),
    reactionTypes: v.array(v.string()),
  },
  handler: async (_ctx, args): Promise<[number, LinkedInReaction]> => {
    const delay = randomInt(args.minDelay, args.maxDelay + 1) * 1000
    const jitter = randomInt(0, 2500 + 1)
    const reactionType = LinkedInReaction.parse(sample(args.reactionTypes) ?? "like")

    return [delay + jitter, reactionType]
  },
})

type PerformOne =
  | boolean // was the action successful?
  | null // unable to find an available account

export const performOne = internalAction({
  args: {
    podId: v.id("pods"),
    postId: v.id("posts"),
    urn: v.string(),
    reactionType: v.string(),
    skipUserIds: v.array(v.string()),
  },
  handler: async (ctx, { podId, urn, reactionType, postId, skipUserIds }): Promise<PerformOne> => {
    const account = await ctx.runQuery(internal.workflows.engagement.selectAvailableAccount, {
      podId,
      postId,
      skipUserIds,
    })
    if (!account) {
      return null
    }

    const { userId, unipileId } = account
    const error = await ctx.runAction(internal.workflows.engagement.postUnipileReaction, {
      unipileId,
      urn,
      reactionType,
    })

    await ctx.runMutation(internal.workflows.engagement.upsertEngagement, {
      userId,
      postId,
      reactionType,
      error,
    })

    if (error) {
      console.error("[workflows/engagement:performOne]", {
        reactionType,
        podId,
        postId,
      })
      return false
    }

    return true
  },
})

const SelectAvailableAccount = z.union([
  z.null(),
  z.object({
    unipileId: z.string(),
    userId: z.string(),
  }),
])

type SelectAvailableAccount = z.infer<typeof SelectAvailableAccount>

export const selectAvailableAccount = internalQuery({
  args: {
    podId: v.id("pods"),
    postId: v.id("posts"),
    skipUserIds: v.array(v.string()),
  },
  handler: async (ctx, { podId, postId, skipUserIds }): Promise<SelectAvailableAccount> => {
    const members = await getManyFrom(ctx.db, "memberships", "by_podId", podId)

    const availableAccounts = await pflatMap(members, async ({ userId }) => {
      if (skipUserIds.includes(userId)) {
        return []
      }

      const didAccountAlreadyEngage = await ctx.db
        .query("engagements")
        .withIndex("by_postId", (q) => q.eq("postId", postId).eq("userId", userId))
        .first()
      if (didAccountAlreadyEngage) {
        return []
      }

      const account = await getOneFrom(ctx.db, "linkedinAccounts", "by_userId", userId)
      if (!account || requiresConnection(account?.status)) {
        return []
      }

      const { ok } = await ratelimits.check(ctx, ...accountActionsRateLimit(account))
      if (!ok) {
        return []
      }

      const { success, data, error } = SelectAvailableAccount.safeParse(account)
      if (!success) {
        console.error("[workflows/engagement:selectAvailableAccount]", error)
        return []
      }

      return [data]
    })

    const account = sample(availableAccounts)
    if (!account) {
      return null
    }

    return account
  },
})

const PostUnipileReaction = z.union([
  z.object({ object: z.literal("ReactionAdded") }),
  z.object({
    title: z.string(),
    detail: z.string(),
    instance: z.string(),
    status: z.number(),
    type: z.string(),
  }),
])

type PostUnipileReaction = z.infer<typeof PostUnipileReaction>

export const postUnipileReaction = internalAction({
  args: {
    unipileId: v.string(),
    urn: v.string(),
    reactionType: v.string(),
  },
  handler: async (_ctx, { unipileId, urn, reactionType }): Promise<string | null> => {
    try {
      const response = await unipile
        .post<PostUnipileReaction>("api/v1/posts/reaction", {
          json: {
            account_id: unipileId,
            post_id: urn,
            reaction_type: LinkedInReaction.parse(reactionType),
          },
        })
        .json()

      console.info(
        `[workflows/engagement:postUnipileReaction] ${unipileId} ${urn} ${reactionType}`,
        response,
      )
      return null
    } catch (error: unknown) {
      if (error instanceof UnipileAPIError) {
        const status = error.data.status
        const isTransient = [429, 500, 503, 504].includes(status)
        if (isTransient) {
          throw error // triggers retries
        }
      }

      return errorMessage(error)
    }
  },
})

export const upsertEngagement = internalMutation({
  args: {
    postId: v.id("posts"),
    userId: v.string(),
    reactionType: v.string(),
    error: v.union(v.string(), v.null()),
  },
  handler: async (ctx, { postId, userId, reactionType, ...args }) => {
    const success = !args.error
    const error = args.error ?? undefined
    const state = { reactionType, success, error }

    const engagement = await ctx.db
      .query("engagements")
      .withIndex("by_postId", (q) => q.eq("postId", postId).eq("userId", userId))
      .first()

    if (engagement) {
      await ctx.db.patch(engagement._id, state)
      return engagement._id
    }

    return await ctx.db.insert("engagements", { postId, userId, ...state })
  },
})

export const patchPostStatus = internalMutation({
  args: {
    postId: v.id("posts"),
    status: v.union(
      v.literal("canceled"),
      v.literal("processing"),
      v.literal("failed"),
      v.literal("success"),
    ),
  },
  handler: async (ctx, { postId, status }) => await ctx.db.patch(postId, update({ status })),
})

export const onComplete = internalMutation({
  args: {
    workflowId: vWorkflowId,
    result: vResultValidator,
    context: v.object({
      postId: v.id("posts"),
    }),
  },
  handler: async (ctx, { workflowId, result: { kind: status }, context: { postId } }) => {
    await Promise.all([workflow.cleanup(ctx, workflowId), ctx.db.patch(postId, update({ status }))])
    return null
  },
})
