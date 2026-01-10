import { ImageResponse } from "@vercel/og"
import { fetchQuery } from "convex/nextjs"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { truncate } from "@/lib/utils"

export const runtime = "edge"

export const alt = "Tech for Iran Signatory"
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

// Font fetching functions
const fetchInterBold = () =>
  fetch(
    new URL("https://fonts.gstatic.com/s/inter/v18/UcCo3FwrK3iLTcviYwYZ8UA3.woff2", import.meta.url)
  ).then((res) => res.arrayBuffer())

const fetchInterRegular = () =>
  fetch(
    new URL("https://fonts.gstatic.com/s/inter/v18/UcCo3FwrK3iLTcviYwY.woff2", import.meta.url)
  ).then((res) => res.arrayBuffer())

// Default fallback image component
function DefaultOGImage({
  interBold,
  interRegular,
}: {
  interBold: ArrayBuffer
  interRegular: ArrayBuffer
}) {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        backgroundColor: "#FFFFFF",
        padding: "48px",
      }}
    >
      {/* Main Content - Centered */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          flex: 1,
          gap: "32px",
        }}
      >
        {/* Branding */}
        <div
          style={{
            fontSize: "48px",
            fontWeight: 700,
            letterSpacing: "0.2em",
            color: "#000000",
            fontFamily: "Inter",
          }}
        >
          TECH FOR IRAN
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: "24px",
            fontWeight: 400,
            color: "#374151",
            textAlign: "center",
            maxWidth: "900px",
            lineHeight: 1.5,
            fontFamily: "Inter",
          }}
        >
          An open letter from founders, investors, and operators pledging to do business with a free
          Iran.
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          gap: "24px",
        }}
      >
        {/* Divider */}
        <div
          style={{
            width: "100%",
            height: "1px",
            backgroundColor: "#D1D5DB",
          }}
        />

        {/* URL */}
        <div
          style={{
            fontSize: "16px",
            fontWeight: 500,
            color: "#9CA3AF",
            fontFamily: "Inter",
          }}
        >
          techforiran.com
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        {
          name: "Inter",
          data: interBold,
          style: "normal",
          weight: 700,
        },
        {
          name: "Inter",
          data: interRegular,
          style: "normal",
          weight: 400,
        },
      ],
    }
  )
}

// Signatory image component
function SignatoryOGImage({
  name,
  title,
  company,
  commitment,
  interBold,
  interRegular,
}: {
  name: string
  title: string
  company: string
  commitment: string | undefined
  interBold: ArrayBuffer
  interRegular: ArrayBuffer
}) {
  const displayText = commitment
    ? truncate(commitment, { length: 200, on: "word" })
    : "Signed the letter."

  const hasCommitment = !!commitment

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        height: "100%",
        backgroundColor: "#FFFFFF",
        padding: "48px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          gap: "24px",
        }}
      >
        {/* Branding */}
        <div
          style={{
            fontSize: "18px",
            fontWeight: 600,
            letterSpacing: "0.2em",
            color: "#000000",
            fontFamily: "Inter",
          }}
        >
          TECH FOR IRAN
        </div>

        {/* Divider */}
        <div
          style={{
            width: "100%",
            height: "1px",
            backgroundColor: "#D1D5DB",
          }}
        />
      </div>

      {/* Main Content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          flex: 1,
          gap: "8px",
          marginTop: "40px",
          marginBottom: "40px",
        }}
      >
        {/* Name */}
        <div
          style={{
            fontSize: "36px",
            fontWeight: 700,
            color: "#000000",
            fontFamily: "Inter",
            lineHeight: 1.2,
          }}
        >
          {name}
        </div>

        {/* Title, Company */}
        <div
          style={{
            fontSize: "20px",
            fontWeight: 400,
            color: "#6B7280",
            fontFamily: "Inter",
            lineHeight: 1.4,
          }}
        >
          {title}, {company}
        </div>

        {/* Commitment Text */}
        <div
          style={{
            display: "flex",
            marginTop: "32px",
            fontSize: "24px",
            fontWeight: 400,
            color: hasCommitment ? "#374151" : "#6B7280",
            fontFamily: "Inter",
            textAlign: "center",
            maxWidth: "900px",
            lineHeight: 1.5,
            fontStyle: hasCommitment ? "italic" : "normal",
          }}
        >
          {hasCommitment ? `"${displayText}"` : displayText}
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          gap: "24px",
        }}
      >
        {/* Divider */}
        <div
          style={{
            width: "100%",
            height: "1px",
            backgroundColor: "#D1D5DB",
          }}
        />

        {/* URL */}
        <div
          style={{
            fontSize: "16px",
            fontWeight: 500,
            color: "#9CA3AF",
            fontFamily: "Inter",
          }}
        >
          techforiran.com
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        {
          name: "Inter",
          data: interBold,
          style: "normal",
          weight: 700,
        },
        {
          name: "Inter",
          data: interRegular,
          style: "normal",
          weight: 400,
        },
      ],
    }
  )
}

export default async function Image({ params }: { params: Promise<{ signatoryId: string }> }) {
  const { signatoryId } = await params

  // Load fonts in parallel
  const [interBold, interRegular] = await Promise.all([fetchInterBold(), fetchInterRegular()])

  // Validate ID format before querying
  if (!isValidConvexId(signatoryId)) {
    return DefaultOGImage({ interBold, interRegular })
  }

  try {
    const signatory = await fetchQuery(api.signatories.query.get, {
      signatoryId: signatoryId as Id<"signatories">,
    })

    if (!signatory) {
      return DefaultOGImage({ interBold, interRegular })
    }

    return SignatoryOGImage({
      name: signatory.name,
      title: signatory.title,
      company: signatory.company,
      commitment: signatory.commitment,
      interBold,
      interRegular,
    })
  } catch {
    return DefaultOGImage({ interBold, interRegular })
  }
}
