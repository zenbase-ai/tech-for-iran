import Link from "next/link"
import { Logo } from "@/components/assets/logo"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { HStack, type StackProps } from "./stack"
import { PageTitle } from "./text"

export type PageHeaderProps = StackProps & {
  title: React.ReactNode
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  className,
  title,
  items = "center",
  justify = "between",
  ...props
}) => (
  <HStack
    className={cn("w-full gap-2 sm:gap-3 lg:gap-4", className)}
    items={items}
    justify={justify}
    {...props}
  >
    <Link href="/pods">
      <Logo className="stroke-2" size="size-7" />
    </Link>

    <Separator className="h-7!" orientation="vertical" />

    <PageTitle className="mr-auto">{title}</PageTitle>
  </HStack>
)
