"use client"

import { useEffectEvent } from "react"
import { LuSend } from "react-icons/lu"
import { toast } from "sonner"
import { CopyButton, type CopyButtonProps } from "@/components/ui/copy-button"
import { url } from "@/lib/utils"

export type InviteButtonProps = Omit<CopyButtonProps, "content" | "onCopy"> & {
  inviteCode: string
}

export const InviteButton: React.FC<InviteButtonProps> = ({ inviteCode, ...props }) => {
  const inviteURL = url("/sign-up", { searchParams: { inviteCode } })
  const onCopy = useEffectEvent(() => toast.success("Invite link copied to clipboard"))

  return (
    <CopyButton content={inviteURL} icon={LuSend} onCopy={onCopy} size="sm" {...props}>
      Invite
    </CopyButton>
  )
}
