"use client"

import { toast } from "sonner"

export type ActionToast = {
  success?: string
  error?: string
}

export const actionToast = (result: ActionToast) => {
  if (result.error) {
    toast.error(result.error)
    return false
  } else {
    toast.success(result.success)
    return true
  }
}
