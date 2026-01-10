import { fetchQuery } from "convex/nextjs"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { truncate, url } from "@/lib/utils"
import { SharePageClient } from "./page.client"

type SharePageProps = {
  params: Promise<{ signatoryId: string }>
}

/**
 * Regex pattern to validate Convex IDs.
 * Convex IDs are 32 character alphanumeric strings.
 */
const CONVEX_ID_REGEX = /^[a-z0-9]{32}$/i

const isValidConvexId = (id: string): boolean => CONVEX_ID_REGEX.test(id)

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const { signatoryId } = await params

  // Validate ID format before querying
  if (!isValidConvexId(signatoryId)) {
    return {
      title: "Signatory Not Found | Tech for Iran",
      description: "This signatory could not be found.",
    }
  }

  try {
    const signatory = await fetchQuery(api.signatories.query.get, {
      signatoryId: signatoryId as Id<"signatories">,
    })

    if (!signatory) {
      return {
        title: "Signatory Not Found | Tech for Iran",
        description: "This signatory could not be found.",
      }
    }

    const title = `${signatory.name} signed Tech for Iran`
    const description = signatory.commitmentText
      ? truncate(signatory.commitmentText, { length: 160 })
      : `${signatory.name} pledged to do business with a free Iran. Join the movement.`

    const shareUrl = url(`/s/${signatoryId}`)

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: shareUrl,
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
      title: "Signatory Not Found | Tech for Iran",
      description: "This signatory could not be found.",
    }
  }
}

export default async function SharePage({ params }: SharePageProps) {
  "use memo"

  const { signatoryId } = await params

  // Validate ID format before querying
  if (!isValidConvexId(signatoryId)) {
    notFound()
  }

  try {
    // Verify signatory exists on server
    const signatory = await fetchQuery(api.signatories.query.get, {
      signatoryId: signatoryId as Id<"signatories">,
    })

    if (!signatory) {
      notFound()
    }

    return <SharePageClient signatoryId={signatoryId as Id<"signatories">} />
  } catch {
    notFound()
  }
}
