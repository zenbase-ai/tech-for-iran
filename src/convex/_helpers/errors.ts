import { ConvexError, type Value } from "convex/values"
import * as z from "zod"

type ErrorData = {
  message: string
  cause?: Value
}

export class NotFoundError extends ConvexError<ErrorData> {
  constructor(message = "Not found", { cause = null }: { cause?: Value } = {}) {
    super({ message, cause })
  }
}

export class UnauthorizedError extends ConvexError<ErrorData> {
  constructor(message = "Unauthorized", { cause = null }: { cause?: Value } = {}) {
    super({ message, cause })
  }
}

export class ConflictError extends ConvexError<ErrorData> {
  constructor(message = "Conflict", { cause = null }: { cause?: Value } = {}) {
    super({ message, cause })
  }
}

export class BadRequestError extends ConvexError<ErrorData> {
  constructor(message = "Bad request", { cause = null }: { cause?: Value } = {}) {
    super({ message, cause })
  }
}

export const errorMessage = (error: unknown): string => {
  if (error instanceof z.ZodError) {
    return z.prettifyError(error)
  }
  if (error instanceof ConvexError) {
    return error.data ?? errorMessage(error)
  }
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`
  }
  return String(error)
}
