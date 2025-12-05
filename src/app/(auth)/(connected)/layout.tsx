"use client"

import { RedirectType, redirect } from "next/navigation"
import { Box } from "@/components/layout/box"
import { Loading } from "@/components/ui/loading"
import { api } from "@/convex/_generated/api"
import { useAuthQuery } from "@/hooks/use-auth-query"
import { isConnected } from "@/lib/linkedin"
import { Nav } from "./_nav"

export default function ConnectedLayout({ children }: React.PropsWithChildren) {
  const linkedin = useAuthQuery(api.linkedin.query.getState)

  if (linkedin == null) {
    return <Loading />
  }

  if (!isConnected(linkedin.account?.status)) {
    return redirect("/connect", RedirectType.replace)
  }

  return (
    <>
      <Box as="main" className="mb-24">
        {children}
      </Box>

      <Nav className="z-50 fixed bottom-2 md:bottom-4 left-0 right-0 w-fit mx-auto" />
    </>
  )
}
