"use server"

import { env } from "@/lib/env.mjs"

const { APP_URL, UNIPILE_API_URL, UNIPILE_API_KEY } = env

export const generateHostedAuthLink = async (userId: string) => {
  const expiresOn = new Date()
  expiresOn.setHours(expiresOn.getHours() + 24) // Link expires in 24 hours

  // Build success redirect URL - include invite code if present, redirect directly to main
  const response = await fetch(`${UNIPILE_API_URL}/api/v1/hosted/accounts/link`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": UNIPILE_API_KEY,
    },
    body: JSON.stringify({
      api_url: UNIPILE_API_URL,
      type: "create",
      name: userId,
      providers: ["LINKEDIN"],
      expiresOn: expiresOn.toISOString(),
      success_redirect_url: `${APP_URL}/linkedin`,
      failure_redirect_url: `${APP_URL}/linkedin`,
      notify_url: `${APP_URL}/webhooks/unipile`,
    }),
  })

  if (!response.ok) {
    throw new Error(
      `Failed to generate hosted auth link: ${response.status} ${response.statusText}`,
      { cause: await response.text() },
    )
  }

  const data = await response.json()
  return data.url as string
}
