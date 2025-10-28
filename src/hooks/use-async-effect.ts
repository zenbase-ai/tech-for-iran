import { isFunction } from "es-toolkit"
import type { DependencyList } from "react"
import { useEffect } from "react"

const isAsyncGenerator = (
  val: AsyncGenerator<void, void, void> | Promise<void>,
): val is AsyncGenerator<void, void, void> => {
  return isFunction((val as any)[Symbol.asyncIterator])
}

export const useAsyncEffect = (
  effect: () => AsyncGenerator<void, void, void> | Promise<void>,
  deps?: DependencyList,
) => {
  useEffect(() => {
    let cancelled = false

    ;(async () => {
      const e = effect()

      if (!isAsyncGenerator(e)) {
        return await e
      }

      while (true) {
        const result = await e.next()
        if (result.done || cancelled) {
          break
        }
      }
    })()

    return () => {
      cancelled = true
    }
    // biome-ignore lint/correctness/useExhaustiveDependencies: silence!
  }, deps)
}
