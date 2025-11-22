import { Button, Section, Text } from "@react-email/components"
import { url } from "@/lib/utils"
import EmailLayout from "./layout"

export type ReconnectAccountEmailProps = {
  name: string
}

export default function ReconnectAccountEmail({ name = "John" }: ReconnectAccountEmailProps) {
  return (
    <EmailLayout preview="Reconnect your LinkedIn account to continue engagement">
      <Text className="m-0 text-[16px] leading-[24px] text-foreground">Hi {name},</Text>

      <Text className="m-0 mt-4 text-[16px] leading-[24px] text-foreground">
        We noticed that your LinkedIn account connection has expired or been disconnected.
      </Text>

      <Text className="m-0 mt-4 text-[16px] leading-[24px] text-foreground">
        This can happen for a few reasons:
      </Text>

      <Section className="mx-4">
        <Text className="text-[14px] leading-[22px] my-2">
          • LinkedIn security settings changed
        </Text>
        <Text className="text-[14px] leading-[22px] my-2">• Account credentials were updated</Text>
        <Text className="text-[14px] leading-[22px] my-2">
          • Connection expired after extended inactivity
        </Text>
      </Section>

      <Text className="m-0 my-4 text-[16px] leading-[24px] text-foreground">
        To continue participating in engagement pods and boosting your posts, you'll need to
        reconnect your account.
      </Text>

      {/* CTA Button */}
      <Button
        className="rounded-md bg-primary px-6 py-3 text-center text-[16px] font-semibold text-primary-foreground no-underline"
        href={url("/connect")}
      >
        Reconnect LinkedIn
      </Button>

      <Text className="m-0 mt-4 text-[14px] leading-[22px] text-muted-foreground">
        If you have any questions or need help, feel free to reach out.
      </Text>
    </EmailLayout>
  )
}
