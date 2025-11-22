"use client"

import { motion } from "motion/react"
import { LuBookOpenText, LuHandMetal } from "react-icons/lu"
import { HStack, type StackProps } from "@/components/layout/stack"
import { cn } from "@/lib/utils"

export type LogoProps = StackProps & {
  animate?: boolean
  size?: string
}

export const Logo: React.FC<LogoProps> = ({ className, size = "size-24", animate, ...props }) => (
  <HStack className={cn("gap-2", className)} items="center" justify="center" wrap {...props}>
    <motion.span
      animate={animate ? { rotate: 360 } : { rotate: 0 }}
      transition={{ duration: 1 }}
      whileHover={{ rotate: 360 }}
    >
      <LuHandMetal className={cn("stroke-[1px]", size)} />
    </motion.span>
    <LuBookOpenText className={cn("stroke-[1px]", size)} />
  </HStack>
)
