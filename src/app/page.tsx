import { auth } from "@clerk/nextjs/server"
import { Box } from "@/components/layout/box"
import { Hero } from "@/components/marketing/hero"
import { Highlighter } from "@/components/ui/highlighter"

export default async function HomePage() {
  const { isAuthenticated } = await auth()

  const lede = isAuthenticated
    ? ""
    : "Join a pod, boost each other's posts, and amplify your reach."
  const ctas: Record<string, string> = isAuthenticated
    ? { Dashboard: "/pods" }
    : { "Sign Up": "/sign-up", "Sign In": "/sign-in" }

  return (
    <Box as="main" className="mt-[24vh]">
      <Hero
        title={
          <em>
            <Highlighter action="underline">Cracked</Highlighter>book.
          </em>
        }
        lede={lede}
        ctas={ctas}
      />
    </Box>
  )
}
