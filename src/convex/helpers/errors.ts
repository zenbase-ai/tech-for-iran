import { ConvexError, type Value } from "convex/values"

type ErrorData = {
  message: string
  cause?: Value
}

export class NotFoundError extends ConvexError<ErrorData> {
  constructor(message: string = "Not found", { cause = null }: { cause?: Value } = {}) {
    super({ message, cause })
  }
}

export class UnauthorizedError extends ConvexError<ErrorData> {
  constructor(message: string = "Unauthorized", { cause = null }: { cause?: Value } = {}) {
    super({ message, cause })
  }
}

export class ConflictError extends ConvexError<ErrorData> {
  constructor(message: string = "Conflict", { cause = null }: { cause?: Value } = {}) {
    super({ message, cause })
  }
}

export class BadRequestError extends ConvexError<ErrorData> {
  constructor(message: string = "Bad request", { cause = null }: { cause?: Value } = {}) {
    super({ message, cause })
  }
}
