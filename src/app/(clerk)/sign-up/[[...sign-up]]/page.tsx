import { SignUp } from "@clerk/nextjs"
import type { Metadata } from "next"
import { route } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Sign Up | Crackedbook",
}

export type SignUpPageProps = {
  searchParams: Promise<{
    inviteCode?: string
  }>
}

export default async function SignUpPage(props: SignUpPageProps) {
  const searchParams = await props.searchParams

  return (
    <SignUp
      forceRedirectUrl={route("/connect", { searchParams })}
      signInUrl={route("/sign-in", { searchParams })}
    />
  )
}
