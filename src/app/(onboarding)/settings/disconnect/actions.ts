"use server"

import { fetchAction } from "convex/nextjs"
import { api } from "@/convex/_generated/api"
import type { ActionToastState } from "@/hooks/use-action-state-toasts"
import { tokenAuth } from "@/lib/server/clerk"
import { errorMessage } from "@/lib/utils"

export type DisconnectAccountState = ActionToastState

export const disconnectAccount = async (
  _prevState: DisconnectAccountState,
  _formData: FormData,
): Promise<DisconnectAccountState> => {
  try {
    const { token } = await tokenAuth()
    await fetchAction(api.linkedin.disconnectAccount, {}, { token })
    return { success: "Your LinkedIn account has been disconnected." }
  } catch (error: unknown) {
    return { error: errorMessage(error) }
  }
}
