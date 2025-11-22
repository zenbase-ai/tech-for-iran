"use node"

import { llml } from "@zenbase/llml"
import { generateText } from "ai"
import { v } from "convex/values"
import { randomInt, sample as randomSample } from "es-toolkit"
import { internalAction } from "@/convex/_generated/server"
import { LinkedInReaction } from "@/lib/linkedin"
import { openai } from "@/lib/server/openai"
import { chance } from "@/lib/utils"

export const sample = internalAction({
  args: {
    items: v.array(v.any()),
  },
  handler: async (_ctx, { items }) => randomSample(items),
})

export const delay = internalAction({
  args: {
    minDelay: v.number(),
    maxDelay: v.number(),
  },
  handler: async (_ctx, args): Promise<number> =>
    // base [minDelay, maxDelay] + jitter [0, 2500]
    randomInt(args.minDelay, args.maxDelay + 1) * 1000 + randomInt(0, 2501),
})

export const reaction = internalAction({
  args: {
    reactionTypes: v.array(v.string()),
  },
  handler: async (_ctx, args): Promise<LinkedInReaction> =>
    LinkedInReaction.parse(randomSample(args.reactionTypes) ?? "like"),
})

type Comment = string | null

export const comment = internalAction({
  args: {
    profile: v.object({
      firstName: v.string(),
      lastName: v.string(),
      location: v.string(),
      headline: v.string(),
    }),
    prompt: v.optional(v.string()),
    post: v.object({
      text: v.string(),
      author: v.object({
        name: v.string(),
        headline: v.string(),
        url: v.optional(v.string()),
      }),
    }),
    reactionType: v.string(),
  },
  handler: async (_ctx, args): Promise<Comment> => {
    const skip = chance(2, 3)
    if (skip) {
      return null
    }

    const askQuestion = chance(1, 3)

    const { text } = await generateText({
      model: openai("gpt-5-mini"),
      maxRetries: 3,
      system: llml({
        instructions:
          "You are crafting authentic LinkedIn comments on behalf of the following user. Your comments should be authentic, genuine, and reflect thoughtful analysis of the original post.",
        user: args.profile,
        corePrinciples: [
          "Imagine you're texting a friend",
          "Add a unique perspective or insight",
          "Sound like a real human, not a bot",
          "Avoid generic praise or platitudes",
          "Match the tone of the original post",
          "Keep it concise (1-2 sentences ideal)",
        ],
        avoid: [
          "Overused buzzwords (synergy, paradigm shift, game-changer)",
          "Emojis",
          "Overly formal or robotic",
          askQuestion && "Questions that are answered in the post",
        ],
        tips: ["Sound natural and conversational", "Be 8-25 words (aim for brevity)"],
        ideas: [
          "Express agreement or appreciation with specific reasoning",
          "Share in the excitement with authentic enthusiasm",
          "Support the author empathetically",
          "Connect emotionally with what resonated most",
          "Add a complementary insight or build on their point",
        ],
        rules: [
          "Write ONLY the comment text, no quotes or metadata.",
          !askQuestion && "Do not ask a question.",
        ],
      }),
      prompt: llml({
        linkedinPost: args.post,
        userReaction: `The user reacted to this post with: ${args.reactionType}`,
        task: "Now generate a thoughtful LinkedIn comment for this post.",
        userPrompt: args.prompt,
      }),
    })

    return text
  },
})
