import type { SendEmailOptions } from "@convex-dev/resend"
import { pretty, render } from "@react-email/render"

export type CreateEmailParams = {
  subject: string
  to: string
  body: React.ReactElement
}

export const createEmail = async ({
  subject,
  to,
  body,
}: CreateEmailParams): Promise<SendEmailOptions> => ({
  from: "Crackedbook <noreply@crackedbook.xyz>",
  to,
  subject,
  html: await pretty(await render(body)),
  replyTo: ["cyrus@zenbase.ai"],
})
