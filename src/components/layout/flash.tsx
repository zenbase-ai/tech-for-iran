"use client"

import { useSearchParams } from "next/navigation"
import { useEffect } from "react"
import { toast } from "sonner"

export const Flash: React.FC = () => {
  const params = useSearchParams()

  const error = params.get("error")
  useEffect(() => {
    if (error) toast.error(error)
  }, [error])

  const success = params.get("success")
  useEffect(() => {
    if (success) toast.success(success)
  }, [success])

  const info = params.get("info")
  useEffect(() => {
    if (info) toast.info(info)
  }, [info])

  return null
}
