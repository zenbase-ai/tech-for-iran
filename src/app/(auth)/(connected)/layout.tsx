import { auth } from "@clerk/nextjs/server"
import { RedirectType, redirect } from "next/navigation"
import ConnectedClientLayout from "./layout.client"

export default async function ConnectedLayout({ children }: React.PropsWithChildren) {
  const { has } = await auth()
  if (!(has({ plan: "crackedbook" }) || has({ plan: "free" }))) {
    return redirect("/connect/membership", RedirectType.replace)
  }

  return <ConnectedClientLayout>{children}</ConnectedClientLayout>
}
