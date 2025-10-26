import { isFunction } from "es-toolkit"
import { useMemo, useRef } from "react"

// biome-ignore lint/suspicious/noExplicitAny: silence!
type Noop = (this: any, ...args: any[]) => any

type PickFunction<T extends Noop> = (
  this: ThisParameterType<T>,
  ...args: Parameters<T>
) => ReturnType<T>

export const useFn = <T extends Noop>(fn: T) => {
  if (process.env.NODE_ENV === "development") {
    if (!isFunction(fn)) {
      throw new Error(`useFn expected parameter is a function, got ${typeof fn}`)
    }
  }

  const fnRef = useRef<T>(fn)

  // why not write `fnRef.current = fn`? https://github.com/alibaba/hooks/issues/728
  fnRef.current = useMemo<T>(() => fn, [fn])

  const memoizedFn = useRef<PickFunction<T>>(undefined)

  if (!memoizedFn.current) {
    memoizedFn.current = function (this, ...args) {
      return fnRef.current.apply(this, args) as ReturnType<T>
    }
  }

  return memoizedFn.current
}
