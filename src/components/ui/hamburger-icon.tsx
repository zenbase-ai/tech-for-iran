"use client"

import { type CommonBurgerProps, Squash } from "hamburger-react"
import { useMounted } from "@/hooks/use-mounted"

export type HamburgerIconProps = CommonBurgerProps

export const HamburgerIcon: React.FC<CommonBurgerProps> = ({ ...props }) => {
  const isMounted = useMounted()

  return !isMounted ? null : <Squash {...props} />
}
