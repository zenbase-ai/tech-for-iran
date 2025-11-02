"use client"

import { useEffect } from "react"
import { toast } from "sonner"

export type ActionToastState = {
  success?: string
  error?: string
}

export const useActionToastState = (state: ActionToastState, loading: boolean) => {
  useEffect(() => {
    if (!loading && state.success) {
      toast.success(state.success)
    }
  }, [state.success, loading])

  useEffect(() => {
    if (!loading && state.error) {
      toast.error(state.error)
    }
  }, [state.error, loading])
}
