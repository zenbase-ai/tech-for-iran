import { type ClassValue, clsx } from "clsx"
import { randomInt, zip } from "es-toolkit"
import type { Route as NextRoute } from "next"
import pMap from "p-map"
import plur from "plur"
import { twMerge } from "tailwind-merge"
import { env } from "./env.mjs"

// =================================================================
// =========================== CSS =================================
// =================================================================

// Tailwind merge CSS classnames
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

// CSS properties with custom variables
export type CSS = React.CSSProperties & {
  [variable: `--${string}`]: string | number
}

export const css = (styles: CSS) => styles as React.CSSProperties

// =================================================================
// ========================== Errors ===============================
// =================================================================
export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error)

export const toError = (error: unknown): Error =>
  error instanceof Error ? error : new Error(String(error))

// =================================================================
// ============================= URLs ==============================
// =================================================================
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

// =================================================================
// =========================== Random ==============================
// =================================================================

// Returns true with probability `numerator/denominator`
export const chance = (numerator: number, denominator: number) =>
  randomInt(0, denominator) < numerator

// =================================================================
// =========================== Strings =============================
// =================================================================

export const pluralize = (count: number, word: string) => `${count} ${plur(word, count)}`

export type TruncateOptions = {
  length: number
  overflow?: string
  on?: "char" | "word"
}

export const truncate = (text: string, options: TruncateOptions): string => {
  const { length: maxLength, overflow = "...", on = "word" } = options

  if (text.length <= maxLength) {
    return text
  }

  const truncateLength = maxLength - overflow.length

  if (truncateLength <= 0) {
    return overflow.slice(0, maxLength)
  }

  if (on === "char") {
    return text.slice(0, truncateLength) + overflow
  }

  // on === "word"
  const truncated = text.slice(0, truncateLength)
  const lastSpaceIndex = truncated.lastIndexOf(" ")

  if (lastSpaceIndex === -1) {
    return truncated + overflow
  }

  return truncated.slice(0, lastSpaceIndex) + overflow
}

// =================================================================
// =========================== Parallel ============================
// =================================================================

export type ParallelOptions = Parameters<typeof pMap>[2]

export const defaultOptions: ParallelOptions = {
  concurrency: 32,
  stopOnError: true,
}

export const pmap = <T = unknown, R = unknown>(
  array: T[],
  mapFn: (item: T) => Promise<R>,
  options: ParallelOptions = {}
) => pMap(array, mapFn, { ...defaultOptions, ...options })

export const pflatMap = <T = unknown, R = unknown>(
  array: T[],
  mapFn: (item: T) => Promise<R[]>,
  options: ParallelOptions = {}
) => pmap(array, mapFn, options).then((results) => results.flat(1))

export const pfilter = async <T = unknown>(
  array: T[],
  predicateFn: (item: T) => Promise<boolean>,
  options: ParallelOptions = {}
) => {
  const predicateValues = await pmap(array, predicateFn, options)
  const filteredValues = zip(array, predicateValues)
    .filter(([_, predicateValue]) => predicateValue)
    .map(([value]) => value)
  return filteredValues
}
