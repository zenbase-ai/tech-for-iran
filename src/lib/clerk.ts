"use server"

import { auth } from "@clerk/nextjs/server"

export const tokenAuth = async () => {
  const a = await auth()
  if (!a.userId) {
    throw new Error("Unauthenticated")
  }
  const token = await a.getToken({ template: "convex" })
  if (!token) {
    throw new Error("Unauthenticated")
  }
  return { ...a, token }
}
