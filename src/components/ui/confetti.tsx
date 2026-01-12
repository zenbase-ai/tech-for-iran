"use client"

import type {
  GlobalOptions as ConfettiGlobalOptions,
  CreateTypes as ConfettiInstance,
  Options as ConfettiOptions,
} from "canvas-confetti"
import confetti from "canvas-confetti"
import { createContext, forwardRef, useEffectEvent, useImperativeHandle, useRef } from "react"

import { Button } from "@/components/ui/button"
import useAsyncEffect from "@/hooks/use-async-effect"

type API = {
  fire: (options?: ConfettiOptions) => void
}

export type ConfettiProps = React.PropsWithChildren<
  React.ComponentPropsWithRef<"canvas"> & {
    options?: ConfettiOptions
    globalOptions?: ConfettiGlobalOptions
    manualstart?: boolean
  }
>

export type ConfettiRef = API | null

export const ConfettiContext = createContext<API>({} as API)

export const Confetti = forwardRef<ConfettiRef, ConfettiProps>(
  (
    {
      options,
      globalOptions = { resize: true, useWorker: true },
      manualstart = false,
      children,
      ...props
    },
    ref
  ) => {
    const instanceRef = useRef<ConfettiInstance | null>(null)

    const canvasRef = useEffectEvent((node: HTMLCanvasElement) => {
      if (node !== null) {
        if (instanceRef.current) {
          return
        }
        instanceRef.current = confetti.create(node, {
          ...globalOptions,
          resize: true,
        })
      } else if (instanceRef.current) {
        instanceRef.current.reset()
        instanceRef.current = null
      }
    })

    const fire = useEffectEvent(async (opts = {}) => {
      try {
        await instanceRef.current?.({ ...options, ...opts })
      } catch (error) {
        console.error("Confetti error:", error)
      }
    })

    const api = { fire }

    useImperativeHandle(ref, () => api)

    useAsyncEffect(async () => {
      if (!manualstart) {
        try {
          await fire()
        } catch (error) {
          console.error("Confetti effect error:", error)
        }
      }
    }, [manualstart])

    return (
      <ConfettiContext.Provider value={api}>
        <canvas ref={canvasRef} {...props} />
        {children}
      </ConfettiContext.Provider>
    )
  }
)

Confetti.displayName = "Confetti"

export type ConfettiButtonProps = React.ComponentProps<"button"> & {
  options?: ConfettiOptions & ConfettiGlobalOptions & { canvas?: HTMLCanvasElement }
}

export const ConfettiButton: React.FC<ConfettiButtonProps> = ({ options, children, ...props }) => {
  const handleClick = useEffectEvent(async (event: React.MouseEvent<HTMLButtonElement>) => {
    try {
      const rect = event.currentTarget.getBoundingClientRect()
      const x = rect.left + rect.width / 2
      const y = rect.top + rect.height / 2
      await confetti({
        ...options,
        origin: {
          x: x / window.innerWidth,
          y: y / window.innerHeight,
        },
      })
    } catch (error) {
      console.error("Confetti button error:", error)
    }
  })

  return (
    <Button onClick={handleClick} {...props}>
      {children}
    </Button>
  )
}

ConfettiButton.displayName = "ConfettiButton"
