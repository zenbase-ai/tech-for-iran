import {
  Body,
  Column,
  Container,
  Font,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  pixelBasedPreset,
  Row,
  Section,
  Tailwind,
  Text,
} from "@react-email/components"
import { env } from "@/lib/env.mjs"

export type EmailLayoutProps = React.PropsWithChildren<{ preview: string }>

export default function EmailLayout({ children, preview }: EmailLayoutProps) {
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
          <Container className="mx-auto my-[40px] max-w-[600px] rounded-lg p-[20px]">
            <Row>
              <Column className="w-[48px]">
                <Img
                  alt="Crackedbook"
                  className="rounded-lg"
                  height="48"
                  src={`${env.NEXT_PUBLIC_APP_URL}/web-app-manifest-192x192.png`}
                  width="48"
                />
              </Column>
              <Column className="pl-[12px]">
                <Heading className="p-0 text-[30px] font-bold font-serif italic text-foreground">
                  Crackedbook
                </Heading>
              </Column>
            </Row>

            <Section className="my-[32px]">{children}</Section>

            <Text className="text-sm text-muted-foreground">
              Powered by{" "}
              <Link className="text-foreground font-medium" href={env.NEXT_PUBLIC_APP_URL}>
                Crackedbook
              </Link>
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
