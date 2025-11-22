"use client"

import { motion, type Variants } from "motion/react"
import Link from "next/link"
import { LuHouse, LuSettings } from "react-icons/lu"
import { Button } from "@/components/ui/button"
import { ThemeToggler } from "@/components/ui/theme-toggler"
import { cn } from "@/lib/utils"

export type NavProps = {
  className?: string
}

const navVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

export const Nav: React.FC<NavProps> = ({ className }) => (
  <motion.nav
    animate="visible"
    className={cn(
      "flex flex-row items-center justify-center gap-4",
      "p-2 rounded-full",
      "bg-background/50 backdrop-blur-md",
      "border border-border shadow-md outline-none",
      "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
      className
    )}
    exit="hidden"
    initial="hidden"
    variants={navVariants}
  >
    <Button asChild className="rounded-full" size="icon" variant="ghost">
      <Link href="/pods">
        <LuHouse />
      </Link>
    </Button>

    <Button asChild className="rounded-full" size="icon" variant="ghost">
      <Link href="/settings">
        <LuSettings />
      </Link>
    </Button>

    <ThemeToggler className="rounded-full" variant="ghost" />
  </motion.nav>
)
