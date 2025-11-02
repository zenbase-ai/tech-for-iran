import { LuGem } from "react-icons/lu"
import { HStack, type StackProps, VStack } from "@/components/layout/stack"
import { CTALinkButton } from "@/components/ui/cta-link-button"
import { cn } from "@/lib/utils"

export type HeroProps = {
  title: React.ReactNode
  lede?: React.ReactNode
  ctas: {
    [key: string]: string
  }
}

export const Hero: React.FC<HeroProps> = ({ title, lede, ctas }) => (
  <HeroSection>
    <HeroTitle>{title}</HeroTitle>
    {typeof lede === "string" ? <HeroLede>{lede}</HeroLede> : lede}
    <HeroCTA>
      {Object.entries(ctas).map(([title, href]) => (
        <CTALinkButton key={title} href={href as any}>
          {title}
        </CTALinkButton>
      ))}
    </HeroCTA>
  </HeroSection>
)

export type HeroTitleProps = React.ComponentProps<"h1">

export const HeroTitle: React.FC<HeroTitleProps> = ({ className, children, ...props }) => (
  <h1
    className={cn(
      "text-center font-bold text-xl md:text-2xl lg:text-left lg:text-3xl font-serif leading-[0.95]",
      className,
    )}
    {...props}
  >
    {children}
  </h1>
)

export type HeroLedeProps = React.ComponentProps<"h3">

export const HeroLede: React.FC<HeroLedeProps> = ({ className, children, ...props }) => (
  <h3
    className={cn(
      "text-muted-foreground text-center text-lg font-300 lg:text-left font-serif leading-[1.3]",
      className,
    )}
    {...props}
  >
    {children}
  </h3>
)

export type HeroCTAProps = StackProps

export const HeroCTA: React.FC<HeroCTAProps> = ({ className, children, ...props }) => (
  <HStack
    wrap
    items="center"
    className={cn("gap-2 justify-center lg:justify-start mt-1", className)}
    {...props}
  >
    {children}
  </HStack>
)

export type HeroSectionProps = StackProps

export const HeroSection: React.FC<HeroSectionProps> = ({ className, children, ...props }) => (
  <HStack
    as="section"
    id="hero"
    wrap
    items="center"
    justify="center"
    className={cn(
      "size-full min-w-[320px] max-w-[1280px] mx-auto",
      "gap-4 sm:gap-6 md:gap-8 lg:gap-10",
      className,
    )}
    {...props}
  >
    <aside>
      <LuGem className="size-32 stroke-[1px]" />
    </aside>
    <VStack className="gap-4 items-center lg:items-start">{children}</VStack>
  </HStack>
)
