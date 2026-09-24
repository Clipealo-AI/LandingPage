"use client"

import { useTranslations } from "next-intl"

import { ErrorState } from "@/components/shared/error-state"

export default function MarketingError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations("marketing.actions")

  return (
    <ErrorState
      error={error}
      onRetry={reset}
      backHref="/"
      backLabel={t("backHome")}
      className="pt-32"
    />
  )
}
