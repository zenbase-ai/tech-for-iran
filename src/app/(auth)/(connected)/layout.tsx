"use client"

import { RedirectType, redirect } from "next/navigation"
import { Box } from "@/components/layout/box"
import { Loading } from "@/components/ui/loading"
import { api } from "@/convex/_generated/api"
import { useAuthQuery } from "@/hooks/use-auth-query"
import { isConnected } from "@/lib/linkedin"
import { cn, queryString } from "@/lib/utils"
import { Nav } from "./_nav"

export default function ConnectedLayout({ children }: React.PropsWithChildren) {
  const linkedin = useAuthQuery(api.linkedin.query.getState)

  if (!linkedin) {
    return <Loading />
  }

  if (!isConnected(linkedin.account?.status)) {
    const warn = "Your LinkedIn account is not connected."
    return redirect(`/connect?${queryString({ warn })}`, RedirectType.replace)
  }

  return (
    <Box as="main" className="mb-24 w-fit mx-auto relative">
      <Nav
        className={cn(
          "z-50 w-fit",
          "mx-auto lg:ml-0",
          "fixed left-0 right-0 bottom-2 md:bottom-4 lg:sticky lg:top-4 lg:bottom-auto lg:right-auto"
        )}
      />

      {children}
    </Box>
  )
}
