"use client"

import { motion, type Variants } from "motion/react"
import { Box, type BoxProps } from "@/components/layout/box"
import { GlowEffect } from "@/components/ui/glow-effect"
import { cn } from "@/lib/utils"
import { IslamicRepublic } from "./islamic-republic"
import { Lion } from "./lion"

const duration = 1

const lionVariants: Variants = {
  mount: { opacity: 0, filter: "blur(8px)", y: 12 },
  transition: { opacity: 1, transition: { duration } },
  rise: { filter: "blur(0)", y: 0, transition: { duration } },
}
const islamicRepublicVariants: Variants = {
  mount: { opacity: 1, y: 0, filter: "grayscale(0.5)" },
  transition: { filter: "grayscale(1)", transition: { duration } },
  fall: { opacity: 0, y: 12, transition: { duration } },
}

export const RisingLion: React.FC<BoxProps> = ({ className, ...props }) => (
  <Box className={cn("relative aspect-7/4 w-full", className)} {...props}>
    <motion.div
      animate={["transition", "rise"]}
      className="absolute inset-0 z-2"
      initial="mount"
      variants={lionVariants}
    >
      <GlowEffect />
      <Lion className="size-full relative" />
    </motion.div>
    <motion.div
      animate={["transition", "fall"]}
      className="absolute inset-0 z-1"
      initial="mount"
      variants={islamicRepublicVariants}
    >
      <IslamicRepublic className="size-full" />
    </motion.div>
  </Box>
)
