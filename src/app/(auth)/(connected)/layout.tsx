"use client"

import { RedirectType, redirect } from "next/navigation"
import { Loading } from "@/components/ui/loading"
import { api } from "@/convex/_generated/api"
import { useAuthQuery } from "@/hooks/use-auth-query"
import { isConnected } from "@/lib/linkedin"
import { queryString } from "@/lib/utils"

export default function ConnectedLayout({ children }: React.PropsWithChildren) {
  const linkedin = useAuthQuery(api.linkedin.query.getState)

  if (!linkedin) {
    return <Loading />
  }

  if (!isConnected(linkedin.account?.status)) {
    const warn = "Your LinkedIn account is not connected."
    return redirect(`/connect?${queryString({ warn })}`, RedirectType.replace)
  }

  return <>{children}</>
}
