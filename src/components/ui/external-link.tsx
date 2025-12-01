export const ExternalLink: React.FC<React.ComponentProps<"a">> = ({
  children,
  rel = "noopener noreferrer",
  target = "_blank",
  ...props
}) => (
  <a href={props.href} rel={rel} target={target} {...props}>
    {children}
  </a>
)
