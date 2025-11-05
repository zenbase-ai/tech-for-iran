"use client"

import { SignInButton, SignUpButton, useAuth } from "@clerk/nextjs"
import { HeroCTA, HeroSection, HeroTitle } from "@/components/marketing/hero"
import { Button } from "@/components/ui/button"
import { CTALinkButton } from "@/components/ui/cta-link-button"

export default function HomeClientPage() {
  const { isSignedIn } = useAuth()

  return (
    <HeroSection as="main" className="pt-[24vh]">
      <HeroTitle className="italic">Crackedbook.</HeroTitle>
      <HeroCTA>
        {isSignedIn ? (
          <CTALinkButton href="/pods">Dashboard</CTALinkButton>
        ) : (
          <>
            <SignInButton>
              <Button variant="outline">Sign In</Button>
            </SignInButton>
            <SignUpButton>
              <Button variant="outline">Sign Up</Button>
            </SignUpButton>
          </>
        )}
      </HeroCTA>
    </HeroSection>
  )
}
