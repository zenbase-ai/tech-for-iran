"use server"

import { fetchAction } from "convex/nextjs"
import { api } from "@/convex/_generated/api"
import { tokenAuth } from "@/lib/clerk"
import { errorMessage } from "@/lib/utils"

export type DisconnectAccountState = {
  message?: string
  error?: string
}

export const disconnectAccount = async (
  _prevState: DisconnectAccountState,
  _formData: FormData,
): Promise<DisconnectAccountState> => {
  try {
    const { token } = await tokenAuth()
    await fetchAction(api.linkedin.disconnectAccount, {}, { token })
    return { message: "Your LinkedIn account has been disconnected." }
  } catch (error: unknown) {
    return { error: errorMessage(error) }
  }
}
