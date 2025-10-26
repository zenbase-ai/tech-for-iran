import Link, { type LinkProps } from "next/link"
import { LuArrowRight } from "react-icons/lu"
import { Button, type ButtonProps } from "@/components/ui/button"
import { cn, linkProps } from "@/lib/utils"

export type IconLinkProps<R extends string> = Omit<
  LinkProps<R> & React.ComponentProps<"a"> & ButtonProps,
  "children"
> & {
  icon?: React.ReactNode
}

export const IconLink = <R extends string>({
  href,
  icon: Icon,
  className,
  variant = "secondary",
  size = "xs",
  ...props
}: IconLinkProps<R>) => (
  <Link
    {...linkProps<R>(href)}
    className={cn("relative top-[2px] -mb-[2px]", className)}
    {...props}
  >
    <Button variant={variant} size={size}>
      {Icon ?? <LuArrowRight className="size-4" />}
    </Button>
  </Link>
)
