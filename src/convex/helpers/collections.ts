import { zip } from "es-toolkit"
import pMap from "p-map"

export type ParallelOptions = Parameters<typeof pMap>[2]

export const defaultOptions: ParallelOptions = {
  concurrency: 50,
  stopOnError: true,
}

export const pmap = <T = unknown, R = unknown>(
  array: T[],
  mapFn: (item: T) => Promise<R>,
  options: ParallelOptions = {},
) => pMap(array, mapFn, { ...defaultOptions, ...options })

export const pfilter = async <T = unknown>(
  array: T[],
  predicateFn: (item: T) => Promise<boolean>,
  options: ParallelOptions = {},
) => {
  const predicateValues = await pmap(array, predicateFn, options)
  const filteredValues = zip(array, predicateValues)
    .filter(([_, predicateValue]) => predicateValue)
    .map(([value]) => value)
  return filteredValues
}
