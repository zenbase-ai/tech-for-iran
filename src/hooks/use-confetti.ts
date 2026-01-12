import confetti, { type Options as ConfettiOptions } from "canvas-confetti"
import { useEffectEvent, useRef } from "react"

export type UseConfettiOptions = {
  options?: ConfettiOptions
}

export default function useConfetti<T extends HTMLElement>({ options }: UseConfettiOptions = {}) {
  const ref = useRef<T>(null)

  const trigger = useEffectEvent(() => {
    const rect = ref.current?.getBoundingClientRect()
    const x = (rect?.left ?? 0) + (rect?.width ?? 0) / 2 || window.innerWidth / 2
    const y = (rect?.top ?? 0) + (rect?.height ?? 0) / 2 || window.innerHeight / 2

    confetti({
      ...options,
      origin: {
        x: x / window.innerWidth,
        y: y / window.innerHeight,
      },
    })
  })

  return { ref, trigger }
}
