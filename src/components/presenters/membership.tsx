import { PricingTable } from "@clerk/nextjs"
import { HStack, type StackProps, VStack } from "@/components/layout/stack"
import { PageTitle } from "@/components/layout/text"
import { cn, type Route } from "@/lib/utils"
import { BreakevenBadge } from "./breakeven-badge"

export type MembershipProps<T extends string = string> = StackProps & {
  redirectURL: Route<T>
}

export const Membership: React.FC<MembershipProps> = ({
  children,
  items = "center",
  className,
  redirectURL,
  ...props
}) => (
  <VStack className={cn("gap-4 sm:gap-6 md:gap-8", className)} items={items} {...props}>
    <HStack className="w-full gap-4 sm:gap-6 md:gap-8 justify-center" items="center" wrap>
      <PageTitle className="text-center text-xl">Help us breakeven!</PageTitle>

      <BreakevenBadge />

      {children}
    </HStack>

    <PricingTable collapseFeatures={false} newSubscriptionRedirectUrl={redirectURL} />
  </VStack>
)
