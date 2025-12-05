import { useAuth } from "@clerk/nextjs"
import { usePaginatedQuery, useQuery } from "convex/react"
import type { FunctionReference } from "convex/server"
import { useEffectEvent, useState } from "react"

export type UseQueryArgs<T extends FunctionReference<"query">> = Parameters<typeof useQuery<T>>[1]
export type UseQueryReturn<T extends FunctionReference<"query">> = ReturnType<typeof useQuery<T>>

export function useAuthQuery<T extends FunctionReference<"query">>(
  query: T,
  args?: UseQueryArgs<T>
): UseQueryReturn<T> {
  const { isSignedIn } = useAuth()
  return useQuery(query, ...(isSignedIn ? [args] : ["skip"]))
}

type UsePaginatedQueryArgs<T extends FunctionReference<"query">> = Parameters<
  typeof usePaginatedQuery<T>
>[1]
type UsePaginatedQueryOptions<T extends FunctionReference<"query">> = Parameters<
  typeof usePaginatedQuery<T>
>[2]
type UsePaginatedQueryReturn<T extends FunctionReference<"query">> = ReturnType<
  typeof usePaginatedQuery<T>
>

export type UseAuthInfiniteQueryOptions<T extends FunctionReference<"query">> = Omit<
  UsePaginatedQueryOptions<T>,
  "initialNumItems"
> & { pageSize: number }
export type UseAuthInfiniteQueryReturn<T extends FunctionReference<"query">> =
  UsePaginatedQueryReturn<T>

export function useAuthInfiniteQuery<T extends FunctionReference<"query">>(
  query: T,
  args: UsePaginatedQueryArgs<T>,
  options: UseAuthInfiniteQueryOptions<T>
): UsePaginatedQueryReturn<T> {
  const { isSignedIn } = useAuth()
  return usePaginatedQuery(query, isSignedIn ? args : "skip", {
    ...options,
    initialNumItems: options.pageSize,
  })
}

export function paginatedState<T extends FunctionReference<"query">>(
  { status, isLoading, results }: UsePaginatedQueryReturn<T>,
  totalCount?: number
) {
  const canLoadMore =
    status === "CanLoadMore" && (totalCount === undefined || results.length < totalCount)

  return {
    canLoadMore,
    isLoading: isLoading && results.length === 0,
  }
}

export type UseAuthPaginatedQueryOptions<T extends FunctionReference<"query">> =
  UseAuthInfiniteQueryOptions<T> & {
    totalCount?: number
  }
export type UseAuthPaginatedQueryReturn<T extends FunctionReference<"query">> = ReturnType<
  typeof useAuthPaginatedQuery<T>
>

export function useAuthPaginatedQuery<T extends FunctionReference<"query">>(
  query: T,
  args: UsePaginatedQueryArgs<T>,
  options: UseAuthPaginatedQueryOptions<T>
) {
  const infiniteQuery = useAuthInfiniteQuery(query, args, options)
  const state = paginatedState(infiniteQuery, options.totalCount)

  const [page, setPage] = useState(0)

  const startIndex = page * options.pageSize
  const endIndex = startIndex + options.pageSize
  const results = infiniteQuery.results.slice(startIndex, endIndex)

  const hasMoreLoaded = endIndex < infiniteQuery.results.length

  const hasPrev = page > 0
  const hasNext = hasMoreLoaded || state.canLoadMore

  const goNext = useEffectEvent(() => {
    if (!hasNext) {
      return
    }
    if (!hasMoreLoaded && state.canLoadMore) {
      infiniteQuery.loadMore(options.pageSize)
    }
    setPage((p) => p + 1)
  })

  const goPrev = useEffectEvent(() => {
    if (!hasPrev) {
      return
    }
    setPage((p) => p - 1)
  })

  return {
    ...state,
    results,
    page,
    hasPrev,
    hasNext,
    goPrev,
    goNext,
  }
}
