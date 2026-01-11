import { fetchQuery } from "convex/nextjs"
import type { Metadata } from "next"
import { cookies } from "next/headers"
import { notFound, redirect } from "next/navigation"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { truncate, url } from "@/lib/utils"

type SharePageProps = {
  params: Promise<{ signatureId: string }>
}

/**
 * Regex pattern to validate Convex IDs.
 * Convex IDs are 32 character alphanumeric strings.
 */
const CONVEX_ID_REGEX = /^[a-z0-9]{32}$/i

const isValidConvexId = (id: string): boolean => CONVEX_ID_REGEX.test(id)

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const { signatureId } = await params

  // Validate ID format before querying
  if (!isValidConvexId(signatureId)) {
    return {
      title: "Signature Not Found | Tech for Iran",
      description: "This signature could not be found.",
    }
  }

  try {
    const signature = await fetchQuery(api.signatures.query.get, {
      signatureId: signatureId as Id<"signatures">,
    })

    if (!signature) {
      return {
        title: "Signature Not Found | Tech for Iran",
        description: "This signature could not be found.",
      }
    }

    const title = `${signature.name} signed Tech for Iran`
    const description = signature.commitment
      ? truncate(signature.commitment, { length: 160 })
      : `${signature.name} pledged to do business with a free Iran. Join the movement.`

    const shareURL = url(`/sig/${signatureId}`)

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: shareURL,
        type: "website",
        siteName: "Tech for Iran",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
    }
  } catch {
    return {
      title: "Signature Not Found | Tech for Iran",
      description: "This signature could not be found.",
    }
  }
}

const REFERRAL_COOKIE_NAME = "referred_by"
const REFERRAL_EXPIRY_DAYS = 7

export default async function SharePage({ params }: SharePageProps) {
  const { signatureId } = await params

  // Validate ID format before querying
  if (!isValidConvexId(signatureId)) {
    notFound()
  }

  // Fetch signature (handle error separately to allow redirect to work)
  let signature
  try {
    signature = await fetchQuery(api.signatures.query.get, {
      signatureId: signatureId as Id<"signatures">,
    })
  } catch {
    notFound()
  }

  if (!signature) {
    notFound()
  }

  // Set the referral cookie
  const cookieStore = await cookies()
  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() + REFERRAL_EXPIRY_DAYS)

  cookieStore.set(REFERRAL_COOKIE_NAME, signatureId, {
    expires: expiryDate,
    path: "/",
    sameSite: "lax",
  })

  // Redirect to homepage with success message
  const successMessage = `${signature.name} encourages you to sign!`
  redirect(`/?success=${encodeURIComponent(successMessage)}`)
}
