"use client"

import { motion } from "motion/react"
import { Spinner, type SpinnerProps } from "@/components/ui/spinner"
import { TextShimmer } from "@/components/ui/text-shimmer"
import { useMounted } from "@/hooks/use-mounted"
import { cn } from "@/lib/utils"

export type LoadingProps = {
  message?: string
  variant?: SpinnerProps["variant"]
  size?: number
  delay?: number
  className?: string
}

export const Loading: React.FC<LoadingProps> = ({
  message,
  variant = "pinwheel",
  size = 24,
  delay = 100,
  className,
}) => {
  const isMounted = useMounted({ delay })

  return (
    <motion.div
      className={cn("flex flex-col items-center justify-center", className)}
      animate={isMounted ? { opacity: 1 } : { opacity: 0 }}
    >
      <Spinner variant={variant} size={size} className="mt-1 text-muted-foreground" />
      {message && (
        <TextShimmer className="text-lg font-serif italic" as="h2">
          {message}
        </TextShimmer>
      )}
    </motion.div>
  )
}
