"use client"

import { motion, type TargetAndTransition } from "motion/react"
import Link from "next/link"
import { LuHouse } from "react-icons/lu"
import { HStack } from "@/components/layout/stack"
import { Button } from "@/components/ui/button"
import { ThemeToggler } from "@/components/ui/theme-toggler"
import { cn } from "@/lib/utils"

export type NavProps = {
  initial: TargetAndTransition
  className?: string
}

export const Nav: React.FC<NavProps> = ({ initial, className }) => {
  const navcn = cn(
    "gap-3",
    "h-13",
    "rounded-full",
    "bg-background/50 backdrop-blur-md",
    "border shadow-md outline-none",
    "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
    "border-border"
  )

  return (
    <motion.nav
      animate={{ opacity: 1, y: 0, x: 0 }}
      className={cn("flex flex-row gap-3 items-center justify-between", className)}
      initial={initial}
    >
      <HStack className={cn(navcn, "p-2")} items="center">
        <Button asChild size="icon" variant="ghost">
          <Link href="/">
            <LuHouse />
          </Link>
        </Button>

        <ThemeToggler variant="ghost" />
      </HStack>
    </motion.nav>
  )
}
