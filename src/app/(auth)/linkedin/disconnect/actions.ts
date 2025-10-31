"use server"

import { fetchMutation } from "convex/nextjs"
import { api } from "@/convex/_generated/api"
import { unipile } from "@/convex/helpers/unipile"
import { errorMessage } from "@/lib/utils"
import { DisconnectAccountSchema } from "./schema"

export type DisconnectAccountState = {
  message?: string
  error?: string
}

export const disconnectAccount = async (
  _prevState: DisconnectAccountState,
  formData: FormData,
): Promise<DisconnectAccountState> => {
  const { data, success } = DisconnectAccountSchema.safeParse(Object.fromEntries(formData))
  if (!success) {
    return { error: "Something went terribly wrong, try reloading the page." }
  }

  try {
    await Promise.all([
      fetchMutation(api.linkedin.unlinkAccount),
      unipile<void>("DELETE", `/api/v1/accounts/${data.unipileId}`),
    ])
    return { message: "Your LinkedIn account has been disconnected." }
  } catch (error: unknown) {
    return { error: errorMessage(error) }
  }
}
