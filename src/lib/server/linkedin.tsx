import { preloadedQueryResult, preloadQuery } from "convex/nextjs"
import { redirect } from "next/navigation"
import { api } from "@/convex/_generated/api"
import { tokenAuth } from "./clerk"

export const preloadLinkedinState = async () => {
  const { isAuthenticated, token } = await tokenAuth()
  if (!isAuthenticated) {
    return redirect("/sign-in" as any)
  }

  const linkedin = await preloadQuery(api.linkedin.getState, {}, { token })
  const { needsReconnection } = preloadedQueryResult(linkedin)
  if (needsReconnection) {
    return redirect("/settings/connect")
  }

  return linkedin
}
