"use client"

import { ErrorState } from "@/components/common"

export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  return <ErrorState error={error} onRetry={reset} />
}
