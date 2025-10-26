import { useBoolean, useTimeout } from "usehooks-ts"

export type UseMountedProps = {
  delay?: number
}

export const useMounted = ({ delay = 0 }: UseMountedProps = {}) => {
  const { value, setTrue } = useBoolean(false)

  useTimeout(setTrue, delay)

  return value
}
