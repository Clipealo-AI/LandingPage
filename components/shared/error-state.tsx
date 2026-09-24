"use client"

import * as React from "react"
import { ArrowLeft, RotateCcw, TriangleAlert } from "lucide-react"
import { useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface ErrorStateProps {
  title?: string
  description?: string
  /** El `error` que recibe un `error.tsx` de Next. */
  error?: Error & { digest?: string }
  /** El `reset` de Next: reintenta el render del segmento sin recargar. */
  onRetry?: () => void
  backHref?: string
  backLabel?: string
  className?: string
}

/**
 * Pantalla de error de segmento.
 *
 * El mensaje técnico solo se muestra en desarrollo; en producción se enseña el
 * `digest`, que es lo que sirve para cruzarlo con los logs del servidor sin
 * filtrar detalles internos al usuario.
 */
export function ErrorState({
  title,
  description,
  error,
  onRetry,
  backHref = "/dashboard",
  backLabel,
  className,
}: ErrorStateProps) {
  const t = useTranslations("common")

  React.useEffect(() => {
    if (error) console.error(error)
  }, [error])

  const detalle =
    process.env.NODE_ENV === "development"
      ? error?.message
      : error?.digest && t("errorState.reference", { digest: error.digest })

  return (
    <div
      role="alert"
      className={cn(
        "container-app grid min-h-[60svh] place-content-center gap-5 py-16 text-center",
        className
      )}
    >
      <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-warning/12 text-warning">
        <TriangleAlert className="size-6" aria-hidden />
      </span>

      <div className="space-y-2">
        <h1 className="text-xl font-bold tracking-tight">
          {title ?? t("errorState.title")}
        </h1>
        <p className="mx-auto max-w-md text-sm text-pretty text-muted-foreground">
          {description ?? t("errorState.description")}
        </p>
      </div>

      {detalle && (
        <p className="mx-auto max-w-lg overflow-x-auto rounded-lg bg-muted px-3 py-2 text-left font-mono text-xs text-muted-foreground">
          {detalle}
        </p>
      )}

      <div className="flex flex-wrap justify-center gap-2">
        {onRetry && (
          <Button variant="brand" onClick={onRetry}>
            <RotateCcw /> {t("actions.retry")}
          </Button>
        )}
        <Button variant="outline" asChild>
          <Link href={backHref}>
            <ArrowLeft /> {backLabel ?? t("actions.backToOverview")}
          </Link>
        </Button>
      </div>
    </div>
  )
}
