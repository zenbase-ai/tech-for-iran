"use client"

import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

export type TabsProps = React.ComponentProps<typeof TabsPrimitive.Root>

export const Tabs: React.FC<TabsProps> = ({ className, ...props }) => (
  <TabsPrimitive.Root
    data-slot="tabs"
    className={cn("flex flex-col gap-2", className)}
    {...props}
  />
)

export type TabsListProps = React.ComponentProps<typeof TabsPrimitive.List>

export const TabsList: React.FC<TabsListProps> = ({ className, ...props }) => (
  <TabsPrimitive.List
    data-slot="tabs-list"
    className={cn(
      "bg-muted text-muted-foreground inline-flex w-fit items-center justify-center rounded-full border-1 dark:border-[.5px] border-muted",
      className,
    )}
    {...props}
  />
)

export type TabsTriggerProps = React.ComponentProps<typeof TabsPrimitive.Trigger>

export const TabsTrigger: React.FC<TabsTriggerProps> = ({ className, ...props }) => (
  <TabsPrimitive.Trigger
    data-slot="tabs-trigger"
    className={cn(
      "data-[state=active]:bg-background dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-muted text-foreground dark:text-muted-foreground inline-flex h-full flex-1 items-center justify-center gap-1.5 rounded-full border border-transparent p-2 sm:px-3 text-xs sm:text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
      className,
    )}
    {...props}
  />
)

export type TabsContentProps = React.ComponentProps<typeof TabsPrimitive.Content>

export const TabsContent: React.FC<TabsContentProps> = ({ className, ...props }) => (
  <TabsPrimitive.Content
    data-slot="tabs-content"
    className={cn("flex-1 outline-none", className)}
    {...props}
  />
)
