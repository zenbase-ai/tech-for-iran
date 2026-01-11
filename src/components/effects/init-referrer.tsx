"use client"

import Cookies from "js-cookie"
import { parseAsString, useQueryState } from "nuqs"
import { useEffect } from "react"

const REFERRAL_COOKIE_NAME = "referred_by"
const REFERRAL_EXPIRY_DAYS = 7

export const InitReferrer: React.FC = () => {
  const [referredBy, setReferredBy] = useQueryState(
    "referredBy",
    parseAsString.withOptions({ history: "replace" })
  )

  useEffect(() => {
    if (referredBy) {
      Cookies.set(REFERRAL_COOKIE_NAME, referredBy, {
        expires: REFERRAL_EXPIRY_DAYS,
        path: "/",
        sameSite: "lax",
      })
      setReferredBy(null)
    }
  }, [referredBy, setReferredBy])

  return null
}
