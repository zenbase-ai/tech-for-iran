import { useTimeout } from "usehooks-ts"

export type TimeoutProps = {
  callback: () => void
  delay: number
}

export const Timeout: React.FC<React.PropsWithChildren<TimeoutProps>> = ({
  callback,
  delay,
  children,
}) => {
  useTimeout(callback, delay)

  return <>{children}</>
}
