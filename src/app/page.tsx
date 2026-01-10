import type { Metadata } from "next"
import { HomeClientPage } from "./page.client"

export const metadata: Metadata = {
  title: "Tech for Iran",
  description: "An open letter from founders, investors, and operators.",
}

export default function HomePage() {
  "use memo"

  return <HomeClientPage />
}
