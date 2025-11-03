"use server"

import { fetchMutation } from "convex/nextjs"
import { redirect } from "next/navigation"
import * as z from "zod"
import { api } from "@/convex/_generated/api"
import type { ActionToastState } from "@/hooks/use-action-state-toasts"
import { tokenAuth } from "@/lib/server/clerk"
import { errorMessage } from "@/lib/utils"
import { CreatePodSchema } from "./schema"

export type CreatePodState = ActionToastState

export const createPod = async (
  _prevState: CreatePodState,
  formData: FormData,
): Promise<CreatePodState> => {
  const payload = Object.fromEntries(formData)
  const { token } = await tokenAuth()

  const { data, success, error: parseError } = CreatePodSchema.safeParse(payload)
  if (!success) {
    return { error: z.prettifyError(parseError) }
  }

  try {
    const result = await fetchMutation(api.pods.create, data, { token })
    if ("error" in result) {
      return { error: result.error }
    }

    return redirect(`/pods/${result.pod._id}`)
  } catch (error: unknown) {
    return { error: errorMessage(error) }
  }
}
