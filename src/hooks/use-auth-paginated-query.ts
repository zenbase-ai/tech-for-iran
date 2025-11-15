import { useAuth } from "@clerk/nextjs"
import { usePaginatedQuery } from "convex/react"
import type { FunctionReference } from "convex/server"

export type UsePaginatedQueryArgs<T extends FunctionReference<"query">> = Parameters<
  typeof usePaginatedQuery<T>
>[1]
export type UsePaginatedQueryOptions<T extends FunctionReference<"query">> = Parameters<
  typeof usePaginatedQuery<T>
>[2]
export type UsePaginatedQueryReturn<T extends FunctionReference<"query">> = ReturnType<
  typeof usePaginatedQuery<T>
>

export default function useAuthPaginatedQuery<T extends FunctionReference<"query">>(
  query: T,
  args: UsePaginatedQueryArgs<T>,
  options: UsePaginatedQueryOptions<T>,
): UsePaginatedQueryReturn<T> {
  const { isSignedIn } = useAuth()
  return usePaginatedQuery(query, isSignedIn ? args : "skip", options)
}

export const paginatedState = <T extends FunctionReference<"query">>(
  queryReturn: UsePaginatedQueryReturn<T>,
) => ({
  canLoadMore: queryReturn.status === "CanLoadMore",
  isLoading: queryReturn.isLoading && queryReturn.results.length === 0,
  noResults: queryReturn.results.length === 0,
})
