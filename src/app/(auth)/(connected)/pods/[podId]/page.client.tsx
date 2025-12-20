"use client"

import { useParams } from "next/navigation"
import { BreakevenProgress } from "@/components/breakeven-progress"
import { Stack, VStack } from "@/components/layout/stack"
import useScreenSize from "@/hooks/use-screen-size"
import { cn } from "@/lib/utils"
import { BoostPostForm } from "./_boost"
import { PodMembers } from "./_members"
import { PodPosts } from "./_posts"
import type { PodPageParams } from "./_types"

export default function PodPageClient() {
  const { podId } = useParams<PodPageParams>()
  const { sm, md, lg } = useScreenSize()
  const gapcn = cn("gap-8 sm:gap-10 md:gap-12 lg:gap-16")

  return (
    <Stack
      className={cn(
        "w-full flex-col items-stretch lg:flex-row lg:items-start lg:justify-between",
        gapcn
      )}
    >
      <VStack className={cn("flex-1", gapcn)} items="stretch">
        <BreakevenProgress className="w-full" />

        <BoostPostForm autoFocus podId={podId} />

        <PodMembers pageSize={lg ? 18 : md ? 12 : sm ? 8 : 4} podId={podId} />
      </VStack>

      <PodPosts className="flex-1" pageSize={md ? 5 : 4} podId={podId} />
    </Stack>
  )
}
