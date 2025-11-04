import { auth } from "@clerk/nextjs/server"
import { Box } from "@/components/layout/box"
import { Nav } from "@/components/layout/nav"

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  await auth.protect()

  return (
    <Box className="pt-24">
      <Nav className="fixed top-4 left-0 right-0 w-full max-w-fit mx-auto" />
      <Box as="main">{children}</Box>
    </Box>
  )
}
