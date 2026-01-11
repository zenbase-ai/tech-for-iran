import { customCtx, customMutation } from "convex-helpers/server/customFunctions"
import {
  internalMutation as rawInternalMutation,
  mutation as rawMutation,
} from "@/convex/_generated/server"
import { triggers } from "../triggers"

export const update = <T extends Record<string, unknown>>(data: T): T & { updatedAt: number } => ({
  ...data,
  updatedAt: Date.now(),
})

export const mutation = customMutation(rawMutation, customCtx(triggers.wrapDB))
export const internalMutation = customMutation(rawInternalMutation, customCtx(triggers.wrapDB))
