"use client"

import { toast } from "sonner"
import { HStack, VStack } from "@/components/layout/stack"
import { Button } from "@/components/ui/button"

export default function TestToastPage() {
  return (
    <VStack className="gap-4">
      <h1 className="text-2xl font-bold">Toast Test Page</h1>

      <HStack wrap items="center" className="gap-4">
        <Button
          onClick={() => toast("Default toast message")}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Default
        </Button>

        <Button
          onClick={() => toast.success("Success! Operation completed successfully.")}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Success
        </Button>

        <Button
          onClick={() => toast.info("Info: Here's some information for you.")}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Info
        </Button>

        <Button
          onClick={() => toast.error("Error! Something went wrong.")}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Error
        </Button>

        <Button
          onClick={() => toast.warning("Warning: Please be careful!")}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          Warning
        </Button>

        <Button
          onClick={() =>
            toast.promise(new Promise((resolve) => setTimeout(resolve, 20_000)), {
              loading: "Loading...",
              success: "Data loaded successfully!",
              error: "Failed to load data",
            })
          }
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Promise
        </Button>
      </HStack>
    </VStack>
  )
}
