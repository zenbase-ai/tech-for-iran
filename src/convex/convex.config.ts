import aggregate from "@convex-dev/aggregate/convex.config"
import migrations from "@convex-dev/migrations/convex.config"
import rateLimiter from "@convex-dev/rate-limiter/convex.config"
import workflow from "@convex-dev/workflow/convex.config"
import { defineApp } from "convex/server"

const app = defineApp()
app.use(migrations)
app.use(rateLimiter)
app.use(workflow)
app.use(aggregate, { name: "aggregatePodMembers" })
app.use(aggregate, { name: "aggregatePodPosts" })
app.use(aggregate, { name: "aggregatePostEngagements" })

export default app
