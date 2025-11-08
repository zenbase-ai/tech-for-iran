import { auth } from "@clerk/nextjs/server"
import AuthClientLayout from "./layout.client"

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  await auth.protect()

  return <AuthClientLayout>{children}</AuthClientLayout>
}
