import { Box } from "@/components/layout/box"
import { Hero } from "@/components/marketing/hero"
import { Highlighter } from "@/components/ui/highlighter"

export default function HomePage() {
  return (
    <Box as="main" className="mt-[24vh]">
      <Hero
        title={
          <em>
            Get <Highlighter action="underline">boosted.</Highlighter>
          </em>
        }
        lede="Join a pod, boost each other's posts, and amplify your reach."
        ctas={{ "Sign Up": "/sign-up", "Sign In": "/sign-in" }}
      />
    </Box>
  )
}
