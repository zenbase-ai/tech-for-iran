import { SignIn } from "@clerk/nextjs"
import { VStack } from "@/components/layout/stack"

export default function SignInPage() {
  return (
    <VStack as="main" justify="center" items="center" className="min-h-[60vh]">
      <SignIn forceRedirectUrl="/pods" signUpUrl="/sign-up" />
    </VStack>
  )
}
