"use client"

import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

export type AvatarProps = React.ComponentProps<typeof AvatarPrimitive.Root>

export const Avatar: React.FC<AvatarProps> = ({ className, ...props }) => (
  <AvatarPrimitive.Root
    data-slot="avatar"
    className={cn("relative flex size-8 shrink-0 overflow-hidden rounded-full", className)}
    {...props}
  />
)

export type AvatarImageProps = React.ComponentProps<typeof AvatarPrimitive.Image>

export const AvatarImage: React.FC<AvatarImageProps> = ({ className, ...props }) => (
  <AvatarPrimitive.Image
    data-slot="avatar-image"
    className={cn("aspect-square size-full", className)}
    {...props}
  />
)

export type AvatarFallbackProps = React.ComponentProps<typeof AvatarPrimitive.Fallback>

export const AvatarFallback: React.FC<AvatarFallbackProps> = ({ className, ...props }) => (
  <AvatarPrimitive.Fallback
    data-slot="avatar-fallback"
    className={cn("bg-muted flex size-full items-center justify-center rounded-full", className)}
    {...props}
  />
)
