"use client"

import { useState } from "react"
import { LuCheck, LuCopy } from "react-icons/lu"
import { VStack } from "@/components/layout/stack"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type ShareUrlCardProps = {
  url: string
  className?: string
}

// Regex to remove protocol from URL for display
const PROTOCOL_REGEX = /^https?:\/\//

/**
 * ShareUrlCard - Displays a shareable URL with copy functionality.
 *
 * Shows the share URL in a monospace font with a copy button that
 * provides "Copied!" feedback for 2 seconds after clicking.
 */
export const ShareUrlCard: React.FC<ShareUrlCardProps> = ({ url, className }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy URL:", error)
    }
  }

  // Extract display URL (remove protocol for cleaner display)
  const displayUrl = url.replace(PROTOCOL_REGEX, "")

  return (
    <VStack className={cn("gap-3", className)}>
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Share your pledge
      </span>

      <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-4 py-3">
        <code className="flex-1 truncate font-mono text-sm">{displayUrl}</code>

        <Button
          className={cn("shrink-0 transition-colors", copied && "text-green-600")}
          onClick={handleCopy}
          size="sm"
          type="button"
          variant="ghost"
        >
          {copied ? (
            <>
              <LuCheck className="size-4" />
              Copied!
            </>
          ) : (
            <>
              <LuCopy className="size-4" />
              Copy Link
            </>
          )}
        </Button>
      </div>
    </VStack>
  )
}
