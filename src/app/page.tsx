import type { Metadata } from "next"
import HomeClientPage from "./page.client"

export const metadata: Metadata = {
  title: "Crackedbook",
}

export default function HomePage() {
  return <HomeClientPage />
}
