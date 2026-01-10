"use client"

import Link from "next/link"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export type SignToUpvoteModalProps = {
  /** Whether the modal is open */
  open: boolean
  /** Callback when the modal should close */
  onOpenChange: (open: boolean) => void
}

/**
 * SignToUpvoteModal - Alert dialog shown when a non-signatory attempts to upvote.
 *
 * Provides a clear explanation and path to sign the letter.
 */
export const SignToUpvoteModal: React.FC<SignToUpvoteModalProps> = ({ open, onOpenChange }) => (
  <AlertDialog onOpenChange={onOpenChange} open={open}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Sign the letter to upvote</AlertDialogTitle>
        <AlertDialogDescription>
          Only signatories can upvote commitments. This keeps the community high-quality and
          prevents spam.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction asChild>
          <Link href="/">Sign now</Link>
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
)
