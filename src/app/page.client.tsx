"use client"

import { SignInButton, SignUpButton, useAuth } from "@clerk/nextjs"
import Link from "next/link"
import { LuArrowRight, LuGem } from "react-icons/lu"
import { HStack, VStack } from "@/components/layout/stack"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { TextShimmer } from "@/components/ui/text-shimmer"
import { cn } from "@/lib/utils"

export default function HomeClientPage() {
  const { isSignedIn, isLoaded } = useAuth()

  return (
    <HStack
      as="section"
      id="hero"
      wrap
      items="center"
      justify="center"
      className={cn(
        "size-full pt-[24vh] min-w-[320px] max-w-[1280px] mx-auto",
        "gap-4 sm:gap-6 md:gap-8 lg:gap-10",
        "relative",
      )}
    >
      <aside>
        <LuGem className="size-32 stroke-[1px]" />
      </aside>

      <VStack className="items-center lg:items-start">
        <TextShimmer
          as="h2"
          duration={2}
          spread={32}
          className="text-xl md:text-2xl font-bold mb-2 font-serif italic"
        >
          Crackedbook.
        </TextShimmer>

        <HStack wrap items="center" className="gap-2 justify-center lg:justify-start mt-1">
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
        </HStack>
      </VStack>
    </HStack>
  )
}
