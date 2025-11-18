"use client"

import { motion } from "motion/react"
import { LuBookOpenText, LuHandMetal } from "react-icons/lu"
import { HStack, type StackProps } from "@/components/layout/stack"
import { cn } from "@/lib/utils"

export type LogoProps = StackProps & {
  animate?: boolean
}

export const Logo: React.FC<LogoProps> = ({ className, animate, ...props }) => (
  <HStack wrap items="center" justify="center" className={cn("gap-2", className)} {...props}>
    <motion.span
      animate={animate ? { rotate: 360 } : { rotate: 0 }}
      transition={{ duration: 1 }}
      whileHover={{ rotate: 360 }}
    >
      <LuHandMetal className="size-24 stroke-[1px]" />
    </motion.span>
    <LuBookOpenText className="size-24 stroke-[1px]" />
  </HStack>
)
