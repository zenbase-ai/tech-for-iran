"use server"

import { fetchMutation } from "convex/nextjs"
import * as z from "zod"
import { api } from "@/convex/_generated/api"
import type { ActionToastState } from "@/hooks/use-action-state-toasts"
import { tokenAuth } from "@/lib/server/clerk"
import { errorMessage } from "@/lib/utils"
import { ConfigSchema } from "./schema"

export type UpdateConfigState = ActionToastState

export const updateConfig = async (
  _prevState: UpdateConfigState,
  formData: FormData,
): Promise<UpdateConfigState> => {
  const { data, success, error } = ConfigSchema.safeParse(Object.fromEntries(formData))
  if (!success) {
    return { error: z.prettifyError(error) }
  }

  try {
    const { token } = await tokenAuth()
    await fetchMutation(api.linkedin.updateAccount, data, { token })
    return { success: "Your LinkedIn settings has been updated." }
  } catch (error: unknown) {
    return { error: errorMessage(error) }
  }
}
