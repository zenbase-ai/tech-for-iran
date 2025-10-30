import { fetchMutation, fetchQuery } from "convex/nextjs"
import { RedirectType, redirect } from "next/navigation"
import { VStack } from "@/components/layout/stack"
import { Separator } from "@/components/ui/separator"
import { api } from "@/convex/_generated/api"
import { tokenAuth } from "@/lib/clerk"
import { generateHostedAuthLink } from "./actions"
import { DisconnectForm } from "./disconnect-form"
import { ProfileForm } from "./profile-form"

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

  const { profile, needsReconnection, isHealthy } = await fetchQuery(
    api.linkedin.getState,
    {},
    { token },
  )

  if (profile == null || needsReconnection || !isHealthy) {
    const authLink = await generateHostedAuthLink(userId)
    return redirect(authLink as any, RedirectType.push)
  }

  // After successful LinkedIn connection, handle post-connection redirect
  // If there's an invite code, redirect to join that pod
  if (invite) {
    return redirect(`/join/${invite}`)
  }

  return (
    <VStack className="px-2 w-screen max-w-[640px] gap-8 mx-auto">
      <h1 className="text-2xl font-bold mb-2 font-serif italic">LinkedIn Settings</h1>

      <ProfileForm profile={profile} />

      <Separator className="my-8" />

      <DisconnectForm profile={profile} />
    </VStack>
  )
}
