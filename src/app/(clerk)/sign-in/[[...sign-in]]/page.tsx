import { SignIn } from "@clerk/nextjs"
import type { Metadata } from "next"
import { route } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Sign In | Crackedbook",
}

export type SignInPageProps = {
  searchParams: Promise<{
    inviteCode?: string
  }>
}

export default async function SignInPage(props: SignInPageProps) {
  const searchParams = await props.searchParams

  return (
    <SignIn
      forceRedirectUrl={route("/connect", { searchParams })}
      signUpUrl={route("/sign-up", { searchParams })}
    />
  )
}
