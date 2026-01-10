import { ImageResponse } from "@vercel/og"

export const runtime = "edge"

export const alt = "Tech for Iran"
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = "image/png"

export default async function Image() {
  // Load Inter font from Google Fonts
  const interBold = await fetch(
    new URL("https://fonts.gstatic.com/s/inter/v18/UcCo3FwrK3iLTcviYwYZ8UA3.woff2", import.meta.url)
  ).then((res) => res.arrayBuffer())

  const interRegular = await fetch(
    new URL("https://fonts.gstatic.com/s/inter/v18/UcCo3FwrK3iLTcviYwY.woff2", import.meta.url)
  ).then((res) => res.arrayBuffer())

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
