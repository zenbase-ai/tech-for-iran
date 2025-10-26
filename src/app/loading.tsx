"use client"

import { motion } from "motion/react"
import { Spinner } from "@/components/ui/spinner"
import { TextShimmer } from "@/components/ui/text-shimmer"
import { useMounted } from "@/hooks/use-mounted"

export default function LoadingPage() {
  const isMounted = useMounted({ delay: 250 })

  return (
    <motion.div
      className="flex flex-row items-center justify-center gap-3"
      animate={isMounted ? { opacity: 1 } : { opacity: 0 }}
    >
      <Spinner variant="ring" size={21} className="mt-1" />
      <TextShimmer className="text-lg font-serif" as="h2">
        Loading...
      </TextShimmer>
    </motion.div>
  )
}
