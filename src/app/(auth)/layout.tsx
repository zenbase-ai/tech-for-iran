import { RedirectToSignIn } from "@clerk/nextjs"
import { preloadedQueryResult, preloadQuery } from "convex/nextjs"
import { redirect } from "next/navigation"
import { Box } from "@/components/layout/box"
import { Nav } from "@/components/layout/nav"
import { api } from "@/convex/_generated/api"
import { tokenAuth } from "@/lib/clerk"

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, token } = await tokenAuth()
  if (!isAuthenticated) {
    return <RedirectToSignIn />
  }

  const linkedin = await preloadQuery(api.linkedin.getState, {}, { token })
  const { needsReconnection } = preloadedQueryResult(linkedin)
  if (needsReconnection) {
    return redirect("/settings/connect")
  }

  return (
    <Box className="pt-24">
      <Nav className="fixed top-4 left-0 right-0 w-full max-w-fit mx-auto" linkedin={linkedin} />
      <Box as="main">{children}</Box>
    </Box>
  )
}
