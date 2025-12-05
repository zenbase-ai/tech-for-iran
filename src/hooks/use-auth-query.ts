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

export type UsePaginatedQueryArgs<T extends FunctionReference<"query">> = Parameters<
  typeof usePaginatedQuery<T>
>[1]
export type UsePaginatedQueryOptions<T extends FunctionReference<"query">> = Parameters<
  typeof usePaginatedQuery<T>
>[2]
export type UsePaginatedQueryReturn<T extends FunctionReference<"query">> = ReturnType<
  typeof usePaginatedQuery<T>
>

export function useAuthInfiniteQuery<T extends FunctionReference<"query">>(
  query: T,
  args: UsePaginatedQueryArgs<T>,
  options: UsePaginatedQueryOptions<T>
): UsePaginatedQueryReturn<T> {
  const { isSignedIn } = useAuth()
  return usePaginatedQuery(query, isSignedIn ? args : "skip", options)
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

export function useAuthPaginatedQuery<T extends FunctionReference<"query">>(
  query: T,
  args: UsePaginatedQueryArgs<T>,
  options: UsePaginatedQueryOptions<T> & {
    totalCount?: number
  }
) {
  const { initialNumItems: pageSize } = options

  const infiniteQuery = useAuthInfiniteQuery(query, args, options)
  const state = paginatedState(infiniteQuery, options.totalCount)

  const [page, setPage] = useState(0)

  const startIndex = page * pageSize
  const endIndex = startIndex + pageSize
  const results = infiniteQuery.results.slice(startIndex, endIndex)

  const hasMoreLoaded = endIndex < infiniteQuery.results.length

  const hasPrev = page > 0
  const hasNext = hasMoreLoaded || state.canLoadMore

  const goNext = useEffectEvent(() => {
    if (!hasNext) {
      return
    }
    if (!hasMoreLoaded && state.canLoadMore) {
      infiniteQuery.loadMore(pageSize)
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
