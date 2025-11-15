import { useIntersectionObserver } from "usehooks-ts"

export type UseInfiniteScrollProps = Parameters<typeof useIntersectionObserver>[0] & {
  loadMore: () => unknown
}

export default function useInfiniteScroll({
  loadMore,
  onChange,
  ...options
}: UseInfiniteScrollProps) {
  return useIntersectionObserver({
    ...options,
    onChange: (isIntersecting, entry) => {
      if (isIntersecting) {
        loadMore()
      }
      onChange?.(isIntersecting, entry)
    },
  })
}
