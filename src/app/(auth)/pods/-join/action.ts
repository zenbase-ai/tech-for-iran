"use server"

import { fetchMutation } from "convex/nextjs"
import { redirect } from "next/navigation"
import { api } from "@/convex/_generated/api"
import { tokenAuth } from "@/lib/server/clerk"
import { JoinPodSchema } from "./schema"

export type JoinPodState = {
  error?: string
  message?: string
}

export const joinPod = async (
  _prevState: JoinPodState,
  formData: FormData,
): Promise<JoinPodState> => {
  const { data, success } = JoinPodSchema.safeParse(Object.fromEntries(formData))
  if (!success) {
    return { error: "Please enter an invite code" }
  }

  const { token } = await tokenAuth().catch(() => {
    redirect(`/sign-in?inviteCode=${encodeURIComponent(data.inviteCode)}` as any)
  })

  const pod = await fetchMutation(api.pods.join, data, { token })
  if (!pod) {
    return { error: "Invalid invite code." }
  }

  const flash = `Joined ${pod.name}!`
  return redirect(`/pods?success=${encodeURIComponent(flash)}`)
}
