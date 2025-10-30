import { Protect, RedirectToSignIn } from "@clerk/nextjs"
import { Box } from "@/components/layout/box"
import { Nav } from "./nav"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Protect fallback={<RedirectToSignIn />}>
      <Box className="pt-24">
        <Nav className="fixed top-4 left-0 right-0 w-full max-w-fit mx-auto" />
        <Box as="main">{children}</Box>
      </Box>
    </Protect>
  )
}
