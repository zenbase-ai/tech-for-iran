"use server"

import { fetchMutation } from "convex/nextjs"
import * as z from "zod"
import { api } from "@/convex/_generated/api"
import { tokenAuth } from "@/lib/clerk"
import { errorMessage } from "@/lib/utils"
import { AccountUpdateSchema } from "./schema"

export type UpdateAccountState = {
  message?: string
  error?: string
}

export const updateAccount = async (
  _prevState: UpdateAccountState,
  formData: FormData,
): Promise<UpdateAccountState> => {
  const { data, success, error } = AccountUpdateSchema.safeParse(Object.fromEntries(formData))
  if (!success) {
    return { error: z.prettifyError(error) }
  }

  try {
    const { token } = await tokenAuth()
    await fetchMutation(api.linkedin.updateAccount, data, { token })
    return { message: "Your LinkedIn settings has been updated." }
  } catch (error: unknown) {
    return { error: errorMessage(error) }
  }
}
