import type { Metadata } from "next"
import { Box } from "@/components/layout/box"
import { PageTitle } from "@/components/layout/text"

export const metadata: Metadata = {
  title: "Changelog | Crackedbook",
}

export default function ChangelogPage() {
  return (
    <Box className="px-2 w-full max-w-[640px] mx-auto">
      <PageTitle className="text-center">Changelog</PageTitle>
    </Box>
  )
}
