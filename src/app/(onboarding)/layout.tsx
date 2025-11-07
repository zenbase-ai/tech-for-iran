import { Box } from "@/components/layout/box"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Box as="main" className="mx-auto">
      {children}
    </Box>
  )
}
