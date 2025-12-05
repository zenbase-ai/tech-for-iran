"use client"

import { useMemo } from "react"
import { Bar, BarChart, Cell, XAxis } from "recharts"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { useAuthQuery } from "@/hooks/use-auth-query"
import { cn } from "@/lib/utils"

const chartConfig = {
  count: {
    label: "Members online",
    color: "var(--primary)",
  },
  current: {
    label: "Current hour",
    color: "var(--primary)",
  },
} satisfies ChartConfig

export type PodAvailabilityChartProps = {
  podId: Id<"pods">
  className?: string
}

export const PodAvailabilityChart: React.FC<PodAvailabilityChartProps> = ({ podId, className }) => {
  const availability = useAuthQuery(api.pods.query.availability, { podId })

  const data = useMemo(() => {
    if (!availability) {
      return null
    }

    const now = new Date()
    const currentHour = now.getHours()
    // Get user's timezone offset in hours
    const offsetHours = now.getTimezoneOffset() / -60

    // Convert UTC hours to local hours and build chart data
    return Array.from({ length: 24 }, (_, localHour) => {
      // Convert local hour back to UTC to get the correct count
      const utcHour = (((localHour - offsetHours) % 24) + 24) % 24
      return {
        hour: formatHour(localHour),
        count: availability[Math.floor(utcHour)],
        isCurrent: localHour === currentHour,
      }
    })
  }, [availability])

  if (!data) {
    return <Skeleton className={cn("w-full h-39", className)} />
  }

  if (data.length === 0) {
    return null
  }

  return (
    <ChartContainer className={cn("h-39 w-full", className)} config={chartConfig}>
      <BarChart accessibilityLayer data={data}>
        <XAxis axisLine={false} dataKey="hour" interval={2} tickLine={false} tickMargin={8} />
        <ChartTooltip
          content={<ChartTooltipContent formatter={(value) => `${value} members online`} />}
          cursor={false}
        />
        <Bar
          activeBar={{ fill: "var(--primary)", opacity: 1 }}
          dataKey="count"
          radius={[4, 4, 0, 0]}
        >
          {data.map((entry) => (
            <Cell
              fill={
                entry.isCurrent
                  ? "var(--primary)"
                  : "color-mix(in oklch, var(--primary) 30%, transparent)"
              }
              key={entry.hour}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}

const formatHour = (hour: number): string => {
  if (hour === 0) {
    return "12am"
  }
  if (hour === 12) {
    return "12pm"
  }
  if (hour < 12) {
    return `${hour}am`
  }
  return `${hour - 12}pm`
}
