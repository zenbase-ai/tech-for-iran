"use client"

import { motion } from "motion/react"
import Link from "next/link"
import { LuHouse, LuSettings } from "react-icons/lu"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { NumberTicker } from "@/components/ui/number-ticker"
import { ThemeToggler } from "@/components/ui/theme-toggler"
import { api } from "@/convex/_generated/api"
import useAuthQuery from "@/hooks/use-auth-query"
import { cn, plural } from "@/lib/utils"

export type NavProps = {
  className?: string
}

export const Nav: React.FC<NavProps> = ({ className }) => {
  const stats = useAuthQuery(api.user.query.stats)
  console.log(stats)

  return (
    <motion.nav
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-row items-center justify-center gap-3 md:gap-4",
        "p-2 rounded-full",
        "bg-background/50 backdrop-blur-md",
        "border border-border shadow-md outline-none",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        className
      )}
      initial={{ opacity: 0, y: 24 }}
    >
      <Button asChild size="icon" variant="ghost">
        <Link href="/pods">
          <LuHouse />
        </Link>
      </Button>

      <Badge className="hidden sm:inline-flex" variant="outline">
        <NumberTicker value={stats?.postCount ?? 0} />
        <span className="text-muted-foreground">{plural(stats?.postCount ?? 0, "post")}</span>
      </Badge>

      <Badge className="hidden sm:inline-flex" variant="outline">
        <NumberTicker value={stats?.engagementCount ?? 0} />
        <span className="text-muted-foreground">
          {plural(stats?.engagementCount ?? 0, "action")}
        </span>
      </Badge>

      <Button asChild size="icon" variant="ghost">
        <Link href="/settings">
          <LuSettings />
        </Link>
      </Button>

      <ThemeToggler variant="ghost" />
    </motion.nav>
  )
}
