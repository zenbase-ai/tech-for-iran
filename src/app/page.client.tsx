"use client"

import { VStack } from "@/components/layout/stack"
import { ManifestoSection } from "./_manifesto/manifesto-section"
import { SignLetter } from "./_sign-flow/sign-letter"

/**
 * HomeClientPage - Client component for the homepage.
 *
 * Manages scroll behavior and refs for the single-page home experience.
 * The manifesto section fills the viewport, and clicking "Sign the letter"
 * smoothly scrolls to the sign flow section below.
 */
export const HomeClientPage: React.FC = () => (
  <VStack as="main" className="max-w-2xl mx-auto">
    {/* Section 1: The Manifesto */}
    <ManifestoSection />

    {/* Section 2: The Sign Flow */}
    <VStack aria-label="Sign the letter" as="section" className="gap-8 mx-auto min-h-svh">
      <h2 className="text-xl font-semibold text-left">Sign the Letter</h2>
      <SignLetter />
    </VStack>
  </VStack>
)
