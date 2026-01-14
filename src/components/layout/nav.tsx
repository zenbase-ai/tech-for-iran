"use client"

import { useQuery } from "convex/react"
import { motion } from "motion/react"
import { LuPenLine, LuThumbsUp } from "react-icons/lu"
import { Logo } from "@/components/assets/logo"
import { HStack } from "@/components/layout/stack"
import { GlowEffect } from "@/components/ui/glow-effect"
import { NumberTicker } from "@/components/ui/number-ticker"
import { ThemeToggler } from "@/components/ui/theme-toggler"
import { api } from "@/convex/_generated/api"
import { cn } from "@/lib/utils"
import { Badge } from "../ui/badge"

export const Nav: React.FC = () => {
  const signatureCount = useQuery(api.signatures.query.count)
  const upvoteCount = useQuery(api.upvotes.query.count)

  return (
    <>
      <motion.nav
        animate={{ opacity: 1, y: 0, x: 0 }}
        className={cn(
          "fixed z-42 flex flex-row gap-8 items-center justify-between",
          "left-4 lg:left-8 xl:left-16 top-4 lg:top-8 xl:top-16 z-42"
        )}
        initial={{ opacity: 0, y: -16 }}
      >
        <HStack
          className={cn(
            "px-0.5 h-10",
            "rounded-full",
            "bg-background/50 backdrop-blur-md",
            "border shadow-md",
            "border-border",
            "text-base font-medium text-muted-foreground"
          )}
          items="center"
        >
          <ThemeToggler variant="ghost" />
          <Badge variant="ghost">
            <NumberTicker className="tabular-nums" value={signatureCount ?? 0} />
            <LuPenLine className="size-4" />
          </Badge>
          <Badge variant="ghost">
            <NumberTicker className="tabular-nums" value={upvoteCount ?? 0} />
            <LuThumbsUp className="size-4" />
          </Badge>
        </HStack>
      </motion.nav>
      <motion.div
        className={cn(
          "fixed z-42 p-2 backdrop-blur-md bg-background/50 rounded-full overflow-hidden",
          "bottom-4 xl:top-6",
          "right-4 xl:right-6",
          "size-20 xl:size-24"
        )}
      >
        <GlowEffect duration={12} mode="pulse" />
        <Logo />
      </motion.div>
    </>
  )
}
