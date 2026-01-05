"use client"

import { useAction } from "convex/react"
import Link from "next/link"
import { LuArrowRight, LuInfo } from "react-icons/lu"
import { VStack } from "@/components/layout/stack"
import { Badge, type BadgeProps } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { NumberTicker } from "@/components/ui/number-ticker"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { api } from "@/convex/_generated/api"
import useAsyncEffect from "@/hooks/use-async-effect"
import useAsyncFn from "@/hooks/use-async-fn"
import useMounted from "@/hooks/use-mounted"
import { useSubscriptionPlan } from "@/hooks/use-subscription-plan"
import { cn } from "@/lib/utils"

export type BreakevenBadgeProps = Omit<BadgeProps, "children" | "variant">

export const BreakevenBadge: React.FC<BreakevenBadgeProps> = (props) => {
  const subscription = useSubscriptionPlan()
  if (subscription == null || subscription === "gold_member") {
    return null
  }

  return <BreakevenBadgeWithPopover {...props} />
}

const NUMBER_FORMAT_CURRENCY: Intl.NumberFormatOptions = { style: "currency", currency: "USD" }

const BreakevenBadgeWithPopover: React.FC<BreakevenBadgeProps> = ({ className, ...props }) => {
  const { data, execute } = useAsyncFn(useAction(api.billing.breakeven.progress))
  const isMounted = useMounted()

  useAsyncEffect(async () => {
    if (isMounted) {
      await execute()
    }
  }, [isMounted])

  const profit = (data?.lifetime?.profit ?? 0) / 100
  if (profit >= 0) {
    return null
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Badge
          className={cn("animate-in fade-in cursor-pointer", className)}
          variant={profit === 0 ? "outline" : profit > 0 ? "default" : "destructive"}
          {...props}
        >
          <NumberTicker
            className="tabular-nums"
            decimalPlaces={2}
            options={NUMBER_FORMAT_CURRENCY}
            value={profit}
          />
          since launch
          <LuInfo className="size-4 ml-1" />
        </Badge>
      </PopoverTrigger>
      <PopoverContent>
        <VStack className="gap-4" items="end">
          <p>Help us exist forever so we can support our friends forever ❤️</p>
          <Button asChild size="sm">
            <Link href="/settings">
              Membership
              <LuArrowRight />
            </Link>
          </Button>
        </VStack>
      </PopoverContent>
    </Popover>
  )
}
