import { vWorkflowId, WorkflowManager } from "@convex-dev/workflow"
import { vResultValidator } from "@convex-dev/workpool"
import { v } from "convex/values"
import { getManyFrom, getOneFrom } from "convex-helpers/server/relationships"
import { randomInt, sample } from "es-toolkit"
import { DateTime } from "luxon"
import * as z from "zod"
import { components, internal } from "@/convex/_generated/api"
import { internalAction, internalQuery } from "@/convex/_generated/server"
import { userEngagements } from "@/convex/aggregates"
import { errorMessage } from "@/convex/helpers/errors"
import { internalMutation, update } from "@/convex/helpers/server"
import { LinkedInReaction, needsConnection } from "@/lib/linkedin"
import { pflatMap } from "@/lib/parallel"
import { UnipileAPIError, unipile } from "@/lib/server/unipile"

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
 * HOW IT WORKS:
 * 1. Sets post status to "processing"
 * 2. Loops up to `targetCount` times attempting engagements:
 *    - Generates random delay (minDelay to maxDelay + jitter) and reaction type
 *    - Schedules `performOne` action with the delay (relative to step execution time)
 *    - `performOne` returns:
 *      * true: engagement succeeded (inserted to DB, counted via aggregates)
 *      * false: API call failed (logs error, continues to next iteration)
 *      * null: no available accounts (breaks loop early - stops trying)
 * 3. On completion, `onComplete` handler updates post status based on workflow result
 *
 * ENGAGEMENT COUNTING:
 * - Total engagements are tracked via aggregates (aggregatePostEngagements)
 * - Aggregates automatically maintain counts across all workflow runs
 * - Query aggregate to get actual engagement count for a post
 * - Note: successCount/failedCount fields in posts schema exist but are unused (legacy)
 *
 * ACCOUNT SELECTION:
 * - Excludes post author and users who already engaged
 * - Only selects healthy accounts (no reconnection needed)
 * - Respects daily engagement limits (maxActions per user)
 * - Randomly selects from available candidates
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

    for (let i = 0; i < targetCount; i++) {
      const [runAfter, reactionType] = await step.runAction(
        internal.workflows.engagement.performOneRandomParams,
        { i, minDelay, maxDelay, reactionTypes },
      )

      const success = await step.runAction(
        internal.workflows.engagement.performOne,
        { podId, postId, urn, reactionType, skipUserIds },
        { runAfter }, // runAfter is relative to now; not workflow start
      )

      if (!success) {
        if (success === null) {
          break
        }
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

const SelectAvailableAccount = z.object({
  unipileId: z.string(),
  userId: z.string(),
})

type SelectAvailableAccount = z.infer<typeof SelectAvailableAccount>

export const selectAvailableAccount = internalQuery({
  args: {
    podId: v.id("pods"),
    postId: v.id("posts"),
    skipUserIds: v.array(v.string()),
  },
  handler: async (ctx, { podId, postId, skipUserIds }): Promise<SelectAvailableAccount | null> => {
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

      const canAccountEngage = !!account?.userId && !needsConnection(account?.status)
      if (!canAccountEngage) {
        return []
      }

      const accountEngagementsToday = await userEngagements.count(ctx, {
        bounds: {
          lower: { key: [userId, DateTime.utc().minus({ hours: 24 }).toMillis()], inclusive: true },
          upper: { key: [userId, DateTime.utc().toMillis()], inclusive: false },
        },
      })
      if (accountEngagementsToday >= account.maxActions) {
        return []
      }

      const { success, data, error } = SelectAvailableAccount.safeParse(account)
      if (!success) {
        console.error(error)
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

export const postUnipileReaction = internalAction({
  args: {
    unipileId: v.string(),
    urn: v.string(),
    reactionType: v.string(),
  },
  handler: async (_ctx, { unipileId, urn, reactionType }): Promise<string | undefined> => {
    try {
      await unipile.post<void>("/api/v1/posts/reaction", {
        json: {
          account_id: unipileId,
          post_id: urn,
          reaction_type: LinkedInReaction.parse(reactionType),
        },
      })
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
    const engagement = await ctx.db
      .query("engagements")
      .withIndex("by_postId", (q) => q.eq("postId", postId).eq("userId", userId))
      .first()

    const state = { reactionType, success: !args.error, error: args.error ?? undefined }

    if (engagement) {
      await ctx.db.patch(engagement._id, update(state))
      return engagement._id
    }

    return await ctx.db.insert("engagements", update({ postId, userId, ...state }))
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
  handler: async (ctx, { workflowId, result: { kind: status }, context: { postId } }) =>
    await Promise.all([
      workflow.cleanup(ctx, workflowId),
      ctx.db.patch(postId, update({ status })),
    ]),
})
