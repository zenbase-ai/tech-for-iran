"use client"

import { AnimatePresence, motion, type Variants } from "motion/react"
import Link from "next/link"
import { LuSettings } from "react-icons/lu"
import { HStack } from "@/components/layout/stack"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { api } from "@/convex/_generated/api"
import useAuthQuery from "@/hooks/use-auth-query"
import { fullName, initials } from "@/lib/linkedin"
import { cn } from "@/lib/utils"

export type NavProps = {
  className?: string
}

const variants: Variants = {
  hidden: { opacity: 0, y: -16 },
  visible: { opacity: 1, y: 0 },
}

export const Nav: React.FC<NavProps> = ({ className }) => {
  const { profile } = useAuthQuery(api.linkedin.query.getState) ?? {}

  return (
    <AnimatePresence>
      {profile && (
        <motion.nav
          className={cn(
            "flex flex-row items-center justify-center gap-2",
            "p-2 rounded-full",
            "bg-background/50 backdrop-blur-md",
            "border border-border shadow-md outline-none",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            className,
          )}
          variants={variants}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          <Link href="/pods">
            <HStack items="center" justify="center" className="ml-1 gap-3">
              <Avatar className="size-7">
                <AvatarImage src={profile.picture} alt={fullName(profile)} />
                <AvatarFallback className="text-sm font-semibold text-muted-foreground">
                  {initials(profile)}
                </AvatarFallback>
              </Avatar>

              <span className="text-base font-medium">{fullName(profile)}</span>
            </HStack>
          </Link>

          <Button size="icon" variant="ghost" className="rounded-full" asChild>
            <Link href="/settings">
              <LuSettings />
            </Link>
          </Button>
        </motion.nav>
      )}
    </AnimatePresence>
  )
}
