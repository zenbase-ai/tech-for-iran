import Cookies from "js-cookie"
import type { Id } from "@/convex/_generated/dataModel"

export const ANON_ID_COOKIE = "anon_id"
export const X_USERNAME_COOKIE = "x_username"
export const REFERRAL_COOKIE = "referred_by"

export const COOKIE_EXPIRY_DAYS = 365

export const getAnonId = () => Cookies.get(ANON_ID_COOKIE)
export const getXUsername = () => Cookies.get(X_USERNAME_COOKIE)
export const getReferredBy = () => Cookies.get(REFERRAL_COOKIE) as Id<"signatures"> | undefined

export const setXUsername = (username: string) =>
  Cookies.set(X_USERNAME_COOKIE, username.toLowerCase(), {
    expires: COOKIE_EXPIRY_DAYS,
    path: "/",
    sameSite: "lax",
  })

export const clearReferredBy = () => Cookies.remove(REFERRAL_COOKIE, { path: "/" })
