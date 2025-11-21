"use node"

import { Resend } from "@convex-dev/resend"
import { pretty, render } from "@react-email/render"
import { v } from "convex/values"
import { components, internal } from "@/convex/_generated/api"
import { internalAction } from "@/convex/_generated/server"
import PostEngagementEmail from "@/emails/post-engagement"
import { env } from "@/lib/env.mjs"

export const resend = new Resend(components.resend, {
  testMode: false,
  apiKey: env.RESEND_API_KEY,
  webhookSecret: env.RESEND_WEBHOOK_SECRET,
})

export const postEngagement = internalAction({
  args: {
    userId: v.string(),
    postId: v.id("posts"),
  },
  handler: async (ctx, { userId, postId }) => {
    const [user, post, stats] = await Promise.all([
      ctx.runAction(internal.clerk.query.getUser, { userId }),
      ctx.runQuery(internal.posts.query.get, { postId }),
      ctx.runQuery(internal.stats.query.getAll, { userId, postId }),
    ])

    const emailAddress =
      user.primaryEmailAddress?.emailAddress ?? user.emailAddresses.at(0)?.emailAddress
    if (!emailAddress) {
      console.error("emails:postEngagement", "!emailAddress", { userId, postId })
      return
    }

    const [t1, t2] = [stats.at(0), stats.at(-1)]
    if (!(t1 && t2)) {
      console.error("emails:postEngagement", "!t1 || !t2", { userId, postId })
      return
    }

    await resend.sendEmail(ctx, {
      from: "Crackedbook Concierge <concierge@crackedbook.xyz>",
      to: emailAddress,
      subject: "🤘📖 | Your boosted post's stats are in!",
      html: await pretty(await render(<PostEngagementEmail post={post} t1={t1} t2={t2} />)),
    })
  },
})
