import type { Metadata } from "next"
import PodsClientPage, { type PodsClientPageParams } from "./page.client"

export const metadata: Metadata = {
  title: "Pods | Crackedbook",
}

export type PodsPageParams = {
  searchParams: Promise<PodsClientPageParams["searchParams"]>
}

export default async function PodsPage({ searchParams }: PodsPageParams) {
  return <PodsClientPage searchParams={await searchParams} />
}
