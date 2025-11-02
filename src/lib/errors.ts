export const throwNextRedirect = (error: unknown) => {
  if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
    throw error
  }
}
