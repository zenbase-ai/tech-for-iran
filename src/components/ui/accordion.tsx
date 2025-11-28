"use client"

import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { LuChevronDown } from "react-icons/lu"

import { cn } from "@/lib/utils"

export const Accordion: React.FC<React.ComponentProps<typeof AccordionPrimitive.Root>> = ({
  ...props
}) => <AccordionPrimitive.Root data-slot="accordion" {...props} />

export const AccordionItem: React.FC<React.ComponentProps<typeof AccordionPrimitive.Item>> = ({
  className,
  ...props
}) => (
  <AccordionPrimitive.Item
    className={cn("border-b last:border-b-0", className)}
    data-slot="accordion-item"
    {...props}
  />
)

export const AccordionTrigger: React.FC<
  React.ComponentProps<typeof AccordionPrimitive.Trigger>
> = ({ className, children, ...props }) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      className={cn(
        "focus-visible:border-ring focus-visible:ring-ring/50 flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180",
        className
      )}
      data-slot="accordion-trigger"
      {...props}
    >
      {children}
      <LuChevronDown className="text-muted-foreground pointer-events-none size-4 shrink-0 translate-y-0.5 transition-transform duration-200" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
)

export const AccordionContent: React.FC<
  React.ComponentProps<typeof AccordionPrimitive.Content>
> = ({ className, children, ...props }) => (
  <AccordionPrimitive.Content
    className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-sm"
    data-slot="accordion-content"
    {...props}
  >
    <div className={cn("pt-0 pb-4", className)}>{children}</div>
  </AccordionPrimitive.Content>
)
