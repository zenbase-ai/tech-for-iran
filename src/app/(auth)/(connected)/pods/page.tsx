import type { Metadata } from "next"
import PodsClientPage from "./page.client"

export const metadata: Metadata = {
  title: "Pods | Crackedbook",
}

export default async function PodsPage() {
  "use memo"

  return <PodsClientPage />
}
