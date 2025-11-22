import { auth } from "@clerk/nextjs/server"

export class ClerkError extends Error {
  constructor(message: string, { cause }: { cause?: unknown } = {}) {
    super(message, { cause })
    this.name = "ClerkError"
  }
}

export const clerkAuth = async () => {
  const a = await auth()
  if (!a.isAuthenticated) {
    throw new ClerkError("!isAuthenticated", { cause: a })
  }
  const token = await a.getToken({ template: "convex" })
  if (!token) {
    throw new ClerkError("!authToken", { cause: a })
  }
  return { ...a, token }
}
