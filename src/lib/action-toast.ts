"use client"

import { toast } from "sonner"

export type ActionToast = {
  success?: string
  error?: string
  info?: string
}

export const actionToast = (result: ActionToast): void => {
  for (const type of ["success", "error", "info"] as const) {
    if (result[type]) {
      toast[type](result[type])
    }
  }
}
