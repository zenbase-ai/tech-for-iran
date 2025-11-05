import { ConvexError } from "convex/values"
import { env } from "@/lib/env.mjs"

export type UnipileAPIErrorData = {
  method: string
  path: string
  status: number
  body: string
}

export class UnipileAPIError extends ConvexError<UnipileAPIErrorData> {}

export const unipile = async <T = any>(
  method: "POST" | "GET" | "DELETE",
  path: string,
  body?: Record<string, unknown>,
) => {
  const response = await fetch(`${env.UNIPILE_API_URL}${path}`, {
    method,
    headers: { "X-API-KEY": env.UNIPILE_API_KEY, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    throw new UnipileAPIError({
      method,
      path,
      status: response.status,
      body: (await response.text()) || "Unknown error",
    })
  }

  return (await response.json()) as T
}

export type AccountStatusPayload = {
  AccountStatus: {
    account_id: string
    account_type: "LINKEDIN"
    message: string
  }
}

export const isAccountStatusPayload = (payload: any): payload is AccountStatusPayload => {
  return (
    payload !== null &&
    typeof payload === "object" &&
    "AccountStatus" in payload &&
    "account_type" in payload.AccountStatus &&
    payload.AccountStatus.account_type === "LINKEDIN" &&
    "account_id" in payload.AccountStatus &&
    typeof payload.AccountStatus.account_id === "string"
  )
}

export const getAccountStatus = ({
  AccountStatus: { account_id, message },
}: AccountStatusPayload) => ({
  unipileId: account_id,
  status: message,
})
