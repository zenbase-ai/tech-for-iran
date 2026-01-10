"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { SortOption } from "@/convex/signatories/query"

export type CommitmentsSortSelectProps = {
  value: SortOption
  onChange: (value: SortOption) => void
}

const sortLabels: Record<SortOption, string> = {
  upvotes: "Most upvoted",
  recent: "Most recent",
}

/**
 * CommitmentsSortSelect - Dropdown for sorting commitments.
 *
 * Options:
 * - "Most upvoted" - Sort by upvote count descending
 * - "Most recent" - Sort by sign date descending
 */
export const CommitmentsSortSelect: React.FC<CommitmentsSortSelectProps> = ({
  value,
  onChange,
}) => (
  <Select onValueChange={(v) => onChange(v as SortOption)} value={value}>
    <SelectTrigger className="w-fit gap-2" size="sm">
      <span className="text-muted-foreground">Sort:</span>
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="upvotes">{sortLabels.upvotes}</SelectItem>
      <SelectItem value="recent">{sortLabels.recent}</SelectItem>
    </SelectContent>
  </Select>
)
