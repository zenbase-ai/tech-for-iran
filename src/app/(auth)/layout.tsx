"use client"

import { redirect, usePathname } from "next/navigation"
import { useEffect } from "react"
import { toast } from "sonner"
import { useTimeout } from "usehooks-ts"
import { Box } from "@/components/layout/box"
import { Loading } from "@/components/ui/loading"
import { api } from "@/convex/_generated/api"
import useAuthQuery from "@/hooks/use-auth-query"
import { needsConnection } from "@/lib/linkedin"
import { Nav } from "./-nav"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const linkedin = useAuthQuery(api.fns.linkedin.getState)
  const status = linkedin?.account?.status
  const isConnectPage = usePathname() === "/settings/connect"

  const forceConnect = !isConnectPage && status != null && needsConnection(status)
  useTimeout(() => redirect("/settings/connect"), forceConnect ? 1000 : null)
  useEffect(() => {
    if (forceConnect) toast.info("Please connect your LinkedIn.")
  }, [forceConnect])

  if (status == null) {
    return <Loading delay={0} />
  }

  return (
    <>
      {!isConnectPage && <Nav className="fixed top-4 left-0 right-0 w-full max-w-fit mx-auto" />}
      <Box as="main" className="mx-auto">
        {children}
      </Box>
    </>
  )
}
