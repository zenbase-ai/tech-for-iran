"use client"

import { useQuery } from "convex/react"
import { motion, type TargetAndTransition } from "motion/react"
import { LuPenLine, LuThumbsUp } from "react-icons/lu"
import { HStack } from "@/components/layout/stack"
import { NumberTicker } from "@/components/ui/number-ticker"
import { ThemeToggler } from "@/components/ui/theme-toggler"
import { api } from "@/convex/_generated/api"
import { cn } from "@/lib/utils"

export type NavProps = {
  initial: TargetAndTransition
  className?: string
}

export const Nav: React.FC<NavProps> = ({ initial, className }) => {
  const signatureCount = useQuery(api.signatures.query.count)
  const upvoteCount = useQuery(api.upvotes.query.count)

  return (
    <motion.nav
      animate={{ opacity: 1, y: 0, x: 0 }}
      className={cn("flex flex-row gap-3 items-center justify-between", className)}
      initial={initial}
    >
      <HStack
        className={cn(
          "gap-4 px-4 h-10",
          "rounded-full",
          "bg-background/50 backdrop-blur-md",
          "border shadow-md",
          "border-border",
          "text-sm font-medium text-muted-foreground"
        )}
        items="center"
      >
        <ThemeToggler className="-ml-3.5" variant="ghost" />
        <HStack className="gap-1.5" items="center">
          <LuPenLine className="size-4" />
          <NumberTicker value={signatureCount ?? 0} />
        </HStack>
        <HStack className="gap-1.5" items="center">
          <LuThumbsUp className="size-4" />
          <NumberTicker value={upvoteCount ?? 0} />
        </HStack>
      </HStack>
    </motion.nav>
  )
}
