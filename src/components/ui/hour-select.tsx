import { range } from "es-toolkit"
import { type ChangeEvent, useEffectEvent } from "react"
import { NativeSelect, NativeSelectOption } from "./native-select"

export type HourSelectProps = React.ComponentProps<"select"> & {
  min?: number
  max?: number
  onChange?: (hour: number) => void
}

export const HourSelect: React.FC<HourSelectProps> = ({
  min = 0,
  max = 23,
  onChange,
  ...props
}) => {
  const handleChange = useEffectEvent((e: ChangeEvent<HTMLSelectElement>) =>
    onChange?.(Number.parseInt(e.target.value, 10))
  )

  return (
    <NativeSelect {...props} onChange={handleChange}>
      {range(min, max + 1).map((hour) => (
        <NativeSelectOption key={hour} value={hour}>
          {hour.toString().padStart(2, "0")}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  )
}
