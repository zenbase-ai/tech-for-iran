import Link from "next/link"
import { HStack, VStack } from "@/components/layout/stack"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

/**
 * SignatureNotFound - Custom 404 page for invalid signature IDs.
 *
 * Explains that the signature wasn't found and provides a CTA
 * to sign the letter themselves.
 */
export default function SignatureNotFound() {
  "use memo"

  return (
    <VStack as="main" className="min-h-svh" items="stretch">
      {/* Header */}
      <header className="w-full border-b border-border/50">
        <HStack className="max-w-[700px] mx-auto px-6 py-4" items="center" justify="between">
          <Link
            className="text-sm md:text-base font-bold tracking-[0.1em] uppercase hover:opacity-80 transition-opacity"
            href="/"
          >
            Tech for Iran
          </Link>
          <Button asChild size="sm">
            <Link href="/">Sign the letter</Link>
          </Button>
        </HStack>
      </header>

      {/* Main Content */}
      <VStack
        className="flex-1 max-w-[700px] mx-auto w-full px-6 py-16 md:py-24 gap-8"
        items="center"
        justify="center"
      >
        <VStack className="gap-4 text-center" items="center">
          <h1 className="text-2xl md:text-3xl font-bold">Signature not found</h1>
          <p className="text-muted-foreground max-w-md leading-relaxed">
            This link may be invalid or the signature may have been removed from the letter.
          </p>
        </VStack>

        <Separator className="max-w-md my-4" />

        <VStack className="gap-4 text-center" items="center">
          <p className="text-foreground/90">Join the founders who have signed Tech for Iran.</p>
          <Button asChild size="lg">
            <Link href="/">Sign the letter</Link>
          </Button>
        </VStack>
      </VStack>
    </VStack>
  )
}
