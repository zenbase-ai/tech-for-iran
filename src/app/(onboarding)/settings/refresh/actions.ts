"use server"

import { fetchAction } from "convex/nextjs"
import { api } from "@/convex/_generated/api"
import { tokenAuth } from "@/lib/server/clerk"
import { errorMessage } from "@/lib/utils"

export type RefreshAccountState = {
  message?: string
  error?: string
}

export const refreshAccount = async (
  _prevState: RefreshAccountState,
  _formData: FormData,
): Promise<RefreshAccountState> => {
  try {
    const { token } = await tokenAuth()
    await fetchAction(api.linkedin.refreshState, {}, { token })
    return { message: "Your profile has been refreshed." }
  } catch (error: unknown) {
    return { error: errorMessage(error) }
  }
}
