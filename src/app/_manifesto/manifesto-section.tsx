"use client"

import { LuChevronDown } from "react-icons/lu"
import { VStack } from "@/components/layout/stack"
import { cn } from "@/lib/utils"
import { ManifestoContent } from "./manifesto-content"

export type ManifestoSectionProps = {
  className?: string
  onScrollToSign?: () => void
}

/**
 * ManifestoSection - The typography-forward "read" experience.
 *
 * This is the first section users see when landing on the homepage.
 * It presents the manifesto in a clean, screenshot-able format with
 * generous whitespace and a scroll CTA to the sign flow below.
 */
export const ManifestoSection: React.FC<ManifestoSectionProps> = ({
  className,
  onScrollToSign,
}) => {
  return (
    <section
      className={cn(
        "min-h-svh flex flex-col items-center justify-center px-6 py-16 md:py-24",
        className
      )}
    >
      <VStack className="w-full max-w-[650px] gap-0" items="center">
        {/* Header */}
        <header className="text-center mb-10 md:mb-14">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-[0.1em] sm:tracking-[0.12em] md:tracking-[0.15em] uppercase">
            Tech for Iran
          </h1>
          <p className="text-muted-foreground mt-4 text-sm md:text-base">
            An open letter from founders, investors, and operators.
          </p>
        </header>

        {/* Manifesto Body */}
        <article className="font-serif text-base md:text-lg leading-relaxed md:leading-loose space-y-6 md:space-y-8 text-foreground/90">
          <ManifestoContent />
        </article>

        {/* Scroll CTA */}
        <button
          aria-label="Scroll down to sign the letter"
          className={cn(
            "mt-14 md:mt-20 group flex flex-col items-center gap-2",
            "text-muted-foreground hover:text-foreground transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg p-2 -m-2"
          )}
          onClick={onScrollToSign}
          type="button"
        >
          <span className="text-sm md:text-base">Sign the letter</span>
          <LuChevronDown
            aria-hidden="true"
            className={cn(
              "size-5 md:size-6",
              "motion-safe:animate-bounce",
              "group-hover:text-foreground transition-colors"
            )}
          />
        </button>
      </VStack>
    </section>
  )
}
