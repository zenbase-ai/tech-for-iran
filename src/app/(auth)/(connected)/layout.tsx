"use client"

import { redirect } from "next/navigation"
import { toast } from "sonner"
import { Box } from "@/components/layout/box"
import { Loading } from "@/components/ui/loading"
import { Timeout } from "@/components/ui/timeout"
import { api } from "@/convex/_generated/api"
import useAuthQuery from "@/hooks/use-auth-query"
import { requiresConnection } from "@/lib/linkedin"
import { Nav } from "./_nav"

export default function ConnectedLayout({ children }: { children: React.ReactNode }) {
  const linkedin = useAuthQuery(api.linkedin.query.getState)

  if (linkedin == null) {
    return <Loading delay={0} />
  }

  const status = linkedin?.account?.status
  if (status != null && requiresConnection(status)) {
    toast.warning("Please connect your LinkedIn.")
    return <Timeout delay={250} callback={() => redirect("/connect")} />
  }

  return (
    <>
      <Nav className="z-50 fixed top-4 left-0 right-0 w-full max-w-fit mx-auto" />
      <Box as="main" className="mx-auto">
        {children}
      </Box>
    </>
  )
}
