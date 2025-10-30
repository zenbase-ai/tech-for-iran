"use server"

import { fetchMutation } from "convex/nextjs"
import { api } from "@/convex/_generated/api"
import { unipile } from "@/convex/helpers/unipile"
import { errorMessage } from "@/lib/utils"

export type DisconnectFormState = {
  message?: string
  error?: string
}

export const disconnectFormAction = async (
  _prevState: DisconnectFormState,
  formData: FormData,
): Promise<DisconnectFormState> => {
  const unipileId = formData.get("unipileId")?.toString()?.trim()
  if (!unipileId) {
    return { error: "Something went terribly wrong, try reloading the page." }
  }

  try {
    await Promise.all([
      fetchMutation(api.linkedin.unlinkAccount),
      unipile<void>("DELETE", `/api/v1/accounts/${unipileId}`),
    ])
    return { message: "Your LinkedIn account has been disconnected." }
  } catch (error: unknown) {
    return { error: errorMessage(error) }
  }
}
