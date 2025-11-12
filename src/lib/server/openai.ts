import { createOpenAI } from "@ai-sdk/openai"
import { env } from "@/lib/env.mjs"

export const openai = createOpenAI({
  apiKey: env.OPENAI_API_KEY,
})
