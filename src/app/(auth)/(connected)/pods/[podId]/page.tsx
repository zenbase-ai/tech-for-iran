import { fetchQuery } from "convex/nextjs"
import type { Metadata } from "next"
import { VStack } from "@/components/layout/stack"
import { api } from "@/convex/_generated/api"
import { clerkAuth } from "@/lib/server/clerk"
import { cn } from "@/lib/utils"
import { PodHeader } from "./_header"
import type { PodPageParams } from "./_types"
import PodPageClient from "./page.client"

export type PodPageProps = {
  params: Promise<PodPageParams>
}

export const generateMetadata = async (props: PodPageProps): Promise<Metadata> => {
  const [{ podId }, { token }] = await Promise.all([props.params, clerkAuth()])
  const pod = await fetchQuery(api.pods.query.get, { podId }, { token })

  return {
    title: `${pod.name} | Crackedbook`,
  }
}

export default function PodPage() {
  "use memo"

  return (
    <VStack
      className={cn("w-full", "mt-4 lg:mt-8", "gap-4 lg:gap-12", "items-center sm:items-start")}
    >
      <PodHeader />

      <PodPageClient />
    </VStack>
  )
}
