import type { ReactNode } from "react"
import { CheckCircle2 } from "lucide-react"
import { useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"
import type { CostesBlock } from "@/lib/admin/metrics"
import { conMes } from "@/lib/admin/enlaces"
import { useFormat } from "@/hooks/use-format"
import { MockAction } from "@/components/admin/mock-action"
import { PlanBadge } from "@/components/admin/plan-badge"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

/**
 * Proyectos de los últimos 30 días cuyo coste triplica la mediana o cuyo coste
 * por minuto la dobla. Como mucho ocho, por importe: si hay más, el problema
 * no es un proyecto sino la tarifa.
 */
export function CostesAnomalias({
  items,
  mes,
}: {
  items: CostesBlock["anomalias"]
  mes?: string | null
}) {
  const t = useTranslations("admin.costes.anomalias")
  const tMetrics = useTranslations("admin.metrics")
  const tTable = useTranslations("admin.table")
  const f = useFormat()

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

  const total = items.reduce((n, a) => n + a.cost, 0)
  const strong = (chunks: ReactNode) => (
    <strong className="font-semibold text-foreground">{chunks}</strong>
  )

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground tabular-nums">
        {t.rich("summary", {
          b: strong,
          n: items.length,
          monto: f.money(total, { decimals: 2 }),
        })}
      </p>
      <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-border">
        <Table>
          <caption className="sr-only">{t("caption")}</caption>
          <TableHeader>
            <TableRow>
              <TableHead>{t("project")}</TableHead>
              <TableHead className="text-right">{t("min")}</TableHead>
              <TableHead className="text-right">{t("cost")}</TableHead>
              <TableHead className="text-right max-md:hidden">{t("perMin")}</TableHead>
              <TableHead className="text-right">
                <span className="sr-only">{tTable("actions")}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="tabular-nums">
            {items.map((a) => {
              const motivo = tMetrics(`anomaly.metric.${a.motivo}`)
              return (
                <TableRow key={a.projectId} className="bg-warning/5">
                  <TableCell className="max-w-64">
                    <p className="flex items-center gap-2">
                      <Link
                        href={conMes(
                          `/admin/usuarios?q=${encodeURIComponent(a.userName)}`,
                          mes
                        )}
                        className="truncate font-medium underline-offset-4 hover:text-primary hover:underline"
                      >
                        {a.userName}
                      </Link>
                      <PlanBadge plan={a.userPlan} />
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {f.date(a.createdAt)} · {a.projectId} ·{" "}
                      <span className="text-warning">{motivo}</span>
                    </p>
                  </TableCell>
                  <TableCell className="text-right">
                    {f.number(Math.round(a.minutes))}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {f.money(a.cost, { decimals: 3 })}
                  </TableCell>
                  <TableCell className="text-right max-md:hidden">
                    {f.money(a.costPorMinuto, { decimals: 4 })}
                  </TableCell>
                  <TableCell className="text-right">
                    <MockAction
                      size="sm"
                      variant="ghost"
                      efecto={t("markReviewedEffect", {
                        proyecto: a.projectId,
                        motivo: motivo.toLowerCase(),
                      })}
                    >
                      {t("markReviewed")}
                    </MockAction>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">{t("note")}</p>
    </div>
  )
}
