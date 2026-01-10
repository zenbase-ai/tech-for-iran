import cache from "@convex-dev/action-cache/convex.config"
import migrations from "@convex-dev/migrations/convex.config"
import rateLimiter from "@convex-dev/rate-limiter/convex.config"
import resend from "@convex-dev/resend/convex.config"
import workflow from "@convex-dev/workflow/convex.config"
import { defineApp } from "convex/server"

const app = defineApp()

app.use(cache)
app.use(migrations)
app.use(rateLimiter)
app.use(resend)
app.use(workflow)

export default app
