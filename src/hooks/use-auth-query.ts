import { useAuth } from "@clerk/nextjs"
import { useQuery } from "convex/react"
import type { FunctionReference } from "convex/server"

export type UseQueryArgs<T extends FunctionReference<"query">> = Parameters<typeof useQuery<T>>[1]
export type UseQueryReturn<T extends FunctionReference<"query">> = ReturnType<typeof useQuery<T>>

export default function useAuthQuery<T extends FunctionReference<"query">>(
  query: T,
  args?: UseQueryArgs<T>,
): UseQueryReturn<T> {
  const { isSignedIn } = useAuth()
  return useQuery(query, ...(isSignedIn ? [args] : ["skip"]))
}
