"use client"

import { redirect, usePathname } from "next/navigation"
import { useEffect } from "react"
import { toast } from "sonner"
import { Box } from "@/components/layout/box"
import { Loading } from "@/components/ui/loading"
import { api } from "@/convex/_generated/api"
import useAuthQuery from "@/hooks/use-auth-query"
import { needsConnection } from "@/lib/linkedin"
import { Nav } from "./nav"

export default function AuthClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const linkedin = useAuthQuery(api.fns.linkedin.getState)
  const isLoaded = linkedin != null
  const isConnectPage = pathname === "/settings/connect"

  useEffect(() => {
    if (isLoaded && !isConnectPage && needsConnection(linkedin?.account?.status)) {
      toast.info("Please connect your LinkedIn.")
      const timeout = setTimeout(() => {
        redirect("/settings/connect")
      }, 1000)
      return () => clearTimeout(timeout)
    }
  }, [isLoaded, isConnectPage, linkedin?.account?.status])

  if (!isLoaded) {
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
