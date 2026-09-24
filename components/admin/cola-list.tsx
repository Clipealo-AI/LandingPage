import type { ReactNode } from "react"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import { useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"
import type { ColaItem } from "@/lib/admin/metrics"
import { conMes } from "@/lib/admin/enlaces"
import { useFormat } from "@/hooks/use-format"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { CountryFlag } from "@/components/shared/country-flag"
import { PlanBadge } from "@/components/admin/plan-badge"
import { SemaforoDot } from "@/components/admin/semaforo"
import { useMotivoCola } from "@/components/admin/textos"

/**
 * «Hoy: colas con importe». Una fila por cosa que hay que cobrar, arreglar o
 * contactar hoy, con el importe al lado. Rojo antes que ámbar, luego importe.
 * Si no hay filas, se dice en voz alta: un panel vacío también informa.
 */
export function ColaList({
  items,
  limit,
  mes,
}: {
  items: ColaItem[]
  limit?: number
  mes?: string | null
}) {
  const t = useTranslations("admin.queues")
  const tMetrics = useTranslations("admin.metrics")
  const tUnits = useTranslations("admin.units")
  const f = useFormat()
  const motivo = useMotivoCola()
  const visibles = limit ? items.slice(0, limit) : items
  const rojas = items.filter((i) => i.semaforo === "rojo").length
  const total = items.reduce((n, i) => n + i.monto, 0)

  if (items.length === 0) {
    return (
      <Empty className="py-10">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CheckCircle2 className="text-success" />
          </EmptyMedia>
          <EmptyTitle>{t("emptyTitle")}</EmptyTitle>
          <EmptyDescription>{t("emptyDescription")}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  const strong = (chunks: ReactNode) => (
    <strong className="font-semibold text-foreground">{chunks}</strong>
  )

  return (
    <div className="space-y-3">
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground tabular-nums">
        <span>{t.rich("urgent", { b: strong, rojas, total: items.length })}</span>
        <span aria-hidden>·</span>
        <span>{t.rich("atStake", { b: strong, monto: f.money(total) })}</span>
      </p>

      <ul className="divide-y rounded-xl bg-card ring-1 ring-border">
        {visibles.map((item) => (
          <li
            key={item.id}
            className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:gap-4"
          >
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <SemaforoDot
                value={item.semaforo}
                className="mt-1 shrink-0 [&>span:last-child]:sr-only"
              />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                  <span className="font-semibold">
                    {tMetrics(`queueTitle.${item.titulo}`)}
                  </span>
                  <span className="text-muted-foreground">·</span>
                  {item.countryCode && (
                    <CountryFlag code={item.countryCode} decorative={false} />
                  )}
                  {item.userId ? (
                    <Link
                      href={conMes(
                        `/admin/usuarios?q=${encodeURIComponent(item.userName)}`,
                        mes
                      )}
                      className="truncate font-medium underline-offset-4 hover:text-primary hover:underline"
                    >
                      {item.userName}
                    </Link>
                  ) : (
                    <span className="truncate font-medium">{item.userName}</span>
                  )}
                  {item.plan && <PlanBadge plan={item.plan} />}
                </p>
                <p className="text-xs text-muted-foreground">
                  {motivo(item.motivo)}
                  {item.antiguedadDias > 0 && (
                    <span> · {tUnits("daysAgo", { n: item.antiguedadDias })}</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
              <span className="font-semibold tabular-nums">
                {item.monto > 0 ? f.money(item.monto) : "—"}
              </span>
              <Button variant="outline" size="sm" asChild>
                <Link href={conMes(item.href, mes)}>
                  {tMetrics(`action.${item.accion}`)} <ArrowRight />
                </Link>
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {limit && items.length > limit && (
        <p className="text-xs text-muted-foreground">
          {t.rich("more", {
            n: items.length - limit,
            link: (chunks) => (
              <Link
                href={conMes("/admin/vencimientos", mes)}
                className="text-primary underline-offset-4 hover:underline"
              >
                {chunks}
              </Link>
            ),
          })}
        </p>
      )}
    </div>
  )
}
