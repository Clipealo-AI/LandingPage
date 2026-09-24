"use client"

import { useTranslations } from "next-intl"

import { ErrorState } from "@/components/shared/error-state"

export default function StudioError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations("app.studio.error")
  return (
    <ErrorState
      title={t("title")}
      description={t("description")}
      error={error}
      onRetry={reset}
      backHref="/proyectos"
      backLabel={t("back")}
    />
  )
}
