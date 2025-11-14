import { Box } from "@/components/layout/box"

export default function ClerkLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box as="main" className="min-h-[60vh] mx-auto">
      {children}
    </Box>
  )
}
