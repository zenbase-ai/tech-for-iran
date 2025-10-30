import { LuOctagonX } from "react-icons/lu"
import { VStack } from "@/components/layout/stack"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { DisconnectForm } from "./disconnect/form"
import { ProfileForm } from "./profile/form"

export type LinkedinPageProps = {
  searchParams: Promise<{
    connectionError?: string
  }>
}

export default async function LinkedinPage({ searchParams }: LinkedinPageProps) {
  const { connectionError } = await searchParams

  return (
    <VStack className="px-2 w-screen max-w-[640px] gap-8 mx-auto">
      {connectionError && (
        <Alert variant="destructive">
          <LuOctagonX className="size-4" />
          <AlertTitle>Connection Error</AlertTitle>
          <AlertDescription>
            Something went wrong while connecting your LinkedIn account. Please try again.
          </AlertDescription>
        </Alert>
      )}

      <h1 className="text-2xl font-bold mb-2 font-serif italic">LinkedIn Settings</h1>

      <ProfileForm />

      <Separator className="my-8" />

      <DisconnectForm />
    </VStack>
  )
}
