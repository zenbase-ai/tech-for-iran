import { fetchMutation, fetchQuery } from "convex/nextjs"
import { RedirectType, redirect } from "next/navigation"
import { api } from "@/convex/_generated/api"
import { tokenAuth } from "@/lib/clerk"
import { generateHostedAuthLink } from "./actions"

type LinkedInPageParams = {
  searchParams: Promise<{
    account_id?: string
    invite?: string
  }>
}

export default async function LinkedInPage({ searchParams }: LinkedInPageParams) {
  const [{ token, userId }, { account_id, invite }] = await Promise.all([tokenAuth(), searchParams])
  if (!userId) {
    return redirect("/")
  }

  if (account_id) {
    await fetchMutation(api.linkedin.linkAccount, { unipileId: account_id }, { token })
  }

  const { account, profile, needsReconnection, isHealthy } = await fetchQuery(
    api.linkedin.getState,
    {},
    { token },
  )

  if (account == null || profile == null || needsReconnection || !isHealthy) {
    const authLink = await generateHostedAuthLink(userId)
    return redirect(authLink as any, RedirectType.push)
  }

  // After successful LinkedIn connection, handle post-connection redirect
  // If there's an invite code, redirect to join that pod
  if (invite) {
    return redirect(`/join/${invite}`)
  }

  // Redirect to pods page
  return redirect("/pods")
}
