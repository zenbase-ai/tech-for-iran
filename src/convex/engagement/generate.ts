"use node"

import { llml } from "@zenbase/llml"
import { generateText } from "ai"
import { v } from "convex/values"
import { randomInt, sample } from "es-toolkit"
import { internalAction } from "@/convex/_generated/server"
import { LinkedInReaction } from "@/lib/linkedin"
import { openai } from "@/lib/server/openai"

export const delay = internalAction({
  args: {
    minDelay: v.number(),
    maxDelay: v.number(),
  },
  handler: async (_ctx, args): Promise<number> => {
    const delay = randomInt(args.minDelay, args.maxDelay + 1) * 1000
    const jitter = randomInt(0, 2500)
    return delay + jitter
  },
})

export const reaction = internalAction({
  args: {
    reactionTypes: v.array(v.string()),
  },
  handler: async (_ctx, args): Promise<LinkedInReaction> =>
    LinkedInReaction.parse(sample(args.reactionTypes) ?? "like"),
})

export const comment = internalAction({
  args: {
    user: v.object({
      firstName: v.string(),
      lastName: v.string(),
      location: v.optional(v.string()),
      headline: v.optional(v.string()),
    }),
    post: v.object({
      text: v.string(),
      author: v.object({
        name: v.string(),
        headline: v.string(),
      }),
    }),
    reactionType: v.string(),
  },
  handler: async (_ctx, args) => {
    // 2/3 chance to skip generating a comment
    const skip = sample([true, true, false])
    if (skip) {
      return null
    }

    const { text } = await generateText({
      model: openai("gpt-5-mini"),
      providerOptions: {
        openai: {
          reasoningEffort: "low",
        },
      },
      maxRetries: 3,
      system: llml({
        instructions:
          "You are an experienced professional engagement specialist crafting authentic LinkedIn comments on behalf of the following user. Your comments should be authentic, genuine, and reflect thoughtful analysis of the original post.",
        user: args.user,
        corePrinciples: [
          "Be conversational yet professional",
          "Add a unique perspective or insight",
          "Sound like a real human, not a bot",
          "Avoid generic praise or platitudes",
          "Match the tone of the original post",
          "Keep it concise (1-3 sentences ideal)",
        ],
        authenticityMarkers: [
          "Use natural contractions (I'm, you're, that's)",
          "Occasionally use mild emphasis (great, really, quite)",
          "Reference specific points from the post",
          "Ask thoughtful follow-up questions when relevant",
          "Share brief relevant experiences or observations",
        ],
        avoid: [
          `Generic praise ("Great post!", "This is amazing!")`,
          "Overused buzzwords (synergy, paradigm shift, game-changer)",
          "Emojis",
          "Self-promotion or links",
          "Overly formal or robotic",
          "Questions that are answered in the post",
        ],
        tips: [
          "Reference something specific from the post",
          "Add value through insight, question, or relevant perspective",
          "Sound natural and conversational",
          "Be 15-60 words (aim for brevity)",
          "Avoid clichés and generic statements",
        ],
        ideas: [
          "Express agreement or appreciation with specific reasoning",
          "Share in the excitement with authentic enthusiasm",
          "Support the author empathetically",
          "Connect emotionally with what resonated most",
          "Add a complementary insight or build on their point",
          "Ask a thoughtful question or add perspective",
        ],
        rules: ["Write ONLY the comment text, no quotes or metadata."],
      }),
      prompt: llml({
        linkedinPost: args.post,
        userReaction: `The user reacted to this post with: ${args.reactionType}`,
        task: "Now generate a thoughtful LinkedIn comment for this post.",
      }),
    })

    return text
  },
})
