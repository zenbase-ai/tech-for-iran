"use client"

import { motion } from "motion/react"
import Link from "next/link"
import { LuHouse, LuSettings } from "react-icons/lu"
import { Button } from "@/components/ui/button"
import { ThemeToggler } from "@/components/ui/theme-toggler"
import { cn } from "@/lib/utils"

export type NavProps = {
  className?: string
}

export const Nav: React.FC<NavProps> = ({ className }) => (
  <motion.nav
    animate={{ opacity: 1, y: 0 }}
    className={cn(
      "flex flex-row items-center justify-center gap-4",
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

    <Button asChild size="icon" variant="ghost">
      <Link href="/settings">
        <LuSettings />
      </Link>
    </Button>

    <ThemeToggler variant="ghost" />
  </motion.nav>
)
