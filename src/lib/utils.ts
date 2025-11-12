import { type ClassValue, clsx } from "clsx"
import type { LinkProps } from "next/link"
import { twMerge } from "tailwind-merge"
import { env } from "./env.mjs"

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

export type AppURLOptions = {
  searchParams?: Record<string, string | undefined>
  absolute?: boolean
}

export const appURL = (path: string, { searchParams, absolute = true }: AppURLOptions = {}) => {
  let url = `/${path}`
  if (searchParams) {
    url = `${url}?${queryString(searchParams)}`
  }
  if (absolute) {
    url = `${env.NEXT_PUBLIC_APP_URL}${url}`
  }
  return url
}
