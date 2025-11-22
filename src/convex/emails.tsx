"use node"

import { Resend } from "@convex-dev/resend"
import { pretty, render } from "@react-email/render"
import { v } from "convex/values"
import { components, internal } from "@/convex/_generated/api"
import { internalAction } from "@/convex/_generated/server"
import { ConflictError, errorMessage } from "@/convex/_helpers/errors"
import PostEngagementEmail from "@/emails/post-engagement"
import ReconnectAccountEmail from "@/emails/reconnect-account"
import { clerkEmail } from "@/lib/clerk"
import { env } from "@/lib/env.mjs"

type CreateEmailParams = {
  subject: string
  to: string
  body: React.ReactElement
}

const createEmail = async ({ subject, to, body }: CreateEmailParams) => ({
  from: "Crackedbook <noreply@crackedbook.xyz>",
  to,
  subject,
  html: await pretty(await render(body)),
})

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
        throw new ConflictError()
      }

      const user = await ctx.runAction(internal.clerk.query.getUser, { userId })

      const email = await createEmail({
        subject: "Reconnect your account to continue engagement",
        to: clerkEmail(user),
        body: <ReconnectAccountEmail name={firstName || "user"} />,
      })

      await resend.sendEmail(ctx, email)
    } catch (error) {
      console.error("emails:reconnectAccount", errorMessage(error))
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
      const [user, post, stats] = await Promise.all([
        ctx.runAction(internal.clerk.query.getUser, { userId }),
        ctx.runQuery(internal.posts.query.get, { postId }),
        ctx.runQuery(internal.stats.query.getAll, { userId, postId }),
      ])

      const t1 = stats.at(0)
      const t2 = stats.at(-1)
      if (!(t1 && t2) || t1._id === t2._id) {
        console.warn("emails:postEngagement", "!t1 || !t2 || t1._id === t2._id", { userId, postId })
        return
      }

      const email = await createEmail({
        subject: "Your boosted post's stats are in!",
        to: clerkEmail(user),
        body: <PostEngagementEmail post={post} t1={t1} t2={t2} />,
      })

      await resend.sendEmail(ctx, email)
    } catch (error) {
      console.error("emails:postEngagement", errorMessage(error))
    }
  },
})
