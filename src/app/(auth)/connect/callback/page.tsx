import { fetchMutation } from "convex/nextjs"
import { RedirectType, redirect } from "next/navigation"
import * as z from "zod"
import { api } from "@/convex/_generated/api"
import { clerkAuth } from "@/lib/server/clerk"
import { errorMessage, queryString } from "@/lib/utils"

const ConnectCallbackSearchParams = z.object({
  account_id: z.string(),
  inviteCode: z.string().optional(),
})

export type ConnectCallbackPageProps = {
  searchParams: Promise<z.infer<typeof ConnectCallbackSearchParams>>
}

export default async function ConnectCallbackPage(props: ConnectCallbackPageProps) {
  const params = ConnectCallbackSearchParams.safeParse(await props.searchParams)
  if (!params.success) {
    return redirect(
      `/connect?${queryString({ error: errorMessage(params.error) })}`,
      RedirectType.replace
    )
  }

  const { inviteCode, account_id } = params.data
  const { token } = await clerkAuth().catch(clerkAuth)

  await fetchMutation(api.linkedin.mutate.connectOwn, { unipileId: account_id }, { token })

  if (inviteCode) {
    const join = await fetchMutation(api.pods.mutate.join, { inviteCode }, { token })
    if (join.pod == null) {
      return redirect(`/pods?${queryString({ error: join.error })}`, RedirectType.replace)
    }
    return redirect(
      `/pods/${join.pod._id}?${queryString({ success: join.success })}`,
      RedirectType.replace
    )
  }

  return redirect("/pods", RedirectType.replace)
}
