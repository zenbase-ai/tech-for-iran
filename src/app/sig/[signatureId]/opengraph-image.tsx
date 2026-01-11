import { fetchQuery } from "convex/nextjs"
import { ImageResponse } from "next/og"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { truncate } from "@/lib/utils"

export const runtime = "edge"

export const alt = "Tech for Iran Signature"
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = "image/png"

/**
 * Regex pattern to validate Convex IDs.
 * Convex IDs are 32 character alphanumeric strings.
 */
const CONVEX_ID_REGEX = /^[a-z0-9]{32}$/i

const isValidConvexId = (id: string): boolean => CONVEX_ID_REGEX.test(id)

const fetchInterBold = () =>
  fetch(
    new URL("https://fonts.gstatic.com/s/inter/v18/UcCo3FwrK3iLTcviYwYZ8UA3.woff2", import.meta.url)
  ).then((res) => res.arrayBuffer())

const fetchInterRegular = () =>
  fetch(
    new URL("https://fonts.gstatic.com/s/inter/v18/UcCo3FwrK3iLTcviYwY.woff2", import.meta.url)
  ).then((res) => res.arrayBuffer())

type FontData = {
  interBold: ArrayBuffer
  interRegular: ArrayBuffer
}

const fonts = ({ interBold, interRegular }: FontData) => [
  { name: "Inter", data: interBold, style: "normal" as const, weight: 700 as const },
  { name: "Inter", data: interRegular, style: "normal" as const, weight: 400 as const },
]

function DefaultOGImage({ interBold, interRegular }: FontData) {
  return new ImageResponse(
    <div tw="flex flex-col items-center justify-center w-full h-full bg-white p-12">
      {/* Main Content - Centered */}
      <div tw="flex flex-col items-center justify-center flex-1 gap-8">
        {/* Branding */}
        <div
          style={{ letterSpacing: "0.2em", fontFamily: "Inter" }}
          tw="text-5xl font-bold text-black"
        >
          TECH FOR IRAN
        </div>

        {/* Subtitle */}
        <div
          style={{ fontFamily: "Inter" }}
          tw="text-2xl font-normal text-muted-foreground text-center max-w-4xl leading-relaxed"
        >
          An open letter from founders, investors, and operators pledging to do business with a free
          Iran.
        </div>
      </div>

      {/* Footer */}
      <div tw="flex flex-col items-center w-full gap-6">
        {/* Divider */}
        <div tw="w-full h-px bg-border" />

        {/* URL */}
        <div style={{ fontFamily: "Inter" }} tw="text-base font-medium text-gray-400">
          techforiran.com
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: fonts({ interBold, interRegular }),
    }
  )
}

type SignatureOGImageProps = {
  name: string
  title: string
  company: string
  commitment: string | undefined
} & FontData

function SignatureOGImage({
  name,
  title,
  company,
  commitment,
  interBold,
  interRegular,
}: SignatureOGImageProps) {
  const displayText = commitment
    ? truncate(commitment, { length: 200, on: "word" })
    : "Signed the letter."

  const hasCommitment = !!commitment

  return new ImageResponse(
    <div tw="flex flex-col items-center w-full h-full bg-white p-12">
      {/* Header */}
      <div style={{ gap: "24px" }} tw="flex flex-col items-center w-full">
        {/* Branding */}
        <div
          style={{ letterSpacing: "0.2em", fontFamily: "Inter" }}
          tw="text-lg font-semibold text-black"
        >
          TECH FOR IRAN
        </div>

        {/* Divider */}
        <div tw="w-full h-px bg-gray-300" />
      </div>

      {/* Main Content */}
      <div style={{ gap: "8px" }} tw="flex flex-col items-center justify-center flex-1 my-10">
        {/* Name */}
        <div style={{ fontFamily: "Inter", lineHeight: 1.2 }} tw="text-4xl font-bold text-black">
          {name}
        </div>

        {/* Title, Company */}
        <div
          style={{ fontFamily: "Inter", lineHeight: 1.4 }}
          tw="text-xl font-normal text-gray-500"
        >
          {title}, {company}
        </div>

        {/* Commitment Text */}
        <div
          style={{ fontFamily: "Inter" }}
          tw={`flex mt-8 text-2xl font-normal text-center max-w-4xl leading-relaxed ${hasCommitment ? "text-gray-700 italic" : "text-gray-500"}`}
        >
          {hasCommitment ? `"${displayText}"` : displayText}
        </div>
      </div>

      {/* Footer */}
      <div style={{ gap: "24px" }} tw="flex flex-col items-center w-full">
        {/* Divider */}
        <div tw="w-full h-px bg-gray-300" />

        {/* URL */}
        <div style={{ fontFamily: "Inter" }} tw="text-base font-medium text-gray-400">
          techforiran.com
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: fonts({ interBold, interRegular }),
    }
  )
}

export default async function Image({ params }: { params: Promise<{ signatureId: string }> }) {
  const { signatureId } = await params

  const [interBold, interRegular] = await Promise.all([fetchInterBold(), fetchInterRegular()])

  if (!isValidConvexId(signatureId)) {
    return DefaultOGImage({ interBold, interRegular })
  }

  try {
    const signature = await fetchQuery(api.signatures.query.get, {
      signatureId: signatureId as Id<"signatures">,
    })

    if (!signature) {
      return DefaultOGImage({ interBold, interRegular })
    }

    return SignatureOGImage({
      name: signature.name,
      title: signature.title,
      company: signature.company,
      commitment: signature.commitment,
      interBold,
      interRegular,
    })
  } catch {
    return DefaultOGImage({ interBold, interRegular })
  }
}
