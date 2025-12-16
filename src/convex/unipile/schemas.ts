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
