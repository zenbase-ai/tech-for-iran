import cache from "@convex-dev/action-cache/convex.config"
import aggregate from "@convex-dev/aggregate/convex.config"
import migrations from "@convex-dev/migrations/convex.config"
import rateLimiter from "@convex-dev/rate-limiter/convex.config"
import resend from "@convex-dev/resend/convex.config"
import workflow from "@convex-dev/workflow/convex.config"
import { defineApp } from "convex/server"

const app = defineApp()

// Core infrastructure components
app.use(cache)
app.use(migrations)
app.use(rateLimiter)
app.use(resend)
app.use(workflow)

// Aggregates for signature stats
// See src/convex/aggregates.ts for usage
app.use(aggregate, { name: "signatureCount" }) // Total signature count
app.use(aggregate, { name: "signatureReferrals" }) // Referrals per signature
app.use(aggregate, { name: "upvoteCount" }) // Total upvote count

export default app
