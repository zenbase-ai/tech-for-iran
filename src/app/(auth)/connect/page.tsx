"use client"

import { RedirectType, redirect, useSearchParams } from "next/navigation"
import { Loading } from "@/components/ui/loading"
import { api } from "@/convex/_generated/api"
import { useAuthQuery } from "@/hooks/use-auth-query"
import { isConnected } from "@/lib/linkedin"
import { queryString } from "@/lib/utils"
import { ConnectGateDialog } from "./_gate"

export default function ConnectClientPage() {
  const inviteCode = useSearchParams().get("inviteCode") ?? ""
  const linkedin = useAuthQuery(api.linkedin.query.getState)

  if (linkedin == null) {
    return <Loading />
  }

  if (linkedin?.account == null) {
    return <ConnectGateDialog inviteCode={inviteCode} />
  }

  if (!isConnected(linkedin.account?.status)) {
    return redirect(`/connect/dialog?${queryString({ inviteCode })}`, RedirectType.replace)
  }

  return redirect("/pods", RedirectType.replace)
}
