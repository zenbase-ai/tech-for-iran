"use client"

import { Prose } from "@/components/layout/prose"
import { VStack } from "@/components/layout/stack"
import { cn } from "@/lib/utils"
import ManifestoContent from "./manifesto.md"

export type ManifestoSectionProps = {
  className?: string
}

/**
 * ManifestoSection - The typography-forward "read" experience.
 *
 * This is the first section users see when landing on the homepage.
 * It presents the manifesto in a clean, screenshot-able format with
 * generous whitespace and a scroll CTA to the sign flow below.
 */
export const ManifestoSection: React.FC<ManifestoSectionProps> = ({ className }) => (
  <VStack
    as="section"
    className={cn("gap-8 mx-auto min-h-svh px-6 py-16 md:py-24 max-w-2xl", className)}
    items="center"
    justify="center"
  >
    <VStack className="w-full gap-0" items="center">
      {/* Header */}
      <header className="text-center mb-10 md:mb-14">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-wide sm:tracking-[0.12em] md:tracking-[0.15em] uppercase">
          Tech for Iran
        </h1>
        <p className="text-muted-foreground mt-4 text-sm md:text-base">
          An open letter from founders, investors, and operators.
        </p>
      </header>

      {/* Manifesto Body */}
      <Prose>
        <ManifestoContent />
      </Prose>
    </VStack>
  </VStack>
)
