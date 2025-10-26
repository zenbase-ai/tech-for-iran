export type BoxProps = React.ComponentProps<"div"> & {
  as?: "div" | "section" | "article" | "header" | "footer" | "main" | "nav"
}

export const Box: React.FC<BoxProps> = ({ as: Component = "div", children, ...props }) => (
  <Component {...props}>{children}</Component>
)
