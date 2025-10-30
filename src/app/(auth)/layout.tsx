import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { VStack } from "@/components/layout/stack"
import { Nav } from "./nav"

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const userId = await auth()

  if (!userId) {
    return redirect("/sign-in" as any)
  }

  return (
    <VStack items="center" className="gap-4">
      <Nav className="fixed top-4 left-0 right-0 w-full max-w-fit mx-auto" />
      <main className="flex-1 mt-24">{children}</main>
    </VStack>
  )
}
