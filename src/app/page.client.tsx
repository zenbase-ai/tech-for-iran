"use client"

import { SignInButton, SignUpButton, useAuth } from "@clerk/nextjs"
import { redirect } from "next/navigation"
import { LuGem } from "react-icons/lu"
import { HStack, VStack } from "@/components/layout/stack"
import { Button } from "@/components/ui/button"
import { TextShimmer } from "@/components/ui/text-shimmer"
import { Timeout } from "@/components/ui/timeout"
import { cn } from "@/lib/utils"

export default function HomeClientPage() {
  const { isLoaded, isSignedIn } = useAuth()

  return (
    <VStack
      as="section"
      id="hero"
      items="center"
      justify="center"
      className={cn(
        "size-full min-w-[320px] max-w-[1280px] mx-auto",
        "gap-4 sm:gap-6 md:gap-8 lg:gap-10",
      )}
    >
      <LuGem className="size-32 stroke-[1px]" />

      <TextShimmer
        as="h2"
        duration={2}
        spread={32}
        className="text-xl md:text-2xl font-bold font-serif italic"
      >
        Crackedbook.
      </TextShimmer>

      {!isLoaded ? null : isSignedIn ? (
        <Timeout delay={1000} callback={() => redirect("/pods")}>
          <Button asChild disabled>
            Opening app...
          </Button>
        </Timeout>
      ) : (
        <HStack wrap items="center" justify="center" className="gap-2">
          <SignInButton>
            <Button variant="outline">Sign In</Button>
          </SignInButton>
          <SignUpButton>
            <Button>Sign Up</Button>
          </SignUpButton>
        </HStack>
      )}
    </VStack>
  )
}
