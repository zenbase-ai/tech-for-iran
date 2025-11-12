import { vWorkflowId, WorkflowManager } from "@convex-dev/workflow"
import { vResultValidator } from "@convex-dev/workpool"
import { v } from "convex/values"
import { getManyFrom, getOneFrom } from "convex-helpers/server/relationships"
import { randomInt, sample } from "es-toolkit"
import { DateTime } from "luxon"
import * as z from "zod"
import { components, internal } from "@/convex/_generated/api"
import { internalAction, internalMutation, internalQuery } from "@/convex/_generated/server"
import { aggregatePostEngagements } from "@/convex/aggregates"
import { update } from "@/convex/helpers/convex"
import { errorMessage, NotFoundError } from "@/convex/helpers/errors"
import { LinkedInReaction, needsReconnection } from "@/lib/linkedin"
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
 * DUAL COUNTING SYSTEM:
 * This workflow uses both manual counting AND aggregates by design:
 *
 * 1. Manual Counts (successCount/failedCount in workflow):
 *    - Tracks what THIS specific workflow run accomplished
 *    - Includes failure tracking (failed API calls, no available members)
 *    - Useful for debugging specific workflow executions
 *    - Returned as workflow result and compared against aggregate
 *
 * 2. Aggregate Count (engagementCount from aggregates.ts):
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
        console.error("[workflows/engagement:performOne]", {
          reactionType,
          podId,
          postId,
        })

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
    if (error) {
      return false
    }

    await ctx.runMutation(internal.workflows.engagement.insertEngagement, {
      userId,
      postId,
      reactionType,
    })

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
    const startOfDay = DateTime.utc().startOf("day").toMillis()

    const members = await getManyFrom(ctx.db, "memberships", "by_podId", podId)

    const availableAccounts = await pflatMap(members, async ({ userId }) => {
      if (skipUserIds.includes(userId)) {
        return []
      }

      // Check LinkedIn account health status
      const account = await getOneFrom(ctx.db, "linkedinAccounts", "by_userId", userId)

      const canAccountEngage = !!account?.userId && !needsReconnection(account?.status)
      if (!canAccountEngage) {
        return []
      }

      const didAccountAlreadyEngage = await ctx.db
        .query("engagements")
        .withIndex("by_postId", (q) => q.eq("postId", postId).eq("userId", userId))
        .first()

      if (didAccountAlreadyEngage) {
        return []
      }

      // Count today's engagements for this user
      const accountEngagementsToday = await ctx.db
        .query("engagements")
        .withIndex("by_userId", (q) => q.eq("userId", userId).gte("_creationTime", startOfDay))
        .collect()

      // Return candidate if user hasn't hit their daily limit
      if (accountEngagementsToday.length >= account.maxActions) {
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

export const insertEngagement = internalMutation({
  args: {
    postId: v.id("posts"),
    userId: v.string(),
    reactionType: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("engagements")
      .withIndex("by_postId", (q) => q.eq("postId", args.postId).eq("userId", args.userId))
      .first()
    if (existing) {
      return existing._id
    }

    const engagementId = await ctx.db.insert("engagements", args)

    const engagement = await ctx.db.get(engagementId)
    if (!engagement) {
      throw new NotFoundError()
    }

    await aggregatePostEngagements.insert(ctx, engagement)

    return engagementId
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
