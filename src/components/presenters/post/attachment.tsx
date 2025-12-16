import type { Attachment } from "@/schemas/unipile"

export type PostAttachmentProps = {
  attachment: Attachment
}

export const PostAttachment: React.FC<PostAttachmentProps> = ({ attachment }) => {
  if (attachment.unavailable) {
    return null
  }

  switch (attachment.type) {
    case "img":
      return <ImageAttachment attachment={attachment} />
    case "video":
      return <VideoAttachment attachment={attachment} />
    default:
      return null
  }
}

type ImageAttachmentProps = {
  attachment: Attachment & { type: "img" }
}

const ImageAttachment: React.FC<ImageAttachmentProps> = ({ attachment }) => (
  <picture>
    <img
      alt={attachment.id}
      height={attachment.size.height}
      src={attachment.url}
      width={attachment.size.width}
    />
  </picture>
)

type VideoAttachmentProps = {
  attachment: Attachment & { type: "video" }
}

const VideoAttachment: React.FC<VideoAttachmentProps> = ({ attachment }) => (
  <video controls muted src={attachment.url} />
)
