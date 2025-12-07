"use client"

import { useSearchParams } from "next/navigation"
import { useEffect } from "react"
import { toast } from "sonner"

export const FlashToasts: React.FC = () => {
  const params = useSearchParams()

  const error = params.get("error")
  useEffect(() => {
    if (error) {
      toast.error(error)
    }
  }, [error])

  const warn = params.get("warn")
  useEffect(() => {
    if (warn) {
      toast.warning(warn)
    }
  }, [warn])

  const info = params.get("info")
  useEffect(() => {
    if (info) {
      toast.info(info)
    }
  }, [info])

  const success = params.get("success")
  useEffect(() => {
    if (success) {
      toast.success(success)
    }
  }, [success])

  return null
}
