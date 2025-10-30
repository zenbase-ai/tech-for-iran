"use server"

import { fetchMutation } from "convex/nextjs"
import { api } from "@/convex/_generated/api"
import { unipile } from "@/convex/helpers/unipile"
import { env } from "@/lib/env.mjs"
import { errorMessage } from "@/lib/utils"

const { APP_URL, UNIPILE_API_URL } = env

export const generateHostedAuthLink = async (userId: string) => {
  const expiresOn = new Date()
  expiresOn.setHours(expiresOn.getHours() + 1) // Link expires in 1 hour

  const { url } = await unipile<{ url: string }>("POST", "/api/v1/hosted/accounts/link", {
    api_url: UNIPILE_API_URL,
    type: "create",
    name: userId,
    providers: ["LINKEDIN"],
    expiresOn: expiresOn.toISOString(),
    success_redirect_url: `${APP_URL}/linkedin`,
    failure_redirect_url: `${APP_URL}/linkedin`,
    notify_url: `${APP_URL}/webhooks/unipile`,
  })

  return url
}

export type ProfileFormState = {
  error?: string
}

export const profileFormAction = async (
  _prevState: ProfileFormState | null,
  formData: FormData,
): Promise<ProfileFormState> => {
  const maxActions = formData.get("maxActions")?.toString()?.trim()
  if (!maxActions) {
    return { error: "Please enter a maximum number of actions." }
  }
  try {
    await fetchMutation(api.linkedin.updateProfile, { maxActions: Number(maxActions) })
    return {}
  } catch (error: unknown) {
    return { error: errorMessage(error) }
  }
}

export type DisconnectFormState = {
  error?: string
}

export const disconnectFormAction = async (
  _prevState: DisconnectFormState | null,
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
    return {}
  } catch (error: unknown) {
    return { error: errorMessage(error) }
  }
}
