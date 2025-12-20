"use client"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { TextShimmer } from "@/components/ui/text-shimmer"
import { api } from "@/convex/_generated/api"
import { useAuthQuery } from "@/hooks/use-auth-query"
import { cn } from "@/lib/utils"

export function BreakevenProgress({ className }: { className?: string }) {
  const data = useAuthQuery(api.stats.query.breakevenProgress)

  if (!data) {
    return <Skeleton className={cn("h-16 w-full", className)} />
  }

  const isBreakeven = data.progress >= 100

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div
          className={cn("space-y-2 cursor-pointer hover:opacity-80 transition-opacity", className)}
        >
          <div className="flex items-center justify-between text-sm">
            {isBreakeven ? (
              <TextShimmer className="text-sm font-medium">🎉 Breakeven Achieved!</TextShimmer>
            ) : (
              <span className="text-muted-foreground">Breakeven Progress</span>
            )}
            <span className={cn("font-medium tabular-nums", isBreakeven && "text-green-500")}>
              {Math.round(data.progress)}%
            </span>
          </div>
          <Progress
            className={cn(
              "h-2",
              isBreakeven &&
                "[&>[data-slot=progress-indicator]]:bg-gradient-to-r [&>[data-slot=progress-indicator]]:from-green-500 [&>[data-slot=progress-indicator]]:to-emerald-400"
            )}
            value={data.progress}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-72">
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-sm">Breakeven Progress</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Tracking our path to financial sustainability
            </p>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Days Since Launch:</span>
              <span className="font-medium tabular-nums">{data.daysSinceLaunch}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Progress:</span>
              <span className={cn("font-medium tabular-nums", isBreakeven && "text-green-500")}>
                {Math.round(data.progress)}%
              </span>
            </div>
          </div>

          <div className="border-t pt-2">
            <p className="text-xs text-muted-foreground">
              <strong>Formula:</strong> Revenue ÷ ((Accounts × $5 + $50) × Months)
            </p>
          </div>

          {isBreakeven && (
            <div className="border-t pt-3">
              <p className="text-sm font-medium text-green-500">
                🚀 We've reached breakeven! Thank you for your support!
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
