import { SignUp } from "@clerk/nextjs"
import type { Metadata } from "next"
import { route } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Sign Up",
}

export default function SignUpPage() {
  return <SignUp forceRedirectUrl={route("/")} signInUrl={route("/sign-in")} />
}
