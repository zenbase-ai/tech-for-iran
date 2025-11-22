import truncate, { type TruncateOptions } from "@/lib/truncate"

export default function useTruncated(text: string, options: TruncateOptions): [boolean, string] {
  const truncatedText = truncate(text, options)
  const isTruncated = truncatedText !== text
  return [isTruncated, truncatedText]
}
