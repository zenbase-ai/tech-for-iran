import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

export const ItemGroup: React.FC<React.ComponentProps<"div">> = ({ className, ...props }) => (
  // biome-ignore lint/a11y/useSemanticElements: silence!
  <div
    className={cn("group/item-group flex flex-col", className)}
    data-slot="item-group"
    role="list"
    {...props}
  />
)

export const ItemSeparator: React.FC<React.ComponentProps<typeof Separator>> = ({
  className,
  ...props
}) => (
  <Separator
    className={cn("my-0", className)}
    data-slot="item-separator"
    orientation="horizontal"
    {...props}
  />
)

const itemVariants = cva(
  "group/item flex items-center border border-transparent text-sm rounded-lg transition-colors [a]:hover:bg-accent/50 [a]:transition-colors duration-100 flex-wrap outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline: "border-border",
        muted: "bg-muted/50",
      },
      size: {
        default: "p-4 gap-4",
        sm: "py-3 px-4 gap-2.5",
        xs: "py-2 px-3 gap-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export type ItemProps = React.ComponentProps<"div"> &
  VariantProps<typeof itemVariants> & { asChild?: boolean }

export const Item: React.FC<ItemProps> = ({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}) => {
  const Comp = asChild ? Slot : "div"
  return (
    <Comp
      className={cn(itemVariants({ variant, size, className }))}
      data-size={size}
      data-slot="item"
      data-variant={variant}
      {...props}
    />
  )
}

const itemMediaVariants = cva(
  "flex shrink-0 items-center justify-center gap-2 group-has-[[data-slot=item-description]]/item:self-start [&_svg]:pointer-events-none group-has-[[data-slot=item-description]]/item:translate-y-0.5",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        icon: "size-8 border rounded-sm bg-muted [&_svg:not([class*='size-'])]:size-4",
        image: "size-10 rounded-sm overflow-hidden [&_img]:size-full [&_img]:object-cover",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export type ItemMediaProps = React.ComponentProps<"div"> & VariantProps<typeof itemMediaVariants>

export const ItemMedia: React.FC<ItemMediaProps> = ({
  className,
  variant = "default",
  ...props
}) => (
  <div
    className={cn(itemMediaVariants({ variant, className }))}
    data-slot="item-media"
    data-variant={variant}
    {...props}
  />
)

export const ItemContent: React.FC<React.ComponentProps<"div">> = ({ className, ...props }) => (
  <div
    className={cn("flex flex-1 flex-col gap-1 [&+[data-slot=item-content]]:flex-none", className)}
    data-slot="item-content"
    {...props}
  />
)

export const ItemTitle: React.FC<React.ComponentProps<"div">> = ({ className, ...props }) => (
  <div
    className={cn("flex w-fit items-center gap-2 text-base leading-snug font-medium", className)}
    data-slot="item-title"
    {...props}
  />
)

export const ItemDescription: React.FC<React.ComponentProps<"p">> = ({ className, ...props }) => (
  <p
    className={cn(
      "text-muted-foreground line-clamp-2 text-sm leading-normal font-normal text-balance",
      "[&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4",
      className
    )}
    data-slot="item-description"
    {...props}
  />
)

export const ItemActions: React.FC<React.ComponentProps<"div">> = ({ className, ...props }) => (
  <div className={cn("flex items-center gap-2", className)} data-slot="item-actions" {...props} />
)

export const ItemHeader: React.FC<React.ComponentProps<"div">> = ({ className, ...props }) => (
  <div
    className={cn("flex basis-full items-center justify-between gap-2", className)}
    data-slot="item-header"
    {...props}
  />
)

export const ItemFooter: React.FC<React.ComponentProps<"div">> = ({ className, ...props }) => (
  <div
    className={cn("flex basis-full items-center justify-between gap-2", className)}
    data-slot="item-footer"
    {...props}
  />
)
