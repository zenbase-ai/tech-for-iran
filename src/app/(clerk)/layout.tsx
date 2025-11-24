import { Box } from "@/components/layout/box"

export default function ClerkLayout({ children }: React.PropsWithChildren) {
  return (
    <Box as="main" className="min-h-[60vh]">
      {children}
    </Box>
  )
}
