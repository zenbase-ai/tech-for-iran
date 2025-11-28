import { LuGlobe } from "react-icons/lu"
import { HStack, type StackProps } from "@/components/layout/stack"
import { cn } from "@/lib/utils"
import { settingsConfig } from "@/schemas/settings-config"

export type AccountTimezoneProps = StackProps & {
  timezone?: string
}

export const AccountTimezone: React.FC<AccountTimezoneProps> = ({
  timezone = settingsConfig.defaultValues.timezone,
  className,
  items = "center",
  wrap = true,
  ...props
}) => (
  <HStack className={cn("gap-1", className)} items={items} wrap={wrap} {...props}>
    <LuGlobe />
    {timezone.replace("_", " ").replace("/", " / ")}
  </HStack>
)
