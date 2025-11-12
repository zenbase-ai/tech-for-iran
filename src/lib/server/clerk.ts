import { auth } from "@clerk/nextjs/server"

export class ClerkError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ClerkError"
  }
}

export const tokenAuth = async () => {
  const a = await auth()
  if (!a.isAuthenticated) {
    throw new ClerkError("AUTH")
  }
  const token = await a.getToken({ template: "convex" })
  if (!token) {
    throw new ClerkError("JWT")
  }
  return { ...a, token }
}
