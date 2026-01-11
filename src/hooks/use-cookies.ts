import Cookies from "js-cookie"
import { useEffectEvent, useState } from "react"
import { COOKIE_EXPIRY_DAYS, type CookieName } from "@/lib/cookies"

export const getCookie = (name: CookieName) => Cookies.get(name)
export const clearCookie = (name: CookieName) => Cookies.remove(name, { path: "/" })
export const setCookie = <T extends string>(name: CookieName, value: T) =>
  Cookies.set(name, value, {
    expires: COOKIE_EXPIRY_DAYS,
    path: "/",
    sameSite: "lax",
  })

export default function useCookie<T extends string>(name: CookieName) {
  const [value, _setValue] = useState<T | undefined>(() => getCookie(name) as T | undefined)
  const setValue = useEffectEvent((value: T | undefined) => {
    if (value) {
      setCookie(name, value)
    } else {
      clearCookie(name)
    }
    _setValue(value)
  })

  return [value, setValue] as const
}
