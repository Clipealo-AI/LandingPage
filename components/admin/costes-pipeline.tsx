import { useTranslations } from "next-intl"

import { cn } from "@/lib/utils"
import type { PipelineBlock } from "@/lib/admin/metrics"
import { useFormat } from "@/hooks/use-format"
import { MockAction } from "@/components/admin/mock-action"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

function Stat({
  label,
  value,
  sub,
  tone = "neutral",
}: {
  label: string
  value: string
  sub?: string
  tone?: "neutral" | "aviso" | "alerta"
}) {
  return (
    <div className="min-w-0 rounded-xl bg-card p-3 ring-1 ring-border">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 text-xl font-bold tracking-tight tabular-nums",
          tone === "alerta" && "text-destructive",
          tone === "aviso" && "text-warning"
        )}
      >
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">{sub}</p>}
    </div>
  )
}

/**
 * Salud del pipeline: tasa de error a 24 h y 7 d, lo que sigue roto, lo que
 * lleva más de dos horas en cola y el dinero quemado en errores. Debajo, la
 * tasa de error por fuente (solo con cinco proyectos o más de denominador).
 */
export function CostesPipeline({ pipeline }: { pipeline: PipelineBlock }) {
  const t = useTranslations("admin.costes.pipeline")
  const tLabels = useTranslations("admin.labels")
  const tTable = useTranslations("admin.table")
  const f = useFormat()
  const pctOrDash = (v: number | null, decimals = 1) =>
    v === null ? "—" : f.percent(v, decimals)
  const {
    err24h,
    err7d,
    sinResolver,
    sinResolverDePago,
    atascados,
    falloPrimerProyectoPct,
    costeEnErrores7d,
    porFuente7d,
  } = pipeline
  const rojo24 = (err24h.pct !== null && err24h.pct > 5) || err24h.n >= 3

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat
          label={t("stats.errors24h")}
          value={pctOrDash(err24h.pct)}
          sub={t("stats.ofProjects", { n: err24h.n, total: err24h.total })}
          tone={rojo24 ? "alerta" : "neutral"}
        />
        <Stat
          label={t("stats.errors7d")}
          value={pctOrDash(err7d.pct)}
          sub={t("stats.ofProjects", { n: err7d.n, total: err7d.total })}
          tone={err7d.pct !== null && err7d.pct > 5 ? "aviso" : "neutral"}
        />
        <Stat
          label={t("stats.errorCost")}
          value={f.money(costeEnErrores7d.monto, { decimals: 2 })}
          sub={t("stats.errorCostPct", { pct: pctOrDash(costeEnErrores7d.pct) })}
          tone={
            costeEnErrores7d.pct !== null && costeEnErrores7d.pct > 5
              ? "alerta"
              : "neutral"
          }
        />
        <Stat
          label={t("stats.unresolved")}
          value={String(sinResolver)}
          sub={t("stats.unresolvedPaying", { n: sinResolverDePago })}
          tone={sinResolverDePago > 0 ? "alerta" : sinResolver > 0 ? "aviso" : "neutral"}
        />
        <Stat
          label={t("stats.stuck")}
          value={String(atascados)}
          sub={t("stats.stuckHint")}
          tone={atascados > 0 ? "aviso" : "neutral"}
        />
        <Stat
          label={t("stats.firstFail")}
          value={pctOrDash(falloPrimerProyectoPct)}
          sub={t("stats.firstFailHint")}
          tone={
            falloPrimerProyectoPct !== null && falloPrimerProyectoPct > 10
              ? "alerta"
              : "neutral"
          }
        />
      </div>

      <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-border">
        <Table>
          <caption className="sr-only">{t("table.caption")}</caption>
          <TableHeader>
            <TableRow>
              <TableHead>{t("table.source")}</TableHead>
              <TableHead className="text-right">{t("table.projects")}</TableHead>
              <TableHead className="text-right">{t("table.errors")}</TableHead>
              <TableHead className="text-right">{t("table.rate")}</TableHead>
              <TableHead className="text-right">
                <span className="sr-only">{tTable("actions")}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="tabular-nums">
            {porFuente7d.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                  {t("table.empty")}
                </TableCell>
              </TableRow>
            )}
            {porFuente7d.map((fuente) => {
              const grave = fuente.pct !== null && fuente.pct > 20
              const nombre = tLabels(`source.${fuente.source}`)
              return (
                <TableRow key={fuente.source}>
                  <TableCell className="font-medium">{nombre}</TableCell>
                  <TableCell className="text-right">{fuente.n}</TableCell>
                  <TableCell
                    className={cn(
                      "text-right",
                      fuente.errores > 0 && "font-medium text-destructive"
                    )}
                  >
                    {fuente.errores}
                  </TableCell>
                  <TableCell
                    className={cn("text-right", grave && "font-medium text-destructive")}
                  >
                    {fuente.pct === null ? (
                      <span className="text-muted-foreground" title={t("table.noRate")}>
                        —
                      </span>
                    ) : (
                      f.percent(fuente.pct, 0)
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {grave && (
                      <MockAction
                        size="sm"
                        variant="ghost"
                        efecto={t("table.disableEffect", { fuente: nombre })}
                      >
                        {t("table.disable")}
                      </MockAction>
                    )}
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
