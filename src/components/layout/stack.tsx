import { cn } from "@/lib/utils"

export type StackProps = React.ComponentProps<"div"> & {
  as?: "div" | "section" | "article" | "header" | "footer" | "main" | "nav"
  wrap?: boolean
  justify?: "start" | "end" | "center" | "between" | "around" | "evenly"
  items?:
    | "start"
    | "end"
    | "center"
    | "between"
    | "around"
    | "evenly"
    | "baseline"
    | "stretch"
    | "baseline"
  direction?: "row" | "col"
}

export const Stack: React.FC<StackProps> = ({
  className,
  as: Component = "div",
  wrap = false,
  justify,
  items,
  ...props
}) => (
  <Component className={flexcn({ direction: "col", wrap, justify, items, className })} {...props} />
)

export const HStack: React.FC<StackProps> = ({
  className,
  as: Component = "div",
  wrap = false,
  justify,
  items,
  ...props
}) => (
  <Component className={flexcn({ direction: "row", wrap, justify, items, className })} {...props} />
)

export const VStack: React.FC<StackProps> = ({
  className,
  as: Component = "div",
  wrap = false,
  justify,
  items,
  ...props
}) => (
  <Component className={flexcn({ direction: "col", wrap, justify, items, className })} {...props} />
)

const flexcn = ({
  direction = "col",
  wrap = false,
  justify,
  items,
  className,
}: Pick<StackProps, "direction" | "wrap" | "justify" | "items" | "className">) =>
  cn(
    "flex",
    direction === "row" ? "flex-row" : "flex-col",
    wrap && "flex-wrap",
    justify &&
      {
        start: "justify-start",
        end: "justify-end",
        center: "justify-center",
        between: "justify-between",
        around: "justify-around",
        evenly: "justify-evenly",
      }[justify],
    items &&
      {
        start: "items-start",
        end: "items-end",
        center: "items-center",
        between: "items-between",
        around: "items-around",
        evenly: "items-evenly",
        baseline: "items-baseline",
        stretch: "items-stretch",
      }[items],
    className,
  )
