"use client"

import { useAction } from "convex/react"
import { Badge, type BadgeProps } from "@/components/ui/badge"
import { NumberTicker } from "@/components/ui/number-ticker"
import { api } from "@/convex/_generated/api"
import useAsyncEffect from "@/hooks/use-async-effect"
import useAsyncFn from "@/hooks/use-async-fn"
import useMounted from "@/hooks/use-mounted"
import { cn } from "@/lib/utils"

export type BreakevenBadgeProps = Omit<BadgeProps, "children" | "variant">

export const BreakevenBadge: React.FC<BreakevenBadgeProps> = ({ className, ...props }) => {
  const { data, execute } = useAsyncFn(useAction(api.breakeven.progress))
  const isMounted = useMounted()

  useAsyncEffect(async () => {
    if (isMounted) {
      await execute()
    }
  }, [isMounted])

  const profit = (data?.profit ?? 0) / 100
  const verb = profit >= 0 ? "earned" : "in the red"

  return (
    <Badge
      className={cn(className)}
      variant={profit === 0 ? "outline" : profit > 0 ? "default" : "destructive"}
      {...props}
    >
      <NumberTicker
        className="tabular-nums"
        decimalPlaces={2}
        options={{ style: "currency", currency: "USD" }}
        value={Math.abs(profit)}
      />{" "}
      {verb} since launch
    </Badge>
  )
}
