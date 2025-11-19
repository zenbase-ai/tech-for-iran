"use client"

import { useSearchParams } from "next/navigation"
import { useEffect } from "react"
import { type ToasterProps, toast } from "sonner"
import { Toaster } from "@/components/ui/sonner"

export type FlashProps = ToasterProps

export const Flash: React.FC<FlashProps> = (props) => {
  const params = useSearchParams()

  const error = params.get("error")
  useEffect(() => {
    if (error) {
      toast.error(error)
    }
  }, [error])

  const success = params.get("success")
  useEffect(() => {
    if (success) {
      toast.success(success)
    }
  }, [success])

  const info = params.get("info")
  useEffect(() => {
    if (info) {
      toast.info(info)
    }
  }, [info])

  return <Toaster {...props} />
}
