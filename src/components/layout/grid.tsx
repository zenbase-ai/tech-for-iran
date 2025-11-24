import { cva, type VariantProps } from "class-variance-authority"

const gridVariants = cva("grid", {
  variants: {
    cols: {
      1: "grid-cols-1",
      2: "grid-cols-2",
      3: "grid-cols-3",
      4: "grid-cols-4",
      5: "grid-cols-5",
      6: "grid-cols-6",
      7: "grid-cols-7",
      8: "grid-cols-8",
      9: "grid-cols-9",
      10: "grid-cols-10",
      11: "grid-cols-11",
      12: "grid-cols-12",
      none: "grid-cols-none",
      subgrid: "grid-cols-subgrid",
    },
    rows: {
      1: "grid-rows-1",
      2: "grid-rows-2",
      3: "grid-rows-3",
      4: "grid-rows-4",
      5: "grid-rows-5",
      6: "grid-rows-6",
      7: "grid-rows-7",
      8: "grid-rows-8",
      9: "grid-rows-9",
      10: "grid-rows-10",
      11: "grid-rows-11",
      12: "grid-rows-12",
      none: "grid-rows-none",
      subgrid: "grid-rows-subgrid",
    },
    flow: {
      row: "grid-flow-row",
      col: "grid-flow-col",
      dense: "grid-flow-dense",
      "row-dense": "grid-flow-row-dense",
      "col-dense": "grid-flow-col-dense",
    },
    align: {
      start: "items-start",
      end: "items-end",
      center: "items-center",
      baseline: "items-baseline",
      stretch: "items-stretch",
    },
    justify: {
      start: "justify-start",
      end: "justify-end",
      center: "justify-center",
      between: "justify-between",
      around: "justify-around",
      evenly: "justify-evenly",
    },
    placeItems: {
      start: "place-items-start",
      end: "place-items-end",
      center: "place-items-center",
      baseline: "place-items-baseline",
      stretch: "place-items-stretch",
    },
    placeContent: {
      start: "place-content-start",
      end: "place-content-end",
      center: "place-content-center",
      between: "place-content-between",
      around: "place-content-around",
      evenly: "place-content-evenly",
      stretch: "place-content-stretch",
    },
  },
  defaultVariants: {
    cols: 1,
  },
})

export type GridProps<T extends React.ElementType = "div"> = React.ComponentProps<T> &
  VariantProps<typeof gridVariants> & {
    as?: T
  }

export const Grid = <T extends React.ElementType = "div">({
  className,
  as: Component = "div",
  cols,
  rows,
  flow,
  align,
  justify,
  placeItems,
  placeContent,
  ...props
}: GridProps<T>) => (
  <Component
    className={gridVariants({
      cols,
      rows,
      flow,
      align,
      justify,
      placeItems,
      placeContent,
      className,
    })}
    {...props}
  />
)
