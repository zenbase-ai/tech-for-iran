"use client"

import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

export type AvatarProps = React.ComponentProps<typeof AvatarPrimitive.Root>

export const Avatar: React.FC<AvatarProps> = ({ className, ...props }) => (
  <AvatarPrimitive.Root
    className={cn("relative flex size-8 shrink-0 overflow-hidden rounded-full", className)}
    data-slot="avatar"
    {...props}
  />
)

export type AvatarImageProps = React.ComponentProps<typeof AvatarPrimitive.Image>

export const AvatarImage: React.FC<AvatarImageProps> = ({ className, ...props }) => (
  <AvatarPrimitive.Image
    className={cn("aspect-square size-full", className)}
    data-slot="avatar-image"
    {...props}
  />
)

export type AvatarFallbackProps = React.ComponentProps<typeof AvatarPrimitive.Fallback>

export const AvatarFallback: React.FC<AvatarFallbackProps> = ({ className, ...props }) => (
  <AvatarPrimitive.Fallback
    className={cn("bg-muted flex size-full items-center justify-center rounded-full", className)}
    data-slot="avatar-fallback"
    {...props}
  />
)
