"use client"

import Link from "next/link"
import { Logo } from "@/components/assets/logo"
import { Nav } from "@/components/layout/nav"
import { Separator } from "@/components/ui/separator"
import useScreenSize from "@/hooks/use-screen-size"
import { cn } from "@/lib/utils"
import { HStack, type StackProps } from "./stack"
import { PageTitle } from "./text"

export type PageHeaderProps = StackProps & {
  title: React.ReactNode
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  className,
  children,
  title,
  items = "center",
  justify = "start",
  wrap = true,
  ...props
}) => {
  const { md } = useScreenSize()

  return (
    <HStack
      className={cn("w-full gap-2 sm:gap-3 lg:gap-4", className)}
      items={items}
      justify={justify}
      wrap={wrap}
      {...props}
    >
      <Link href="/pods">
        <Logo className="stroke-2" size="size-7" />
      </Link>

      <Separator className="h-9!" orientation="vertical" />

      <PageTitle className="-mt-1">{title}</PageTitle>

      {children}

      <Nav
        className={cn(
          "z-50 w-fit",
          "fixed mx-auto left-0 right-0 bottom-2",
          "sm:bottom-4",
          "md:static md:mr-0"
        )}
        initial={md ? { opacity: 1, x: 24 } : { opacity: 0, y: 24 }}
      />
    </HStack>
  )
}
