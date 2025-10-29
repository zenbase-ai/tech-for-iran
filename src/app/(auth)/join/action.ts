"use server"

import { fetchQuery } from "convex/nextjs"
import { redirect } from "next/navigation"
import { api } from "@/convex/_generated/api"

export const joinPodAction = async (_prevState: { error: string } | null, formData: FormData) => {
  const inviteCode = formData.get("inviteCode")?.toString()?.trim()

  if (!inviteCode) {
    return { error: "Please enter an invite code" }
  }

  // Validate pod exists
  const pod = await fetchQuery(api.pods.lookup, { inviteCode })

  if (!pod) {
    return { error: "Invalid invite code" }
  }

  redirect(`/join/${inviteCode}`)
}
