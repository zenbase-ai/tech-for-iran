import { auth } from "@clerk/nextjs/server"
import { Box } from "@/components/layout/box"
import { Hero } from "@/components/marketing/hero"
import { Highlighter } from "@/components/ui/highlighter"

export default async function HomePage() {
  const { userId } = await auth()
  const loggedIn = !!userId

  const lede = loggedIn ? "" : "Join a pod, boost each other's posts, and amplify your reach."
  const ctas: Record<string, string> = loggedIn
    ? { Dashboard: "/pods" }
    : { "Sign Up": "/sign-up", "Sign In": "/sign-in" }

  return (
    <Box as="main" className="mt-[24vh]">
      <Hero
        title={
          <em>
            Get <Highlighter action="underline">boosted.</Highlighter>
          </em>
        }
        lede={lede}
        ctas={ctas}
      />
    </Box>
  )
}
