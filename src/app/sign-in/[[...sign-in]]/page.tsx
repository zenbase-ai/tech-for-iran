import { SignIn } from "@clerk/nextjs"
import { Box } from "@/components/layout/box"

export default function SignInPage() {
  return (
    <Box as="main" className="flex items-center justify-center min-h-[60vh]">
      <SignIn forceRedirectUrl="/dashboard" signUpUrl="/sign-up" />
    </Box>
  )
}
