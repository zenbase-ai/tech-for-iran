"use server"

import { fetchMutation } from "convex/nextjs"
import { redirect } from "next/navigation"
import * as z from "zod"
import { api } from "@/convex/_generated/api"
import type { ActionToastState } from "@/hooks/use-action-state-toasts"
import { tokenAuth } from "@/lib/server/clerk"
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

  const { podId, error: createError } = await fetchMutation(api.pods.create, data, { token })
  if (createError) {
    return { error: createError }
  }

  const pod = await fetchMutation(api.pods.join, { inviteCode: data.inviteCode }, { token })
  if (!pod) {
    return { error: "There was an unexpected error joining the pod, please try joining manually." }
  }

  return redirect(`/pods/${podId}`)
}
