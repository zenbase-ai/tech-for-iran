"use client"

import { AnimatePresence, motion, type Variants } from "motion/react"
import Link from "next/link"
import { LuSettings } from "react-icons/lu"
import { HStack } from "@/components/layout/stack"
import { LinkedInProfileAvatar } from "@/components/presenters/linkedinProfiles/avatar"
import { Button } from "@/components/ui/button"
import { api } from "@/convex/_generated/api"
import useAuthQuery from "@/hooks/use-auth-query"
import { fullName } from "@/lib/linkedin"
import { cn } from "@/lib/utils"

export type NavProps = {
  className?: string
}

const navVariants: Variants = {
  hidden: { opacity: 0, y: -16 },
  visible: { opacity: 1, y: 0 },
}

export const Nav: React.FC<NavProps> = ({ className }) => {
  const { profile } = useAuthQuery(api.linkedin.query.getState) ?? {}

  return (
    <AnimatePresence>
      {profile && (
        <motion.nav
          animate="visible"
          className={cn(
            "flex flex-row items-center justify-center gap-2",
            "p-2 rounded-full",
            "bg-muted/50 backdrop-blur-md",
            "border border-border shadow-md outline-none",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            className
          )}
          exit="hidden"
          initial="hidden"
          variants={navVariants}
        >
          <Link href="/pods">
            <HStack className="ml-1 gap-3" items="center" justify="center">
              <LinkedInProfileAvatar profile={profile} />

              <span className="text-base font-medium">{fullName(profile)}</span>
            </HStack>
          </Link>

          <Button asChild className="rounded-full" size="icon" variant="ghost">
            <Link href="/settings">
              <LuSettings />
            </Link>
          </Button>
        </motion.nav>
      )}
    </AnimatePresence>
  )
}
