"use client"

import { useAction } from "convex/react"
import Link from "next/link"
import { LuArrowRight, LuInfo } from "react-icons/lu"
import { Grid } from "@/components/layout/grid"
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

const NUMBER_FORMAT_CURRENCY: Intl.NumberFormatOptions = { style: "currency", currency: "USD" }
const formatCurrency = (valueInCents: number) =>
  new Intl.NumberFormat("en-US", NUMBER_FORMAT_CURRENCY).format(valueInCents / 100)

export const BreakevenBadge: React.FC<BreakevenBadgeProps> = (props) => {
  const subscription = useSubscriptionPlan()
  if (subscription == null || subscription === "gold_member") {
    return null
  }

  return <BreakevenBadgeWithPopover {...props} />
}

const BreakevenBadgeWithPopover: React.FC<BreakevenBadgeProps> = ({ className, ...props }) => {
  const fetchProgress = useAsyncFn(useAction(api.breakeven.progress))
  const isMounted = useMounted()

  useAsyncEffect(async () => {
    if (isMounted) {
      await fetchProgress.execute()
    }
  }, [isMounted])

  const profit = (fetchProgress.data?.lifetime?.profit ?? 0) / 100
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
          <Grid as="dl" className="gap-2 w-full items-center grid-cols-[2fr_1fr]">
            <dt className="text-sm font-semibold text-muted-foreground">Monthly Revenue</dt>
            <dd className="justify-self-end">
              {formatCurrency(fetchProgress.data?.monthly?.revenue ?? 0)}
            </dd>
            <dt className="text-sm font-semibold text-muted-foreground">Monthly Expenses</dt>
            <dd className="justify-self-end">
              {formatCurrency(fetchProgress.data?.monthly?.expenses ?? 0)}
            </dd>
          </Grid>
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
