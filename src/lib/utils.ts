import { type ClassValue, clsx } from "clsx"
import type { LinkProps } from "next/link"
import { twMerge } from "tailwind-merge"

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

export const isInternalLink = (href: string) => href.startsWith("/") || href.startsWith("#")

export const linkProps = <R extends string>(href: LinkProps<R>["href"]) =>
  isInternalLink(href.toString()) ? { href } : { href, target: "_blank" }

export type CSS = React.CSSProperties & {
  [variable: `--${string}`]: string | number
}

export const css = (styles: CSS) => styles as React.CSSProperties

export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error)

export const toError = (error: unknown): Error =>
  error instanceof Error ? error : new Error(String(error))

export const queryString = (params: Record<string, string | undefined>) => {
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      searchParams.set(key, value)
    }
  }
  return searchParams.toString()
}

export type PathOptions = {
  searchParams?: Record<string, string | undefined>
  prefixURL?: string
}

export const path = (path: string, { searchParams, prefixURL }: PathOptions = {}) => {
  let result = path
  if (searchParams) {
    result = `${result}?${queryString(searchParams)}`
  }
  if (prefixURL) {
    result = `${prefixURL}${result}`
  }
  return result
}
