import { auth } from "@clerk/nextjs/server"
import { HeroCTA, HeroSection, HeroTitle } from "@/components/marketing/hero"
import { CTALinkButton } from "@/components/ui/cta-link-button"
import { JoinPodForm } from "./join/form"

export default async function HomePage() {
  const { isAuthenticated } = await auth()

  return (
    <HeroSection as="main" className="mt-[24vh]">
      <HeroTitle className="italic">Crackedbook.</HeroTitle>
      {!isAuthenticated ? (
        <JoinPodForm />
      ) : (
        <HeroCTA>
          <CTALinkButton href="/pods">Dashboard</CTALinkButton>
        </HeroCTA>
      )}
    </HeroSection>
  )
}
