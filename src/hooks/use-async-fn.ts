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
  const [pending, setPending] = useState(false)
  const [data, setData] = useState<TReturn | null>(null)
  const [complete, setComplete] = useState<boolean | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const isMounted = useMounted()

  const execute = useEffectEvent(async (...args: TArgs): Promise<TReturn | undefined> => {
    if (!isMounted) return undefined

    startTransition(() => {
      setPending(true)
      setError(null)
      setComplete(null)
    })

    try {
      const result = await fn(...args)
      startTransition(() => {
        if (isMounted) {
          setData(result)
          setComplete(true)
          setPending(false)
        }
      })
      return result
    } catch (error: unknown) {
      const errorObj = error instanceof Error ? error : new Error(String(error))
      if (isMounted) {
        startTransition(() => {
          setError(errorObj)
          setComplete(false)
          setPending(false)
        })
      }
    }
  })

  const reset = useEffectEvent(() => {
    setPending(false)
    setError(null)
    setComplete(null)
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

  return { execute, pending, complete: complete, error, data, reset }
}
