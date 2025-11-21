import {
  Body,
  Container,
  Font,
  Head,
  Html,
  Preview,
  pixelBasedPreset,
  Tailwind,
} from "@react-email/components"

export default function EmailLayout({
  children,
  preview,
}: React.PropsWithChildren<{ preview: string }>) {
  return (
    <Html>
      <Tailwind
        config={{
          presets: [pixelBasedPreset],
          theme: {
            extend: {
              colors: {
                background: "oklch(0.9843 0.004 106.4719)",
                foreground: "oklch(0.2682 0.0018 106.5218)",
                card: "oklch(0.9843 0.004 106.4719)",
                "card-foreground": "oklch(0.1908 0.002 106.5859)",
                primary: "oklch(0.70417 0.05779 200.327)",
                "primary-foreground": "oklch(0.9843 0.004 106.4719)",
                muted: "oklch(0.9538 0.0066 106.5247)",
                "muted-foreground": "oklch(0.6554 0.0058 106.5592)",
                border: "oklch(0.9182 0.0068 97.3581)",
              },
              fontFamily: {
                serif: ['"Crimson Pro"', "Georgia", "serif"],
                sans: ['"Inter"', "Helvetica", "sans-serif"],
              },
            },
          },
        }}
      >
        <Head>
          <Font
            fallbackFontFamily="serif"
            fontFamily="Crimson Pro"
            fontStyle="normal"
            fontWeight={400}
            webFont={{
              url: "https://fonts.gstatic.com/s/crimsonpro/v28/q5uDsoa5M_tv7IihmnkabARboYF6CsKj.woff2",
              format: "woff2",
            }}
          />
          <Font
            fallbackFontFamily="serif"
            fontFamily="Crimson Pro"
            fontStyle="italic"
            fontWeight={400}
            webFont={{
              url: "https://fonts.gstatic.com/s/crimsonpro/v28/q5uBsoa5M_tv7IihmnkabARekYNwDeChrlU.woff2",
              format: "woff2",
            }}
          />
          <Font
            fallbackFontFamily="serif"
            fontFamily="Crimson Pro"
            fontStyle="italic"
            fontWeight={700}
            webFont={{
              url: "https://fonts.gstatic.com/s/crimsonpro/v28/q5uBsoa5M_tv7IihmnkabARekYNwDeChrlU.woff2",
              format: "woff2",
            }}
          />
          <Font
            fallbackFontFamily="sans-serif"
            fontFamily="Inter"
            fontStyle="normal"
            fontWeight={400}
            webFont={{
              url: "https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7W0Q5nw.woff2",
              format: "woff2",
            }}
          />
          <Font
            fallbackFontFamily="sans-serif"
            fontFamily="Inter"
            fontStyle="normal"
            fontWeight={600}
            webFont={{
              url: "https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7W0Q5nw.woff2",
              format: "woff2",
            }}
          />
        </Head>
        <Preview>{preview}</Preview>
        <Body className="bg-background font-sans text-foreground">
          <Container className="mx-auto my-[40px] max-w-[600px] rounded-lg border border-border bg-card p-[20px]">
            {children}
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
