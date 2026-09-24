import { useTranslations } from "next-intl"

import { cn } from "@/lib/utils"
import type { Semaforo as SemaforoValue } from "@/lib/admin/metrics"
import { Badge } from "@/components/ui/badge"

const DOT: Record<SemaforoValue, string> = {
  rojo: "bg-destructive",
  ambar: "bg-warning",
  verde: "bg-success",
}
const VARIANT = { rojo: "destructive", ambar: "warning", verde: "success" } as const

/** Punto de color con texto accesible. `label` sustituye al texto por defecto. */
export function SemaforoDot({
  value,
  label,
  className,
}: {
  value: SemaforoValue
  label?: string
  className?: string
}) {
  const t = useTranslations("admin.labels.semaforo")
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs", className)}>
      <span className={cn("size-2 shrink-0 rounded-full", DOT[value])} aria-hidden />
      <span className="sr-only sm:not-sr-only">{label ?? t(value)}</span>
    </span>
  )
}

export function SemaforoBadge({
  value,
  label,
}: {
  value: SemaforoValue
  label?: string
}) {
  const t = useTranslations("admin.labels.semaforo")
  return <Badge variant={VARIANT[value]}>{label ?? t(value)}</Badge>
}
