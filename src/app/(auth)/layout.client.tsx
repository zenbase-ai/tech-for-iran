"use client"

import { Box } from "@/components/layout/box"
import { Loading } from "@/components/ui/loading"
import useEnsureLinkedin from "@/hooks/use-ensure-linkedin"
import { Nav } from "./nav"

export default function AuthClientLayout({ children }: { children: React.ReactNode }) {
  const { isLoaded, isConnectPage } = useEnsureLinkedin()

  if (isConnectPage) {
    return <>{children}</>
  }

  if (!isLoaded) {
    return <Loading delay={0} />
  }

  return (
    <>
      <Nav className="fixed top-4 left-0 right-0 w-full max-w-fit mx-auto" />
      <Box as="main" className="mx-auto">
        {children}
      </Box>
    </>
  )
}
