"use client"

import { SiLinkedin, SiX } from "react-icons/si"
import { VStack } from "@/components/layout/stack"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type SocialShareButtonsProps = {
  url: string
  commitmentText?: string | null
  className?: string
}

/**
 * Truncates text to a maximum length, adding ellipsis if needed.
 */
const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text
  }
  return `${text.slice(0, maxLength - 3)}...`
}

/**
 * Builds the Twitter/X share text based on whether there's a commitment.
 */
const buildTwitterText = (commitmentText?: string | null): string => {
  if (commitmentText) {
    const truncated = truncate(commitmentText, 100)
    return `I just signed Tech for Iran - committing to "${truncated}" when Iranians are free. Join me:`
  }
  return "I just signed Tech for Iran - pledging to invest, hire, and build when Iranians are free. Join me:"
}

/**
 * Builds the LinkedIn share text.
 * LinkedIn uses URL only - the text is added by the user in the share dialog.
 */
const buildLinkedInUrl = (url: string): string => {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
}

/**
 * Builds the Twitter/X intent URL with pre-filled text.
 */
const buildTwitterUrl = (url: string, commitmentText?: string | null): string => {
  const text = buildTwitterText(commitmentText)
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
}

/**
 * SocialShareButtons - Share buttons for Twitter/X and LinkedIn.
 *
 * Opens platform-specific share dialogs in new tabs with pre-filled content.
 * Stacks vertically on mobile, horizontally on larger screens.
 */
export const SocialShareButtons: React.FC<SocialShareButtonsProps> = ({
  url,
  commitmentText,
  className,
}) => {
  const twitterUrl = buildTwitterUrl(url, commitmentText)
  const linkedInUrl = buildLinkedInUrl(url)

  return (
    <VStack className={cn("gap-3 sm:flex-row", className)}>
      <Button asChild className="flex-1" size="lg" variant="outline">
        <a href={twitterUrl} rel="noopener noreferrer" target="_blank">
          <SiX className="size-4" />
          Share on X
        </a>
      </Button>

      <Button asChild className="flex-1" size="lg" variant="outline">
        <a href={linkedInUrl} rel="noopener noreferrer" target="_blank">
          <SiLinkedin className="size-4" />
          Share on LinkedIn
        </a>
      </Button>
    </VStack>
  )
}
