import Image, { type ImageProps } from "next/image"
import { cn } from "@/lib/utils"
import Asset from "./smoke-the-ayatollah.png"

export type SmokeTheAyatollahProps = Omit<ImageProps, "alt" | "src"> & {
  alt?: string
}

export const SmokeTheAyatollah: React.FC<SmokeTheAyatollahProps> = ({
  className,
  alt = "Smoke the Ayatollah",
  ...props
}) => (
  <Image
    alt={alt}
    className={cn("aspect-square size-full max-h-sm max-w-sm", className)}
    src={Asset}
    {...props}
  />
)
