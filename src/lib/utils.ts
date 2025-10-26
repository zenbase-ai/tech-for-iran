import { type ClassValue, clsx } from "clsx"
import type { LinkProps } from "next/link"
import { twMerge } from "tailwind-merge"

export const cast = <A, B>(a: A): B => a as unknown as B

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

export const isInternalLink = (href: string) => href.startsWith("/") || href.startsWith("#")

export const linkProps = <R extends string>(href: LinkProps<R>["href"]) =>
  isInternalLink(href.toString()) ? { href } : { href, target: "_blank" }

export type CSS = React.CSSProperties & {
  [variable: `--${string}`]: string | number
}

export const css = (styles: CSS) => styles as React.CSSProperties
