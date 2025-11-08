"use client"

import { SignInButton, SignUpButton, useAuth } from "@clerk/nextjs"
import Link from "next/link"
import { LuArrowRight } from "react-icons/lu"
import { HeroCTA, HeroSection, HeroTitle } from "@/components/marketing/hero"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export default function HomeClientPage() {
  const { isSignedIn, isLoaded } = useAuth()

  return (
    <HeroSection as="main" className="pt-[24vh]">
      <HeroTitle className="italic">Crackedbook.</HeroTitle>
      <HeroCTA>
        {!isLoaded ? (
          <Skeleton className="w-full h-9" />
        ) : isSignedIn ? (
          <Button asChild>
            <Link href="/pods">
              Open App
              <LuArrowRight className="size-4" />
            </Link>
          </Button>
        ) : (
          <>
            <SignInButton>
              <Button variant="outline">
                Sign In
                <LuArrowRight className="size-4" />
              </Button>
            </SignInButton>
            <SignUpButton>
              <Button variant="outline">
                Sign Up
                <LuArrowRight className="size-4" />
              </Button>
            </SignUpButton>
          </>
        )}
      </HeroCTA>
    </HeroSection>
  )
}
