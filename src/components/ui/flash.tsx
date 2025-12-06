"use client"

import { useSearchParams } from "next/navigation"
import { useEffect } from "react"
import { toast } from "sonner"

export const Flash: React.FC = () => {
  const params = useSearchParams()

  const error = params.get("error")
  const warn = params.get("warn")
  const info = params.get("info")
  const success = params.get("success")

  useEffect(() => {
    if (error) {
      toast.error(error)
    }
  }, [error])

  useEffect(() => {
    if (warn) {
      toast.warning(warn)
    }
  }, [warn])

  useEffect(() => {
    if (success) {
      toast.success(success)
    }
  }, [success])

  useEffect(() => {
    if (info) {
      toast.info(info)
    }
  }, [info])

  return null
}
