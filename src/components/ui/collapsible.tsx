"use client"

import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"

export const Collapsible: React.FC<React.ComponentProps<typeof CollapsiblePrimitive.Root>> = (
  props
) => <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />

export const CollapsibleTrigger: React.FC<
  React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger>
> = (props) => (
  <CollapsiblePrimitive.CollapsibleTrigger data-slot="collapsible-trigger" {...props} />
)

export const CollapsibleContent: React.FC<
  React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>
> = (props) => (
  <CollapsiblePrimitive.CollapsibleContent data-slot="collapsible-content" {...props} />
)
