"use client"

import { useEffectEvent } from "react"
import { LuSend } from "react-icons/lu"
import { toast } from "sonner"
import { CopyButton, type CopyButtonProps } from "@/components/ui/copy-button"
import useScreenSize from "@/hooks/use-screen-size"
import { url } from "@/lib/utils"

export type InviteButtonProps = Omit<CopyButtonProps, "content" | "onCopy"> & {
  inviteCode: string
}

export const InviteButton: React.FC<InviteButtonProps> = ({ inviteCode, ...props }) => {
  const inviteURL = url("/sign-up", { searchParams: { inviteCode } })
  const onCopy = useEffectEvent(() => toast.success("Invite link copied to clipboard"))
  const sm = useScreenSize("sm")

  if (sm) {
    return (
      <CopyButton content={inviteURL} icon={LuSend} onCopy={onCopy} size="sm" {...props}>
        Invite
      </CopyButton>
    )
  }

  return (
    <CopyButton
      className="size-8!"
      content={inviteURL}
      icon={LuSend}
      onCopy={onCopy}
      size="icon"
      {...props}
    />
  )
}
