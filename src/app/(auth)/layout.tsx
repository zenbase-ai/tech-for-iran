import { auth } from "@clerk/nextjs/server"

export default async function AuthLayout({ children }: React.PropsWithChildren) {
  await auth.protect()

  return <>{children}</>
}
