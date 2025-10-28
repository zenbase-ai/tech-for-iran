import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { VStack } from "@/components/layout/stack"
import { Hero } from "@/components/marketing/hero"
import { Highlighter } from "@/components/ui/highlighter"

export default async function HomePage() {
  const { userId } = await auth()
  if (userId) {
    return redirect("/main")
  }

  return (
    <VStack as="main" justify="center" items="center" className="min-h-[60vh]">
      <Hero
        title={
          <em>
            <Highlighter action="underline">Amplify</Highlighter> your LinkedIn presence
          </em>
        }
        lede="Join a squad, boost each other's posts, and make your professional content reach further."
        ctas={{ "Sign Up": "/sign-up", "Sign In": "/sign-in" }}
      />
    </VStack>
  )
}
