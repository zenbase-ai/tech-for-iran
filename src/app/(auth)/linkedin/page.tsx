import { auth } from "@clerk/nextjs/server"
import { fetchMutation, fetchQuery } from "convex/nextjs"
import Image from "next/image"
import Link from "next/link"
import { RedirectType, redirect } from "next/navigation"
import { LuArrowLeft, LuUserX } from "react-icons/lu"
import { HStack, VStack } from "@/components/layout/stack"
import { Button } from "@/components/ui/button"
import { api } from "@/convex/_generated/api"
import { generateHostedAuthLink } from "@/lib/unipile"

type LinkedInPageParams = {
  searchParams: Promise<{
    account_id?: string
  }>
}

export default async function LinkedInPage({ searchParams }: LinkedInPageParams) {
  const [{ userId }, { account_id }] = await Promise.all([auth(), searchParams])
  if (!userId) {
    return redirect("/")
  }

  if (account_id) {
    await fetchMutation(api.mutations.linkLinkedinAccount, { unipileId: account_id, userId })
  }

  const { account, profile, needsReconnection, isHealthy } = await fetchQuery(
    api.queries.getLinkedinState,
    { userId },
  )

  if (account == null || profile == null || needsReconnection || !isHealthy) {
    return redirect((await generateHostedAuthLink(userId)) as any, RedirectType.push)
  }

  return (
    <VStack items="center" justify="center" className="gap-6">
      <HStack className="gap-4" items="center" justify="center">
        <Image
          src={profile.picture}
          alt={`${profile.firstName} ${profile.lastName}`}
          width={48}
          height={48}
          className="rounded-full mt-1"
        />
        <Link
          href={profile.url as any}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          <h2 className="font-serif text-xl leading-[0.95]">
            {profile.firstName} {profile.lastName}
          </h2>
        </Link>
      </HStack>

      <HStack items="center" justify="evenly" className="gap-4 w-full">
        <Button variant="secondary" size="sm" asChild>
          <Link href="/pods">
            <LuArrowLeft />
            Main
          </Link>
        </Button>

        <Button variant="destructive" size="sm">
          Delete
          <LuUserX />
        </Button>
      </HStack>
    </VStack>
  )
}
