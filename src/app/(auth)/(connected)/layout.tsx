"use client"

import { redirect } from "next/navigation"
import { Box } from "@/components/layout/box"
import { Loading } from "@/components/ui/loading"
import { api } from "@/convex/_generated/api"
import useAuthQuery from "@/hooks/use-auth-query"
import { isConnected } from "@/lib/linkedin"
import { Nav } from "./_nav"

export default function ConnectedLayout({ children }: React.PropsWithChildren) {
  const linkedin = useAuthQuery(api.linkedin.query.getState)

  if (linkedin == null) {
    return <Loading />
  }

  if (!isConnected(linkedin.account?.status)) {
    return redirect("/connect")
  }

  return (
    <>
      <Nav className="z-50 fixed bottom-4 left-0 right-0 max-w-fit mx-auto" />
      <Box as="main" className="mx-auto">
        {children}
      </Box>
    </>
  )
}
