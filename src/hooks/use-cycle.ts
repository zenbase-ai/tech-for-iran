import { useCallback, useState } from "react"

export type CycleReturn<T> = [current: T, cycle: () => void]

export const useCycle = <T>(values: readonly T[]): CycleReturn<T> => {
  if (values.length === 0) {
    throw new Error("useCycle requires at least one value")
  }

  const [index, setIndex] = useState(0)
  const cycle = useCallback(() => {
    setIndex((index) => (index + 1) % values.length)
  }, [values.length])

  return [values[index], cycle]
}
