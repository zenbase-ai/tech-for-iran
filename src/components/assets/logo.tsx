import Image, { type ImageProps } from "next/image"
import { cn } from "@/lib/utils"
import LogoImage from "@/public/logo.png"

export type Logo = Omit<ImageProps, "alt" | "src"> & {
  alt?: string
}

export const Logo: React.FC<Logo> = ({ className, alt = "Smoke the Ayatollah", ...props }) => (
  <Image
    alt={alt}
    className={cn("aspect-square dark:invert", className)}
    src={LogoImage}
    {...props}
  />
)
