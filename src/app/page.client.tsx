"use client"

import { useCallback, useRef } from "react"
import { ManifestoSection } from "./_manifesto"
import { SignFlow } from "./_sign-flow"

/**
 * HomeClientPage - Client component for the homepage.
 *
 * Manages scroll behavior and refs for the single-page home experience.
 * The manifesto section fills the viewport, and clicking "Sign the letter"
 * smoothly scrolls to the sign flow section below.
 */
export const HomeClientPage: React.FC = () => {
  const signFlowRef = useRef<HTMLDivElement>(null)

  const scrollToSignFlow = useCallback(() => {
    signFlowRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }, [])

  return (
    <main>
      {/* Section 1: The Manifesto */}
      <ManifestoSection onScrollToSign={scrollToSignFlow} />

      {/* Section 2: The Sign Flow */}
      <section
        aria-label="Sign the letter"
        className="min-h-svh flex flex-col items-center px-6 py-16 md:py-24"
        ref={signFlowRef}
      >
        <div className="w-full max-w-[650px]">
          <h2 className="text-2xl md:text-3xl font-semibold mb-8 text-center">Sign the Letter</h2>
          <SignFlow />
        </div>
      </section>
    </main>
  )
}
