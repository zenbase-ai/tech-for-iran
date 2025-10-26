import { useEffect } from "react"

export const useEscapeKey = (
  handler: (event: KeyboardEvent) => void,
  target?: React.RefObject<HTMLElement>,
) => {
  useEffect(() => {
    const listener = (event: Event) => {
      if (event instanceof KeyboardEvent && event.key === "Escape") {
        handler(event)
      }
    }

    const element = target?.current || window
    element.addEventListener("keydown", listener)

    return () => element.removeEventListener("keydown", listener)
  }, [handler, target])
}
