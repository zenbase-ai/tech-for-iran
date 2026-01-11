"use client"

import { FaEnvelope, FaLinkedin, FaMessage, FaXTwitter } from "react-icons/fa6"
import { Button } from "@/components/ui/button"
import { Skeleton } from "../../ui/skeleton"

export type SignatureShareProps = {
  url: string
}

export const SignatureShare: React.FC<SignatureShareProps> = ({ url }) => (
  <>
    <Button asChild size="icon" variant="outline">
      <a href={xURL(url)} rel="noopener noreferrer" target="_blank">
        <FaXTwitter />
      </a>
    </Button>

    <Button asChild size="icon" variant="outline">
      <a href={linkedinURL(url)} rel="noopener noreferrer" target="_blank">
        <FaLinkedin />
      </a>
    </Button>

    <Button asChild size="icon" variant="outline">
      <a href={smsURL(url)} rel="noopener noreferrer" target="_blank">
        <FaMessage />
      </a>
    </Button>

    <Button asChild size="icon" variant="outline">
      <a href={emailURL(url)} rel="noopener noreferrer" target="_blank">
        <FaEnvelope />
      </a>
    </Button>
  </>
)

export const SignatureShareSkeleton: React.FC = () => (
  <>
    <Skeleton className="flex-1 rounded-full" />
    <Skeleton className="flex-1 rounded-full" />
    <Skeleton className="flex-1 rounded-full" />
    <Skeleton className="flex-1 rounded-full" />
  </>
)

const shareText =
  "I just signed Tech for Iran - pledging to invest, hire, and build when Iranians are free. Join me:"
/**
 * Builds the LinkedIn share text.
 * LinkedIn uses URL only - the text is added by the user in the share dialog.
 */
const linkedinURL = (url: string): string => {
  const text = `${shareText} ${url}`
  return `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(text)}`
}

/**
 * Builds the Twitter/X intent URL with pre-filled text.
 */
const xURL = (url: string): string => {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`
}

/**
 * Builds the SMS share URL with pre-filled text.
 */
const smsURL = (url: string): string => {
  const text = `${shareText} ${url}`
  return `sms:?body=${encodeURIComponent(text)}`
}

/**
 * Builds the email share URL with pre-filled subject and body.
 */
const emailURL = (url: string): string => {
  const subject = "Join me in signing Tech for Iran"
  const body = `${shareText} ${url}`
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
