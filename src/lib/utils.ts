import { type ClassValue, clsx } from "clsx"
import type { Route as NextRoute } from "next"
import { twMerge } from "tailwind-merge"
import { env } from "./env.mjs"

// Tailwind merge CSS classnames
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

// CSS properties with custom variables
export type CSS = React.CSSProperties & {
  [variable: `--${string}`]: string | number
}

export const css = (styles: CSS) => styles as React.CSSProperties

// Error messages
export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error)

export const toError = (error: unknown): Error =>
  error instanceof Error ? error : new Error(String(error))

// Query string utils
export const queryString = (params: Record<string, string | undefined>) => {
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      searchParams.set(key, value)
    }
  }
  return searchParams.toString()
}

const queryParams = (searchParams?: Record<string, string | undefined>) =>
  searchParams && Object.keys(searchParams).length !== 0 ? `?${queryString(searchParams)}` : ""

// Typed route and URL helpers
export type Route<T extends string> = NextRoute<T> | "/sign-in" | "/sign-up"

export type RouteOptions = {
  searchParams?: Record<string, string | undefined>
}

export const route = <T extends string>(path: Route<T>, { searchParams }: RouteOptions = {}) =>
  `${path}${queryParams(searchParams)}` as Route<T>

export const url = <T extends string>(path: Route<T>, options: RouteOptions = {}) =>
  `${env.NEXT_PUBLIC_APP_URL}${route(path, options)}` as Route<T>
