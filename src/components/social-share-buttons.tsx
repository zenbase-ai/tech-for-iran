"use client"

import { SiLinkedin, SiX } from "react-icons/si"
import { VStack } from "@/components/layout/stack"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type SocialShareButtonsProps = {
  url: string
  className?: string
}
/**
 * SocialShareButtons - Share buttons for Twitter/X and LinkedIn.
 *
 * Opens platform-specific share dialogs in new tabs with pre-filled content.
 * Stacks vertically on mobile, horizontally on larger screens.
 */
export const SocialShareButtons: React.FC<SocialShareButtonsProps> = ({ url, className }) => (
  <VStack className={cn("gap-3 sm:flex-row", className)}>
    <Button asChild className="flex-1" size="lg" variant="outline">
      <a href={xURL(url)} rel="noopener noreferrer" target="_blank">
        <SiX className="size-4" />
        Share on X
      </a>
    </Button>

    <Button asChild className="flex-1" size="lg" variant="outline">
      <a href={linkedinURL(url)} rel="noopener noreferrer" target="_blank">
        <SiLinkedin className="size-4" />
        Share on LinkedIn
      </a>
    </Button>
  </VStack>
)

/**
 * Builds the LinkedIn share text.
 * LinkedIn uses URL only - the text is added by the user in the share dialog.
 */
const linkedinURL = (url: string): string => {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
}

/**
 * Builds the Twitter/X intent URL with pre-filled text.
 */
const xURL = (url: string): string => {
  const text =
    "I just signed Tech for Iran - pledging to invest, hire, and build when Iranians are free. Join me:"
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
}
