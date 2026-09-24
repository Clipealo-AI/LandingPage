import { CheckCircle2 } from "lucide-react"
import { useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import type { ClientesBlock } from "@/lib/admin/metrics"
import { conMes } from "@/lib/admin/enlaces"
import { useFormat } from "@/hooks/use-format"
import { PlanBadge } from "@/components/admin/plan-badge"
import { useMotivoBaja } from "@/components/admin/textos"
import { Badge } from "@/components/ui/badge"
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

const CHURN_3M_ALERTA_PCT = 10

/**
 * Bajas del mes con nombre y motivo. Con menos de veinte clientes, «22 %»
 * dice menos que «Lucía Peña, Empresa, Yape agotado»: se enseñan las dos
 * cosas y, al lado, si el problema es de cobro o de producto.
 */
export function VencimientosBajas({
  clientes,
  mes,
}: {
  clientes: ClientesBlock
  mes?: string | null
}) {
  const t = useTranslations("admin.vencimientos.churn")
  const f = useFormat()
  const motivoBaja = useMotivoBaja()
  const { churn, bajas, nInicio } = clientes
  const dunning = churn.involuntarioPct !== null && churn.involuntarioPct > 50

  const stats: {
    id: string
    label: string
    value: string
    hint: string
    alerta?: boolean
  }[] = [
    {
      id: "bajas",
      label: t("stats.churn"),
      value: t("stats.churnValue", { bajas, inicio: nInicio }),
      hint:
        churn.pct === null
          ? t("stats.churnNone")
          : t("stats.churnPct", { pct: f.percent(churn.pct, 1) }),
    },
    {
      id: "media",
      label: t("stats.churn3m"),
      value: churn.pct3m === null ? "—" : f.percent(churn.pct3m, 1),
      hint: t("stats.churn3mHint", { pct: f.percent(CHURN_3M_ALERTA_PCT, 0) }),
      alerta: churn.pct3m !== null && churn.pct3m > CHURN_3M_ALERTA_PCT,
    },
    {
      id: "tipo",
      label: t("stats.split"),
      value: `${churn.voluntarias} · ${churn.involuntarias}`,
      hint:
        churn.involuntarioPct === null
          ? t("stats.splitNone")
          : dunning
            ? t("stats.splitCharge", { pct: f.percent(churn.involuntarioPct, 0) })
            : t("stats.splitProduct", { pct: f.percent(churn.involuntarioPct, 0) }),
    },
    {
      id: "mrr",
      label: t("stats.lost"),
      value: f.money(churn.mrrPerdido),
      hint: t("stats.lostHint"),
    },
  ]

  return (
    <div className="space-y-4">
      <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.id}
            className={cn(
              "rounded-xl bg-card p-3 ring-1",
              s.alerta ? "ring-destructive/50" : "ring-border"
            )}
          >
            <dt className="text-xs font-medium text-muted-foreground">{s.label}</dt>
            <dd
              className={cn(
                "mt-1 text-xl font-bold tracking-tight tabular-nums",
                s.alerta && "text-destructive"
              )}
            >
              {s.value}
            </dd>
            <dd className="mt-0.5 text-xs text-muted-foreground">{s.hint}</dd>
          </div>
        ))}
      </dl>

      {churn.nominal.length === 0 ? (
        <Empty className="py-10">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CheckCircle2 className="text-success" />
            </EmptyMedia>
            <EmptyTitle>{t("emptyTitle")}</EmptyTitle>
            <EmptyDescription>{t("emptyDescription")}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-border">
            <Table>
              <caption className="sr-only">{t("caption")}</caption>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("user")}</TableHead>
                  <TableHead>{t("plan")}</TableHead>
                  <TableHead>{t("reason")}</TableHead>
                  <TableHead className="text-right">{t("mrr")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="tabular-nums">
                {churn.nominal.map((b) => {
                  const voluntaria =
                    churn.motivos.find((m) => m.motivo === b.motivo)?.voluntaria ?? false
                  return (
                    <TableRow key={`${b.userId}-${b.motivo}`}>
                      <TableCell className="max-w-48">
                        <Link
                          href={conMes(
                            `/admin/usuarios?q=${encodeURIComponent(b.userName)}`,
                            mes
                          )}
                          className="block truncate font-medium underline-offset-4 hover:text-primary hover:underline"
                        >
                          {b.userName}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <PlanBadge plan={b.plan} />
                      </TableCell>
                      <TableCell className="whitespace-normal">
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span>{motivoBaja(b.motivo)}</span>
                          <Badge
                            variant={voluntaria ? "secondary" : "warning"}
                            className="font-normal"
                          >
                            {voluntaria ? t("voluntary") : t("involuntary")}
                          </Badge>
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {f.money(b.mrr)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          <div className="rounded-xl bg-card p-4 ring-1 ring-border">
            <h3 className="text-sm font-bold">{t("reasonsTitle")}</h3>
            <p className="text-xs text-muted-foreground">{t("reasonsDescription")}</p>
            <ul className="mt-3 divide-y">
              {churn.motivos.map((m) => (
                <li
                  key={m.motivo}
                  className="flex items-center justify-between gap-3 py-2 text-sm"
                >
                  <span className="min-w-0">
                    <span className="block truncate">{motivoBaja(m.motivo)}</span>
                    <span className="block text-xs text-muted-foreground">
                      {t("reasonCount", {
                        tipo: m.voluntaria ? t("voluntary") : t("involuntary"),
                        n: m.n,
                      })}
                    </span>
                  </span>
                  <span className="shrink-0 font-medium tabular-nums">
                    {f.money(m.mrr)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
