import type { Metadata } from "next"
import { HomePageClient } from "./page.client"

export const metadata: Metadata = {
  title: "Crackedbook",
}

export default function HomePage() {
  "use memo"
  return <HomePageClient />
}
