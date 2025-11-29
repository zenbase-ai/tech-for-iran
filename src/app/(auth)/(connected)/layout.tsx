import ConnectedClientLayout from "./layout.client"

export default async function ConnectedLayout({ children }: React.PropsWithChildren) {
  return <ConnectedClientLayout>{children}</ConnectedClientLayout>
}
