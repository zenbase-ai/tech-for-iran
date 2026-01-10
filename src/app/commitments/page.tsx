import type { Metadata } from "next"
import { CommitmentsClientPage } from "./page.client"

export const metadata: Metadata = {
  title: "The Wall of Commitments | Tech for Iran",
  description: "Browse, upvote, and share what founders have pledged to do for a free Iran.",
}

export default function CommitmentsPage() {
  "use memo"

  return <CommitmentsClientPage />
}
