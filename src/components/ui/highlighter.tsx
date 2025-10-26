"use client"

import { useInView } from "motion/react"
import { useEffect, useRef } from "react"
import { annotate } from "rough-notation"
import type { RoughAnnotation } from "rough-notation/lib/model"
import { cn } from "@/lib/utils"

type AnnotationAction =
  | "highlight"
  | "underline"
  | "box"
  | "circle"
  | "strike-through"
  | "crossed-off"
  | "bracket"

export type HighlighterProps = React.ComponentPropsWithoutRef<"span"> & {
  action?: AnnotationAction
  color?: string
  strokeWidth?: number
  animationDuration?: number
  delay?: number
  iterations?: number
  padding?: number
  multiline?: boolean
  isView?: boolean
}

export const Highlighter: React.FC<React.PropsWithChildren<HighlighterProps>> = ({
  children,
  action = "highlight",
  color = "oklch(0.70417 0.05779 200.327)",
  strokeWidth = 1.5,
  animationDuration = 600,
  delay = 0,
  iterations = 2,
  padding = 2,
  multiline = true,
  isView = false,
  className,
  ...props
}) => {
  const elementRef = useRef<HTMLSpanElement>(null)
  const annotationRef = useRef<RoughAnnotation | null>(null)

  const isInView = useInView(elementRef, {
    once: true,
    margin: "-10%",
  })

  // If isView is false, always show. If isView is true, wait for inView
  const shouldShow = !isView || isInView

  useEffect(() => {
    if (!shouldShow) return

    const element = elementRef.current
    if (!element) return

    const annotationConfig = {
      type: action,
      color,
      strokeWidth,
      animationDuration,
      iterations,
      padding,
      multiline,
    }

    const annotation = annotate(element, annotationConfig)
    annotationRef.current = annotation

    let hasShown = false
    let timeoutId: number | undefined

    const showAnnotation = () => {
      if (hasShown) return
      hasShown = true
      annotationRef.current?.show()
    }

    if (delay > 0) {
      timeoutId = window.setTimeout(showAnnotation, delay)
    } else {
      showAnnotation()
    }

    const resizeObserver = new ResizeObserver(() => {
      if (!hasShown) return
      annotation.hide()
      annotation.show()
    })

    resizeObserver.observe(element)
    resizeObserver.observe(document.body)

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId)
      if (element) {
        annotationRef.current?.remove()
        resizeObserver.disconnect()
      }
    }
  }, [
    shouldShow,
    action,
    color,
    strokeWidth,
    animationDuration,
    delay,
    iterations,
    padding,
    multiline,
  ])

  return (
    <span
      ref={elementRef}
      className={cn("relative inline-block bg-transparent", className)}
      {...props}
    >
      {children}
    </span>
  )
}
