import { LuArrowLeft, LuArrowRight } from "react-icons/lu"
import { HStack, type StackProps } from "@/components/layout/stack"
import { Button, type ButtonProps } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type PrevNextPaginationProps = StackProps & {
  variant?: ButtonProps["variant"]
  hasPrev: boolean
  hasNext: boolean
  goPrev: () => void
  goNext: () => void
}

export const PrevNextPagination: React.FC<PrevNextPaginationProps> = ({
  hasPrev,
  hasNext,
  goPrev,
  goNext,
  className,
  items = "center",
  variant = "ghost",
  ...props
}) => (
  <HStack className={cn("gap-2", className)} items={items} {...props}>
    <Button disabled={!hasPrev} onClick={goPrev} size="icon" variant={variant}>
      <LuArrowLeft />
    </Button>
    <Button disabled={!hasNext} onClick={goNext} size="icon" variant={variant}>
      <LuArrowRight />
    </Button>
  </HStack>
)
