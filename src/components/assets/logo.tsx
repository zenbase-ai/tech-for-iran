"use client"

import { motion, type TargetAndTransition } from "motion/react"
import type { IconBaseProps } from "react-icons/lib"
import { LuBook, LuBookA, LuBookText, LuHandMetal } from "react-icons/lu"
import { HStack, type StackProps } from "@/components/layout/stack"
import { cn } from "@/lib/utils"

export type LogoProps = StackProps & {
  animate?: boolean
  size?: string
  stroke?: string
}

export const Logo: React.FC<LogoProps> = ({
  className,
  size = "size-24",
  animate,
  stroke,
  ...props
}) => (
  <HStack className={cn("gap-2", className)} items="center" justify="center" {...props}>
    <LogoHandIcon
      animate={animate ? logoHandIconTransition : {}}
      className={cn(size, stroke)}
      transition={{ duration: 1, delay: 0.3 }}
      whileHover={logoHandIconTransition}
      whileTap={logoHandIconTransition}
    />
    <LogoBookIcon className={stroke} size={size} />
  </HStack>
)

const logoHandIconTransition: TargetAndTransition = {
  rotate: [0, -10, 10, -10, 10, 0],
  transition: { delay: 0.1, duration: 0.5 },
}
const LogoHandIcon = motion.create(LuHandMetal)

type LogoBookIconProps = IconBaseProps & {
  size: string
}

const LogoBookIcon: React.FC<LogoBookIconProps> = ({
  className,
  size: sizecn = "size-24",
  ...props
}) => {
  const size = Number.parseInt(sizecn.split("-")[1], 10)

  if (size <= 3) {
    return <LuBook className={cn(sizecn, className)} {...props} />
  }
  if (size <= 6) {
    return <LuBookA className={cn(sizecn, className)} {...props} />
  }

  return <LuBookText className={cn(sizecn, className)} {...props} />
}
