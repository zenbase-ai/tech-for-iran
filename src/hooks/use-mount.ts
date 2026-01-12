import { useEffect, useRef } from "react"
import useMounted from "./use-mounted"

export default function useMount(fn: () => void) {
  const isMounted = useMounted()
  const fnRef = useRef(fn)

  useEffect(() => {
    if (isMounted) {
      fnRef.current()
    }
  }, [isMounted])
}
