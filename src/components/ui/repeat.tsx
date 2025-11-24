import { Fragment } from "react"

export type RepeatProps = {
  count: number
  children: React.ReactNode
}

export const Repeat: React.FC<RepeatProps> = ({ count, children }) => (
  <>
    {Array.from({ length: count }, (_, index) => (
      // biome-ignore lint/suspicious/noArrayIndexKey: index is the only key we have
      <Fragment key={index}>{children}</Fragment>
    ))}
  </>
)
