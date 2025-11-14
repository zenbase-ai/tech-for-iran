import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

export const ItemGroup: React.FC<React.ComponentProps<"div">> = ({ className, ...props }) => (
  // biome-ignore lint/a11y/useSemanticElements: silence!
  <div
    role="list"
    data-slot="item-group"
    className={cn("group/item-group flex flex-col", className)}
    {...props}
  />
)

export const ItemSeparator: React.FC<React.ComponentProps<typeof Separator>> = ({
  className,
  ...props
}) => (
  <Separator
    data-slot="item-separator"
    orientation="horizontal"
    className={cn("my-0", className)}
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
  },
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
      data-slot="item"
      data-variant={variant}
      data-size={size}
      className={cn(itemVariants({ variant, size, className }))}
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
  },
)

export type ItemMediaProps = React.ComponentProps<"div"> & VariantProps<typeof itemMediaVariants>

export const ItemMedia: React.FC<ItemMediaProps> = ({
  className,
  variant = "default",
  ...props
}) => (
  <div
    data-slot="item-media"
    data-variant={variant}
    className={cn(itemMediaVariants({ variant, className }))}
    {...props}
  />
)

export const ItemContent: React.FC<React.ComponentProps<"div">> = ({ className, ...props }) => (
  <div
    data-slot="item-content"
    className={cn("flex flex-1 flex-col gap-1 [&+[data-slot=item-content]]:flex-none", className)}
    {...props}
  />
)

export const ItemTitle: React.FC<React.ComponentProps<"div">> = ({ className, ...props }) => (
  <div
    data-slot="item-title"
    className={cn("flex w-fit items-center gap-2 text-base leading-snug font-medium", className)}
    {...props}
  />
)

export const ItemDescription: React.FC<React.ComponentProps<"p">> = ({ className, ...props }) => (
  <p
    data-slot="item-description"
    className={cn(
      "text-muted-foreground line-clamp-2 text-sm leading-normal font-normal text-balance",
      "[&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4",
      className,
    )}
    {...props}
  />
)

export const ItemActions: React.FC<React.ComponentProps<"div">> = ({ className, ...props }) => (
  <div data-slot="item-actions" className={cn("flex items-center gap-2", className)} {...props} />
)

export const ItemHeader: React.FC<React.ComponentProps<"div">> = ({ className, ...props }) => (
  <div
    data-slot="item-header"
    className={cn("flex basis-full items-center justify-between gap-2", className)}
    {...props}
  />
)

export const ItemFooter: React.FC<React.ComponentProps<"div">> = ({ className, ...props }) => (
  <div
    data-slot="item-footer"
    className={cn("flex basis-full items-center justify-between gap-2", className)}
    {...props}
  />
)
