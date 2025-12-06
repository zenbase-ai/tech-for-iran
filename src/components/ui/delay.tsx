import { useBoolean, useTimeout } from "usehooks-ts"
import useMounted from "@/hooks/use-mounted"

export type DelayProps = React.PropsWithChildren<{
  className?: string
  timeout: number
}>

export const Delay: React.FC<DelayProps> = ({ timeout, children }) => {
  const { value, setTrue } = useBoolean()
  const isMounted = useMounted()
  useTimeout(setTrue, isMounted ? timeout : null)
  return value ? children : null
}
