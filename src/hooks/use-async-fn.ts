import { startTransition, useEffect, useEffectEvent, useState } from "react"
import { toast } from "sonner"
import { actionToast } from "@/lib/action-toast"
import { errorMessage } from "@/lib/utils"
import useMounted from "./use-mounted"

export type AsyncFn<TArgs extends unknown[], TReturn> = (...args: TArgs) => Promise<TReturn>

export type UseAsyncFn<TArgs extends unknown[], TReturn> = {
  execute: (...args: TArgs) => Promise<TReturn | undefined>
  data: TReturn | null
  pending: boolean
  complete: boolean | null
  error: Error | null
  reset: () => void
}

export default function useAsyncFn<TArgs extends unknown[], TReturn>(
  fn: AsyncFn<TArgs, TReturn>,
): UseAsyncFn<TArgs, TReturn> {
  const isMounted = useMounted()

  const [pending, setPending] = useState(false)
  const [data, setData] = useState<TReturn | null>(null)
  const [complete, setComplete] = useState<boolean | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const execute = useEffectEvent(async (...args: TArgs): Promise<TReturn | undefined> => {
    if (!isMounted) return undefined

    startTransition(() => {
      setComplete(null)
      setData(null)
      setError(null)
      setPending(true)
    })

    try {
      const result = await fn(...args)
      startTransition(() => {
        if (isMounted) {
          setComplete(true)
          setData(result)
          setError(null)
          setPending(false)
        }
      })
      return result
    } catch (error: unknown) {
      const errorObj = error instanceof Error ? error : new Error(String(error))
      if (isMounted) {
        startTransition(() => {
          setComplete(false)
          setData(null)
          setError(errorObj)
          setPending(false)
        })
      }
    }
  })

  const reset = useEffectEvent(() => {
    setComplete(null)
    setData(null)
    setError(null)
    setPending(false)
  })

  useEffect(() => {
    if (error) {
      toast.error(errorMessage(error))
    }
  }, [error])

  useEffect(() => {
    if (data) {
      actionToast(data)
    }
  }, [data])

  return { execute, pending, complete, error, data, reset }
}
