import { fetchQuery } from "convex/nextjs"
import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { truncate, url } from "@/lib/utils"

export type SignaturePageParams = {
  signatureId: Id<"signatures">
}

export type SignaturePageProps = {
  params: Promise<SignaturePageParams>
}

export async function generateMetadata({ params }: SignaturePageProps): Promise<Metadata> {
  const { signatureId } = await params

  try {
    const signature = await fetchQuery(api.signatures.query.get, { signatureId })

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

export default async function SignaturePage({ params }: SignaturePageProps) {
  const { signatureId } = await params
  const signature = await fetchQuery(api.signatures.query.get, { signatureId })

  if (!signature) {
    return notFound()
  }

  const successMessage = `${signature.name} encourages you to sign!`
  return redirect(`/?referredBy=${signatureId}&success=${encodeURIComponent(successMessage)}`)
}
