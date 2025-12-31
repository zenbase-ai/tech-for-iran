"use client"

import { useEffectEvent } from "react"
import { LuMessageCircle } from "react-icons/lu"
import { toast } from "sonner"
import { CopyButton } from "@/components/ui/copy-button"

export type MessageButtonProps = {
  className?: string
}

export const MessageButton: React.FC<MessageButtonProps> = ({ className }) => {
  const onCopy = useEffectEvent(() => {
    toast.info(
      <>
        <strong className="font-semibold">Cyrus' phone number copied!</strong>
        <br />
        Send him an iMessage / Text / WhatsApp
      </>
    )
  })

  return (
    <CopyButton
      className={className}
      content="+19178580261"
      leftIcon={LuMessageCircle}
      onCopy={onCopy}
      size="sm"
      variant="ghost"
    >
      Message Cyrus
    </CopyButton>
  )
}
