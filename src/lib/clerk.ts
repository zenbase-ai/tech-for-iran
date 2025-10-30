import { auth } from "@clerk/nextjs/server"

class UnauthenticatedError extends Error {
  constructor() {
    super("Unauthenticated")
    this.name = "UnauthenticatedError"
  }
}

export const tokenAuth = async () => {
  const a = await auth()
  if (!a.isAuthenticated) {
    throw new UnauthenticatedError()
  }
  const token = await a.getToken({ template: "convex" })
  if (!token) {
    throw new UnauthenticatedError()
  }
  return { ...a, token }
}
