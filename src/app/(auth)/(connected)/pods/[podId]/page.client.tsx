"use client"

import { useParams } from "next/navigation"
import { Grid } from "@/components/layout/grid"
import useScreenSize from "@/hooks/use-screen-size"
import { BoostPostForm } from "./_boost"
import { PodMembers } from "./_members"
import { PodPosts } from "./_posts"
import type { PodPageParams } from "./_types"

export default function PodPageClient() {
  const { podId } = useParams<PodPageParams>()
  const sm = useScreenSize("sm")
  const lg = useScreenSize("lg")

  return (
    <Grid className="grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 md:gap-12 lg:gap-16">
      <BoostPostForm autoFocus podId={podId} />

      <PodMembers className="lg:order-1" pageSize={lg ? 20 : sm ? 12 : 6} podId={podId} />

      <PodPosts className="lg:order-2" pageSize={5} podId={podId} />
    </Grid>
  )
}
