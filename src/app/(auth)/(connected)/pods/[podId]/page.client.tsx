"use client"

import { useParams } from "next/navigation"
import { Grid } from "@/components/layout/grid"
import useScreenSize from "@/hooks/use-screen-size"
import { cn } from "@/lib/utils"
import { BoostPostForm } from "./_boost"
import { PodMembers } from "./_members"
import { PodPosts } from "./_posts"
import type { PodPageParams } from "./_types"

export default function PodPageClient() {
  const { podId } = useParams<PodPageParams>()
  const sm = useScreenSize("sm")
  const lg = useScreenSize("lg")
  const gapcn = cn("gap-8 sm:gap-10 md:gap-12 lg:gap-16")

  return (
    <Grid className={cn(gapcn)} cols={12}>
      <BoostPostForm autoFocus className="col-span-12 lg:col-span-5" podId={podId} />

      <PodMembers
        className="col-span-12 lg:col-span-7"
        pageSize={lg ? 18 : sm ? 12 : 6}
        podId={podId}
      />

      <PodPosts className="col-span-12 lg:col-span-5" pageSize={5} podId={podId} />
    </Grid>
  )
}
