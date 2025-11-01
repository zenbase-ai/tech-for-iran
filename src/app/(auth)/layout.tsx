import { Box } from "@/components/layout/box"
import { Nav } from "@/components/layout/nav"
import { linkedinState } from "@/lib/server/linkedin"

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const linkedin = await linkedinState()

  return (
    <Box className="pt-24">
      <Nav className="fixed top-4 left-0 right-0 w-full max-w-fit mx-auto" linkedin={linkedin} />
      <Box as="main">{children}</Box>
    </Box>
  )
}
