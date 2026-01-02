import type { Metadata } from "next"
import type { PodPageParams } from "../_types"
import WelcomePageClient from "./page.client"

export type WelcomePageProps = {
  params: Promise<PodPageParams>
}

export const metadata: Metadata = {
  title: "Welcome | Crackedbook",
}

export default function WelcomePage() {
  "use memo"

  return <WelcomePageClient />
}
