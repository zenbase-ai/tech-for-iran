import { SignIn } from "@clerk/nextjs"
import type { Metadata } from "next"
import { route } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Sign In",
}

export default function SignInPage() {
  return <SignIn forceRedirectUrl={route("/")} signUpUrl={route("/sign-up")} />
}
