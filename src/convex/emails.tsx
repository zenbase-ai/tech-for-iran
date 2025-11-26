"use node"

import { Resend } from "@convex-dev/resend"
import { v } from "convex/values"
import { components, internal } from "@/convex/_generated/api"
import { internalAction } from "@/convex/_generated/server"
import { errorMessage } from "@/convex/_helpers/errors"
import PostEngagementEmail from "@/emails/post-engagement"
import ReconnectAccountEmail from "@/emails/reconnect-account"
import { env } from "@/lib/env.mjs"
import { createEmail } from "@/lib/server/email"

export const resend = new Resend(components.resend, {
  testMode: env.NODE_ENV !== "production",
  apiKey: env.RESEND_API_KEY,
  webhookSecret: env.RESEND_WEBHOOK_SECRET,
})

export const reconnectAccount = internalAction({
  args: {
    unipileId: v.string(),
  },
  handler: async (ctx, { unipileId }) => {
    try {
      const { firstName, userId } = await ctx.runQuery(internal.linkedin.query.getProfile, {
        unipileId,
      })
      if (!userId) {
        return { error: "!userId" }
      }

      const userEmail = await ctx.runAction(internal.clerk.fetchUserEmail, { userId })

      await resend.sendEmail(
        ctx,
        await createEmail({
          subject: "Reconnect your account!",
          to: userEmail,
          body: <ReconnectAccountEmail name={firstName || "user"} />,
        })
      )

      return {}
    } catch (error) {
      console.error("emails:reconnectAccount", errorMessage(error))
      return { error: errorMessage(error) }
    }
  },
})

export const postEngagement = internalAction({
  args: {
    userId: v.string(),
    postId: v.id("posts"),
  },
  handler: async (ctx, { userId, postId }) => {
    try {
      const [userEmail, post, first, last] = await Promise.all([
        ctx.runAction(internal.clerk.fetchUserEmail, { userId }),
        ctx.runQuery(internal.posts.query.get, { postId }),
        ctx.runQuery(internal.stats.query.first, { postId }),
        ctx.runAction(internal.posts.action.sync, { postId }),
      ])

      if (!(first && last) || first._id === last._id) {
        console.warn("emails:postEngagement", { userId, postId, first, last })
        return { error: "!first || !last || first._id === last._id" }
      }

      await resend.sendEmail(
        ctx,
        await createEmail({
          subject: "Your boosted post's stats are in!",
          to: userEmail,
          body: <PostEngagementEmail post={post} t1={first} t2={last} />,
        })
      )

      return {}
    } catch (error) {
      console.error("emails:postEngagement", errorMessage(error))
      return { error: errorMessage(error) }
    }
  },
})
