import { type NextRequest, NextResponse } from "next/server"
import * as z from "zod"
import { LINKEDIN_REACTION_TYPES, validateReactionTypes } from "@/lib/engagement/helpers"
import { getPostURN, isValidLinkedInPostUrl } from "@/lib/linkedin/post-urn"
import { requireUser } from "@/lib/clerk/auth"
import { createPost, getPostByUrl, getSquadByInviteCode } from "@/lib/supabase/queries"

/**
 * Request schema for POST /api/engagements
 */
const EngagementRequestSchema = z.object({
  postUrl: z.url(),
  reactionTypes: z
    .array(z.enum(LINKEDIN_REACTION_TYPES))
    .min(1, "At least one reaction type is required"),
  squadInviteCode: z.string().default("yc-alumni"), // Default to YC Alumni squad
})

/**
 * POST /api/engagements
 * Submit a LinkedIn post for automated engagement from squad members
 *
 * Body: {
 *   postUrl: string - LinkedIn post URL
 *   reactionTypes: string[] - Array of reaction types (LIKE, CELEBRATE, etc.)
 *   squadInviteCode?: string - Optional squad invite code (defaults to "yc-alumni")
 * }
 *
 * Returns: {
 *   status: "scheduled" | "duplicate"
 *   postId: string
 *   message: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Ensure user is authenticated
    const user = await requireUser()

    // Parse and validate request body
    const body = await request.json()
    const result = EngagementRequestSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request", details: result.error.issues },
        { status: 400 },
      )
    }

    const { postUrl, reactionTypes, squadInviteCode } = result.data

    // Validate LinkedIn post URL format
    if (!isValidLinkedInPostUrl(postUrl)) {
      return NextResponse.json({ error: "Invalid LinkedIn post URL" }, { status: 400 })
    }

    // Validate reaction types
    const validReactions = validateReactionTypes(reactionTypes)
    if (validReactions.length === 0) {
      return NextResponse.json(
        {
          error: "Invalid reaction types",
          validTypes: LINKEDIN_REACTION_TYPES,
        },
        { status: 400 },
      )
    }

    // Get the squad
    const squad = await getSquadByInviteCode(squadInviteCode)

    // Check for duplicate post submission
    const existingPost = await getPostByUrl(postUrl, squad.id)
    if (existingPost) {
      return NextResponse.json(
        {
          status: "duplicate",
          postId: existingPost.id,
          message: "This post has already been submitted for engagement",
        },
        { status: 200 },
      )
    }

    // Extract post URN from URL
    let postUrn: string
    try {
      postUrn = await getPostURN(postUrl)
    } catch (error) {
      console.error("Failed to extract post URN:", error)
      return NextResponse.json(
        { error: "Could not extract LinkedIn post ID from URL" },
        { status: 400 },
      )
    }

    // Create post record in database
    const post = await createPost({
      author_user_id: user.id,
      squad_id: squad.id,
      post_url: postUrl,
      post_urn: postUrn,
    })

    console.log("Post created:", {
      postId: post.id,
      authorId: user.id,
      squadId: squad.id,
      postUrl,
      reactionTypes: validReactions,
    })

    // TODO: Start engagement workflow (Phase 5)
    // await start(handlePostEngagement, {
    //   userId: user.id,
    //   postId: post.id,
    //   postUrl,
    //   postUrn,
    //   reactionTypes: validReactions,
    //   squadId: squad.id,
    // })

    // For now, just return success
    // The workflow will be implemented in Phase 5
    return NextResponse.json({
      status: "scheduled",
      postId: post.id,
      message: "Post submitted for engagement. Workflow will be implemented in Phase 5.",
      reactionTypes: validReactions,
    })
  } catch (error) {
    console.error("Error submitting engagement:", error)

    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    return NextResponse.json({ error: "Failed to submit post for engagement" }, { status: 500 })
  }
}

/**
 * GET /api/engagements
 * Get list of posts submitted for engagement
 * (For future implementation)
 */
export async function GET() {
  return NextResponse.json({ error: "Not implemented yet" }, { status: 501 })
}
