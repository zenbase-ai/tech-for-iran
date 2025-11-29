"use client"

import { motion } from "motion/react"
import Link from "next/link"
import { LuHouse, LuSettings, LuThumbsUp } from "react-icons/lu"
import { HStack } from "@/components/layout/stack"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { NumberTicker } from "@/components/ui/number-ticker"
import { ThemeToggler } from "@/components/ui/theme-toggler"
import { api } from "@/convex/_generated/api"
import useAuthQuery from "@/hooks/use-auth-query"
import { cn } from "@/lib/utils"

export type NavProps = {
  className?: string
}

export const Nav: React.FC<NavProps> = ({ className }) => {
  const linkedin = useAuthQuery(api.linkedin.query.getState)
  const stats = useAuthQuery(api.user.query.stats)
  const navcn = cn(
    "gap-3",
    "h-13",
    "rounded-full",
    "backdrop-blur-md",
    "border border-border shadow-md outline-none",
    "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
    {
      "bg-background/50": [undefined, "member"].includes(linkedin?.account?.subscription),
      "bg-slate-300/50": linkedin?.account?.subscription === "silver_member",
      "bg-amber-200/50": linkedin?.account?.subscription === "gold_member",
    }
  )

  return (
    <motion.nav
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex flex-row gap-3 items-center justify-between", className)}
      initial={{ opacity: 0, y: 24 }}
    >
      <HStack className={cn(navcn, "p-2")} items="center">
        <Button asChild size="icon" variant="ghost">
          <Link href="/pods">
            <LuHouse />
          </Link>
        </Button>

        <Button asChild size="icon" variant="ghost">
          <Link href="/settings">
            <LuSettings />
          </Link>
        </Button>

        <ThemeToggler variant="ghost" />
      </HStack>

      <HStack className={cn(navcn)} items="center">
        <Badge variant="ghost">
          <NumberTicker value={stats?.engagementCount ?? 0} />
          <LuThumbsUp className="text-muted-foreground" />
        </Badge>
      </HStack>
    </motion.nav>
  )
}
