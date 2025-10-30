"use server"

import { fetchMutation } from "convex/nextjs"
import * as z from "zod"
import { api } from "@/convex/_generated/api"
import { tokenAuth } from "@/lib/clerk"
import { errorMessage } from "@/lib/utils"
import { ProfileSchema } from "./schema"

export type ProfileFormState = {
  message?: string
  error?: string
}

export const profileFormAction = async (
  _prevState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> => {
  const { data, success, error } = ProfileSchema.safeParse(Object.fromEntries(formData))
  if (!success) {
    return { error: z.prettifyError(error) }
  }

  try {
    const { token } = await tokenAuth()
    await fetchMutation(api.linkedin.updateProfile, data, { token })
    return { message: "Your LinkedIn settings has been updated." }
  } catch (error: unknown) {
    return { error: errorMessage(error) }
  }
}
