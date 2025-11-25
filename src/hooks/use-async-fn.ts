import { startTransition, useEffect, useEffectEvent, useState } from "react"
import { toast } from "sonner"
import useMounted from "@/hooks/use-mounted"
import { errorMessage, toError } from "@/lib/utils"

export type AsyncFn<TArgs extends unknown[], TData extends Record<string, unknown>> = (
  ...args: TArgs
) => Promise<TData>

export type UseAsyncFnOptions<TData extends Record<string, unknown>> = {
  onStart?: () => void
  onSuccess?: (data: TData) => void
  onError?: (error: Error) => void
}

export type UseAsyncFn<TArgs extends unknown[], TData extends Record<string, unknown>> = {
  execute: (...args: TArgs) => Promise<TData>
  data: TData | null
  error: Error | null
  pending: boolean
}

export default function useAsyncFn<TArgs extends unknown[], TData extends Record<string, unknown>>(
  fn: AsyncFn<TArgs, TData>,
  options: UseAsyncFnOptions<TData> = {}
): UseAsyncFn<TArgs, TData> {
  const isMounted = useMounted()

  const [data, setData] = useState<TData | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [pending, setPending] = useState(false)

  const execute = useEffectEvent(async (...args: TArgs): Promise<TData> => {
    if (!isMounted) {
      throw new Error("AsyncFn called from a component that is not mounted")
    }

    startTransition(() => {
      setData(null)
      setError(null)
      setPending(true)
    })

    try {
      options.onStart?.()
      const result = await fn(...args)
      startTransition(() => {
        if (isMounted) {
          setData(result)
          setError(null)
          setPending(false)
        }
      })
      options.onSuccess?.(result)
      return result
    } catch (e: unknown) {
      startTransition(() => {
        if (isMounted) {
          setData(null)
          setError(toError(e))
          setPending(false)
        }
      })
      options.onError?.(toError(e))
      throw e
    }
  })

  useEffect(() => {
    if (error) {
      toast.error(errorMessage(error))
    }
  }, [error])

  useEffect(() => {
    if (data != null) {
      for (const key of ["success", "error", "info"] as const) {
        if (key in data && typeof data[key] === "string") {
          toast[key](data[key])
        }
      }
    }
  }, [data])

  return { execute, pending, error, data }
}
