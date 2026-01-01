import { DateTime } from "luxon"
import * as z from "zod"

const AttachmentPrototype = z.object({
  id: z.string(),
  file_size: z.number().optional(),
  unavailable: z.boolean(),
  mimetype: z.string().optional(),
  url: z.string(),
  url_expires_at: z.number().optional(),
})

export const Attachment = z.union([
  AttachmentPrototype.extend({
    type: z.literal("img"),
    size: z.object({
      width: z.number(),
      height: z.number(),
    }),
    sticker: z.boolean(),
  }),
  AttachmentPrototype.extend({
    type: z.literal("video"),
    size: z.object({
      width: z.number(),
      height: z.number(),
    }),
    gif: z.boolean(),
  }),
  AttachmentPrototype.extend({
    type: z.literal("audio"),
    duration: z.number(),
    voice_note: z.boolean(),
  }),
  AttachmentPrototype.extend({
    type: z.literal("file"),
    file_name: z.string(),
  }),
  AttachmentPrototype.extend({
    type: z.literal("linkedin_post"),
  }),
  AttachmentPrototype.extend({
    type: z.literal("video_meeting"),
    starts_at: z.number(),
    expires_at: z.number(),
    time_range: z.number(),
  }),
])
export type Attachment = z.infer<typeof Attachment>

export const Author = z.object({
  public_identifier: z.string(),
  id: z.string(),
  name: z.string(),
  is_company: z.boolean(),
  headline: z.string().optional(),
})

export const ParsedDatetime = z.iso
  .datetime()
  .refine((s) => DateTime.fromISO(s).isValid, "Invalid datetime")
  .transform((s) => DateTime.fromISO(s).toMillis())

export const ProfilePrototype = z.object({
  provider_id: z.string(),
  public_identifier: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  summary: z.string(),
  location: z.string(),
  profile_picture_url: z.string(),
})

export const OwnProfile = ProfilePrototype.extend({
  object: z.literal("AccountOwnerProfile"),
  public_profile_url: z.string(),
  occupation: z.string(),
})
export type OwnProfile = z.infer<typeof OwnProfile>

export const Profile = ProfilePrototype.extend({
  object: z.literal("UserProfile"),
  provider: z.literal("LINKEDIN"),
  is_relationship: z.boolean(),
  profile_picture_url_large: z.string(),
  headline: z.string(),
  invitation: z
    .object({
      type: z.enum(["SENT", "RECEIVED"]),
    })
    .optional(),
})
export type Profile = z.infer<typeof Profile>

export const Post = z.object({
  object: z.literal("Post"),
  provider: z.literal("LINKEDIN"),
  id: z.string(),
  social_id: z.string(),
  share_url: z.string(),
  text: z.string(),
  parsed_datetime: ParsedDatetime,
  is_repost: z.boolean(),
  repost_content: z
    .object({
      id: z.string(),
      parsed_datetime: ParsedDatetime,
      author: Author,
    })
    .optional(),
  attachments: z.array(Attachment).optional(),
  author: Author,
  comment_counter: z.number().int(),
  impressions_counter: z.number().int(),
  reaction_counter: z.number().int(),
  repost_counter: z.number().int(),
})
export type Post = z.infer<typeof Post>

export const Posts = z.object({
  type: z.literal("PostList"),
  items: z.array(Post),
  cursor: z.string().optional(),
  paging: z.object({
    page_count: z.number().int(),
  }),
})
export type Posts = z.infer<typeof Posts>
