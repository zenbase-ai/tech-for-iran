import { cva, type VariantProps } from "class-variance-authority"

const stackVariants = cva("flex", {
  variants: {
    direction: {
      horizontal: "flex-row",
      vertical: "flex-col",
    },
    wrap: {
      true: "flex-wrap",
      false: "flex-nowrap",
    },
    justify: {
      start: "justify-start",
      end: "justify-end",
      center: "justify-center",
      between: "justify-between",
      around: "justify-around",
      evenly: "justify-evenly",
    },
    items: {
      start: "items-start",
      end: "items-end",
      center: "items-center",
      between: "items-between",
      around: "items-around",
      evenly: "items-evenly",
      baseline: "items-baseline",
      stretch: "items-stretch",
    },
  },
  defaultVariants: {
    wrap: false,
  },
})

export type StackProps<T extends React.ElementType = "div"> = React.ComponentProps<T> &
  VariantProps<typeof stackVariants> & {
    as?: T
  }

export const Stack = <T extends React.ElementType = "div">({
  className,
  as: Component = "div",
  wrap,
  justify,
  items,
  direction,
  ...props
}: StackProps<T>) => (
  <Component className={stackVariants({ direction, wrap, justify, items, className })} {...props} />
)

export const HStack = <T extends React.ElementType = "div">({
  className,
  as: Component = "div",
  wrap,
  justify,
  items,
  ...props
}: StackProps<T>) => (
  <Component
    className={stackVariants({ direction: "horizontal", wrap, justify, items, className })}
    {...props}
  />
)

export const VStack = <T extends React.ElementType = "div">({
  className,
  as: Component = "div",
  wrap,
  justify,
  items,
  ...props
}: StackProps<T>) => (
  <Component
    className={stackVariants({ direction: "vertical", wrap, justify, items, className })}
    {...props}
  />
)
