"use client"

import { useCallback, useRef, useState } from "react"
import { ManifestoSection } from "./_manifesto"
import { SignFlow, type SignFlowData } from "./_sign-flow"

/**
 * HomeClientPage - Client component for the homepage.
 *
 * Manages scroll behavior and refs for the single-page home experience.
 * The manifesto section fills the viewport, and clicking "Sign the letter"
 * smoothly scrolls to the sign flow section below.
 */
export const HomeClientPage: React.FC = () => {
  const signFlowRef = useRef<HTMLDivElement>(null)
  const [signFlowSuccess, setSignFlowSuccess] = useState(false)
  const [signedData, setSignedData] = useState<SignFlowData | null>(null)

  const scrollToSignFlow = useCallback(() => {
    signFlowRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }, [])

  const handleSignFlowSuccess = useCallback((data: SignFlowData) => {
    setSignedData(data)
    setSignFlowSuccess(true)
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

          {signFlowSuccess && signedData ? (
            /* Success state - placeholder for Step 4 */
            <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-6 text-5xl">&#10003;</div>
              <h3 className="text-xl font-semibold mb-2">You've signed the letter!</h3>
              <p className="text-muted-foreground mb-4">
                Thank you, {signedData.name}. Your voice matters.
              </p>
              <p className="text-sm text-muted-foreground">
                Share options and success page will be built in Step 4.
              </p>
            </div>
          ) : (
            <SignFlow onSuccess={handleSignFlowSuccess} />
          )}
        </div>
      </section>
    </main>
  )
}
