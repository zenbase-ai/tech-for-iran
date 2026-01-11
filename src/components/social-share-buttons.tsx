"use client"

import { FaEnvelope, FaLinkedin, FaMessage, FaXTwitter } from "react-icons/fa6"
import { VStack } from "@/components/layout/stack"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Skeleton } from "./ui/skeleton"

export type SocialShareButtonsProps = {
  url: string
  className?: string
}

export const SocialShareButtons: React.FC<SocialShareButtonsProps> = ({ url, className }) => (
  <VStack className={cn("gap-3 sm:flex-row", className)}>
    <Button asChild className="flex-1" size="lg" variant="outline">
      <a href={xURL(url)} rel="noopener noreferrer" target="_blank">
        <FaXTwitter />
        Share on X
      </a>
    </Button>

    <Button asChild className="flex-1" size="lg" variant="outline">
      <a href={linkedinURL(url)} rel="noopener noreferrer" target="_blank">
        <FaLinkedin />
        Share on LinkedIn
      </a>
    </Button>

    <Button asChild className="flex-1" size="lg" variant="outline">
      <a href={smsURL(url)} rel="noopener noreferrer" target="_blank">
        <FaMessage />
        Share via SMS
      </a>
    </Button>

    <Button asChild className="flex-1" size="lg" variant="outline">
      <a href={emailURL(url)} rel="noopener noreferrer" target="_blank">
        <FaEnvelope />
        Share via Email
      </a>
    </Button>
  </VStack>
)

export const SocialShareButtonsSkeleton: React.FC = () => (
  <VStack className="gap-3 sm:flex-row">
    <Skeleton className="flex-1 rounded-full" />
    <Skeleton className="flex-1 rounded-full" />
    <Skeleton className="flex-1 rounded-full" />
    <Skeleton className="flex-1 rounded-full" />
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

/**
 * Builds the SMS share URL with pre-filled text.
 */
const smsURL = (url: string): string => {
  const text = `I just signed Tech for Iran - pledging to invest, hire, and build when Iranians are free. Join me: ${url}`
  return `sms:?body=${encodeURIComponent(text)}`
}

/**
 * Builds the email share URL with pre-filled subject and body.
 */
const emailURL = (url: string): string => {
  const subject = "Join me in signing Tech for Iran"
  const body = `I just signed Tech for Iran - pledging to invest, hire, and build when Iranians are free. Join me: ${url}`
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
