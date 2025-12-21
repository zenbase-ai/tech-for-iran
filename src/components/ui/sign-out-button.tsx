"use client"

import { SignOutButton as ClerkSignOutButton } from "@clerk/nextjs"
import type React from "react"
import { Button, type ButtonProps } from "./button"

export type SignOutButtonProps = Omit<ButtonProps, "children"> & {
  redirectURL?: string
  options?: React.ComponentProps<typeof ClerkSignOutButton>["signOutOptions"]
}

export const SignOutButton: React.FC<SignOutButtonProps> = ({
  redirectURL,
  options,
  size = "sm",
  variant = "outline",
  className,
  ...props
}) => (
  <ClerkSignOutButton redirectUrl={redirectURL} signOutOptions={options}>
    <Button className={className} size={size} variant={variant} {...props}>
      Sign Out
    </Button>
  </ClerkSignOutButton>
)
