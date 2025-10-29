import { Stack } from "@/components/layout/stack"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Stack as="main" justify="center" items="center" className="min-h-[60vh] mx-auto">
      {children}
    </Stack>
  )
}
