import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Connect | Crackedbook",
}

export default function ConnectLayout({ children }: React.PropsWithChildren) {
  return <>{children}</>
}
