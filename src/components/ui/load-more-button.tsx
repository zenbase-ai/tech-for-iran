import type { IconType } from "react-icons/lib"
import { LuArrowDown } from "react-icons/lu"
import { Button, type ButtonProps } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

export type LoadMoreButtonProps = ButtonProps & {
  isLoading: boolean
  label?: string
  icon?: IconType
}

export const LoadMoreButton: React.FC<LoadMoreButtonProps> = ({
  isLoading,
  icon: Icon = LuArrowDown,
  variant = "outline",
  size = "sm",
  className,
  label,
  children,
  ...props
}) => (
  <Button
    {...props}
    className={cn("max-w-fit", className)}
    disabled={isLoading}
    size={size}
    variant={variant}
  >
    {children ?? `More ${label ?? "items"}`}
    {isLoading ? <Spinner variant="ellipsis" /> : <Icon />}
  </Button>
)
