import Link, { type LinkProps } from "next/link"
import { HoverButton, type HoverButtonProps } from "@/components/ui/hover-button"
import { cn, linkProps } from "@/lib/utils"

export type CTALinkButtonProps<R extends string> = LinkProps<R> & HoverButtonProps

export const CTALinkButton = <R extends string>({
  className,
  variant,
  href,
  as,
  replace,
  scroll,
  shallow,
  passHref,
  prefetch,
  locale,
  onMouseEnter,
  onTouchStart,
  onClick,
  onNavigate,
  children,
  disabled,
}: CTALinkButtonProps<R>) => (
  <Link
    {...linkProps<R>(href)}
    as={as}
    aria-disabled={disabled}
    replace={replace}
    scroll={scroll}
    shallow={shallow}
    passHref={passHref}
    prefetch={prefetch}
    locale={locale}
    onMouseEnter={onMouseEnter}
    onTouchStart={onTouchStart}
    onClick={onClick}
    onNavigate={onNavigate}
    className={cn("inline-block cta", disabled && "pointer-events-none")}
  >
    <HoverButton className={className} variant={variant} disabled={disabled} tabIndex={-1}>
      {children}
    </HoverButton>
  </Link>
)
