"use client"

import { motion } from "motion/react"
import { Logo } from "@/components/assets/logo"
import { TextShimmer } from "@/components/ui/text-shimmer"
import useMounted from "@/hooks/use-mounted"
import { cn } from "@/lib/utils"

export type LoadingProps = {
  message?: string
  delay?: number
  className?: string
}

export const Loading: React.FC<LoadingProps> = ({ message, delay = 0, className }) => {
  const isMounted = useMounted({ delay })

  return (
    <motion.div
      className={cn("flex flex-col items-center justify-center py-1 w-fit mx-auto", className)}
      animate={isMounted ? { opacity: 1 } : { opacity: 0 }}
    >
      <Logo animate className="text-muted" />

      {message && (
        <TextShimmer className="text-lg font-serif italic" as="h2">
          {message}
        </TextShimmer>
      )}
    </motion.div>
  )
}
