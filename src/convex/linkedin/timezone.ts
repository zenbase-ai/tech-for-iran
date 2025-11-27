"use node"

import { generateObject } from "ai"
import { v } from "convex/values"
import * as z from "zod"
import { internalAction } from "@/convex/_generated/server"
import { openai } from "@/lib/server/openai"

const TimezoneSchema = z.object({
  timezone: z.string(), // IANA timezone identifier
  confidence: z.enum(["high", "medium", "low"]),
})

export const inferTimezone = internalAction({
  args: {
    location: v.string(),
  },
  handler: async (_ctx, { location }): Promise<string> => {
    // Empty/invalid location → default
    if (!location || location.trim() === "") {
      return "America/New_York"
    }

    try {
      const { object } = await generateObject({
        model: openai("gpt-4o-mini"),
        schema: TimezoneSchema,
        prompt: `Infer the IANA timezone identifier from this LinkedIn location: "${location}"

Examples:
- "San Francisco, California" → America/Los_Angeles
- "London, UK" → Europe/London
- "New York, NY" → America/New_York
- "Remote" → America/New_York (default for ambiguous)
- "Tokyo" → Asia/Tokyo

Return the most likely IANA timezone. If uncertain, default to America/New_York.`,
      })

      return object.timezone
    } catch (error) {
      console.error("Failed to infer timezone:", error)
      return "America/New_York" // Fallback on any error
    }
  },
})
