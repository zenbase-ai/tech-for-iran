export type TruncateOptions = {
  length: number
  overflow?: string
  on?: "char" | "word"
}

export default function truncate(text: string, options: TruncateOptions): string {
  const { length: maxLength, overflow = "...", on = "word" } = options

  if (text.length <= maxLength) {
    return text
  }

  const truncateLength = maxLength - overflow.length

  if (truncateLength <= 0) {
    return overflow.slice(0, maxLength)
  }

  if (on === "char") {
    return text.slice(0, truncateLength) + overflow
  }

  // on === "word"
  const truncated = text.slice(0, truncateLength)
  const lastSpaceIndex = truncated.lastIndexOf(" ")

  if (lastSpaceIndex === -1) {
    return truncated + overflow
  }

  return truncated.slice(0, lastSpaceIndex) + overflow
}
