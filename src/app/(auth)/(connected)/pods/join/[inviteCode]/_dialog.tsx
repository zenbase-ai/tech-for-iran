"use client"

import Link from "next/link"
import type React from "react"
import { LuArrowRight } from "react-icons/lu"
import { VStack } from "@/components/layout/stack"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { NumberTicker } from "@/components/ui/number-ticker"
import type { Doc } from "@/convex/_generated/dataModel"

export type JoinDialogProps = {
  pod: Pick<Doc<"pods">, "_id" | "name">
  memberCount: number
}

export const JoinDialog: React.FC<JoinDialogProps> = ({ pod, memberCount }) => (
  <AlertDialog open>
    <AlertDialogContent className="max-w-md">
      <VStack className="gap-4">
        <AlertDialogHeader>
          <AlertDialogTitle>
            Join <NumberTicker value={memberCount} /> new friends
          </AlertDialogTitle>
          <AlertDialogDescription className="text-lg italic">
            You have uttered la contrasegna to <strong>{pod.name}</strong>.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogAction size="sm">
            <Link href={`/pods/${pod._id}`}>
              Enter
              <LuArrowRight className="size-3" />
            </Link>
          </AlertDialogAction>
        </AlertDialogFooter>
      </VStack>
    </AlertDialogContent>
  </AlertDialog>
)
