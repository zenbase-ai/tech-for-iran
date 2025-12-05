import { cn } from "@/lib/utils"

export type SpacerProps = React.ComponentProps<"div"> & {
  as?: "div" | "span"
  x?: number | string
  y?: number | string
  expand?: boolean
}

export const Spacer: React.FC<SpacerProps> = ({
  as: Component = "div",
  className,
  x,
  y,
  expand,
  style,
  ...props
}) => (
  <Component
    className={cn(!!expand && "flex-1", className)}
    style={{
      width: x,
      height: y,
      minWidth: x,
      minHeight: y,
      ...style,
    }}
    {...props}
  />
)
