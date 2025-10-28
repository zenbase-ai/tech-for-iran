import aggregate from "@convex-dev/aggregate/convex.config"
import workflow from "@convex-dev/workflow/convex.config"
import { defineApp } from "convex/server"

const app = defineApp()
app.use(workflow)
app.use(aggregate, { name: "aggregatePodMembers" })
app.use(aggregate, { name: "aggregatePodPosts" })
app.use(aggregate, { name: "aggregatePostEngagements" })

export default app
