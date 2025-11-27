import { NativeSelect, NativeSelectOption } from "./native-select"

const ALL_TIMEZONES = Intl.supportedValuesOf("timeZone")

export type TimezoneSelectProps = React.ComponentProps<"select"> & {
  options?: string[]
}

export const TimezoneSelect: React.FC<TimezoneSelectProps> = ({
  options = ALL_TIMEZONES,
  ...props
}) => (
  <NativeSelect {...props}>
    {options.map((option) => (
      <NativeSelectOption key={option} value={option}>
        {option}
      </NativeSelectOption>
    ))}
  </NativeSelect>
)
