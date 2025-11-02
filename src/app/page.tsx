import { SignInButton, SignUpButton } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"
import { HeroCTA, HeroSection, HeroTitle } from "@/components/marketing/hero"
import { Button } from "@/components/ui/button"
import { CTALinkButton } from "@/components/ui/cta-link-button"

export default async function HomePage() {
  const { isAuthenticated } = await auth()

  return (
    <HeroSection as="main" className="mt-[24vh]">
      <HeroTitle className="italic">Crackedbook.</HeroTitle>
      <HeroCTA>
        {!isAuthenticated ? (
          <>
            <SignInButton>
              <Button variant="outline">Sign In</Button>
            </SignInButton>
            <SignUpButton>
              <Button variant="outline">Sign Up</Button>
            </SignUpButton>
          </>
        ) : (
          <CTALinkButton href="/pods">Dashboard</CTALinkButton>
        )}
      </HeroCTA>
    </HeroSection>
  )
}
