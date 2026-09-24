"use client"

import * as React from "react"
import { useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"
import type { ProjectRow } from "@/lib/admin/rows"
import { conMes } from "@/lib/admin/enlaces"
import {
  PLAN_IDS,
  PROJECT_SOURCES,
  PROVIDER_LABEL,
  type AiProvider,
} from "@/lib/admin/types"
import { useFormat } from "@/hooks/use-format"
import { AdminTable, type Column, type FilterDef } from "@/components/admin/admin-table"
import { MockAction } from "@/components/admin/mock-action"
import { PlanBadge } from "@/components/admin/plan-badge"
import { usePlanName } from "@/components/admin/textos"
import { Badge } from "@/components/ui/badge"

const ESTADO_VARIANT: Record<
  ProjectRow["status"],
  "success" | "warning" | "destructive"
> = {
  listo: "success",
  procesando: "warning",
  error: "destructive",
}

const Guion = () => <span className="text-muted-foreground">—</span>

/**
 * Proyectos con coste del mes más los errores sin resolver y los atascados,
 * vengan del mes que vengan. Las filas llegan ya ordenadas (sin resolver y
 * anómalos primero, luego coste), y cualquier columna reordena. «Sin
 * resolver» y las horas en cola van dentro de la celda de estado: son
 * estados del proyecto, no dimensiones aparte.
 */
export function CostesTable({ rows, mes }: { rows: ProjectRow[]; mes?: string | null }) {
  const t = useTranslations("admin.costes.table")
  const tLabels = useTranslations("admin.labels")
  const tMetrics = useTranslations("admin.metrics")
  const tTable = useTranslations("admin.table")
  const tAnomalias = useTranslations("admin.costes.anomalias")
  const f = useFormat()
  const planName = usePlanName()

  const columns = React.useMemo<Column<ProjectRow>[]>(() => {
    /** «AssemblyAI US$ 0,011 · Gemini US$ 0,003»: un importe por proveedor, sin bajar al modelo. */
    const desgloseTexto = (row: ProjectRow) => {
      const porProveedor = new Map<AiProvider, number>()
      for (const d of row.desglose)
        porProveedor.set(d.provider, (porProveedor.get(d.provider) ?? 0) + d.amount)
      if (porProveedor.size === 0) return null
      return [...porProveedor.entries()]
        .map(([p, a]) => `${PROVIDER_LABEL[p]} ${f.money(a, { decimals: 3 })}`)
        .join(" · ")
    }
    const fuente = (r: ProjectRow) => tLabels(`source.${r.source}`)

    return [
      {
        key: "fecha",
        header: t("date"),
        render: (r) => <span className="whitespace-nowrap">{f.date(r.createdAt)}</span>,
        sortValue: (r) => r.createdAt,
      },
      {
        key: "usuario",
        header: t("user"),
        render: (r) => (
          <div className="max-w-44">
            <Link
              href={conMes(`/admin/usuarios?q=${encodeURIComponent(r.userName)}`, mes)}
              className="block truncate font-medium underline-offset-4 hover:text-primary hover:underline"
            >
              {r.userName}
            </Link>
            <span className="block truncate text-xs text-muted-foreground">{r.id}</span>
          </div>
        ),
        sortValue: (r) => r.userName,
      },
      {
        key: "plan",
        header: t("plan"),
        render: (r) => <PlanBadge plan={r.userPlan} />,
        sortValue: (r) => PLAN_IDS.indexOf(r.userPlan),
        hideBelow: "md",
      },
      {
        key: "fuente",
        header: t("source"),
        render: fuente,
        sortValue: fuente,
        hideBelow: "md",
      },
      {
        key: "estado",
        header: t("status"),
        render: (r) => (
          <div className="space-y-0.5">
            <Badge variant={ESTADO_VARIANT[r.status]}>{t(`state.${r.status}`)}</Badge>
            {r.sinResolver && (
              <p className="text-xs font-medium text-destructive">{t("unresolved")}</p>
            )}
            {r.horasEnCola !== null && (
              <p
                className={
                  r.horasEnCola > 2
                    ? "text-xs font-medium text-destructive"
                    : "text-xs text-muted-foreground"
                }
              >
                {t("queued", { n: r.horasEnCola })}
              </p>
            )}
          </div>
        ),
        // Sin resolver, luego error, atascado, procesando y listo
        sortValue: (r) =>
          r.sinResolver
            ? 0
            : r.status === "error"
              ? 1
              : r.status === "procesando"
                ? (r.horasEnCola ?? 0) > 2
                  ? 2
                  : 3
                : 4,
      },
      {
        key: "minutos",
        header: t("min"),
        render: (r) => f.number(Math.round(r.minutes)),
        sortValue: (r) => r.minutes,
        align: "right",
      },
      {
        key: "clips",
        header: t("clips"),
        render: (r) => (r.clips > 0 ? f.number(r.clips) : <Guion />),
        sortValue: (r) => r.clips,
        align: "right",
        hideBelow: "lg",
      },
      {
        key: "coste",
        header: t("cost"),
        render: (r) => (
          <span className="font-medium">{f.money(r.cost, { decimals: 3 })}</span>
        ),
        sortValue: (r) => r.cost,
        align: "right",
      },
      {
        key: "costeMin",
        header: t("perMin"),
        render: (r) =>
          r.cost > 0 ? f.money(r.costePorMinuto, { decimals: 4 }) : <Guion />,
        sortValue: (r) => r.costePorMinuto,
        align: "right",
        hideBelow: "lg",
      },
      {
        key: "desglose",
        header: t("breakdown"),
        render: (r) => {
          const texto = desgloseTexto(r)
          return texto ? (
            <span
              className="text-xs text-muted-foreground"
              title={r.desglose
                .map(
                  (d) =>
                    `${PROVIDER_LABEL[d.provider]} ${d.model}: ${f.money(d.amount, { decimals: 4 })}`
                )
                .join(" · ")}
            >
              {texto}
            </span>
          ) : (
            <Guion />
          )
        },
        hideBelow: "xl",
      },
      {
        key: "anomalia",
        header: t("anomaly"),
        render: (r) =>
          r.anomalia ? (
            <span
              className="text-xs font-medium text-warning"
              title={tMetrics(`anomaly.row.${r.anomalia}`)}
            >
              {tMetrics(`anomaly.short.${r.anomalia}`)}
            </span>
          ) : (
            <Guion />
          ),
        sortValue: (r) => (r.anomalia ? 1 : 0),
        hideBelow: "lg",
      },
      {
        key: "acciones",
        header: <span className="sr-only">{tTable("actions")}</span>,
        render: (r) => (
          <div className="flex justify-end gap-1">
            {r.status !== "listo" && (
              <MockAction
                size="sm"
                variant="ghost"
                efecto={t("reprocessEffect", {
                  proyecto: r.id,
                  nombre: r.userName,
                  fuente: fuente(r),
                  minutos: Math.round(r.minutes),
                  monto: f.money(Math.max(r.cost, r.costePorMinuto * r.minutes), {
                    decimals: 3,
                  }),
                })}
              >
                {t("reprocess")}
              </MockAction>
            )}
            {r.anomalia && (
              <MockAction
                size="sm"
                variant="ghost"
                efecto={tAnomalias("markReviewedEffect", {
                  proyecto: r.id,
                  motivo: tMetrics(`anomaly.row.${r.anomalia}`).toLowerCase(),
                })}
              >
                {tAnomalias("markReviewed")}
              </MockAction>
            )}
          </div>
        ),
        align: "right",
      },
    ]
  }, [t, tLabels, tMetrics, tTable, tAnomalias, f, mes])

  const filters = React.useMemo<FilterDef<ProjectRow>[]>(
    () => [
      {
        param: "plan",
        label: t("filters.plan"),
        variant: "select",
        options: [
          { value: "todos", label: t("filters.allPlans") },
          ...PLAN_IDS.map((p) => ({ value: p, label: planName(p) })),
        ],
        predicate: (r, v) => r.userPlan === v,
      },
      {
        param: "fuente",
        label: t("filters.source"),
        variant: "select",
        options: [
          { value: "todos", label: t("filters.allSources") },
          ...PROJECT_SOURCES.map((s) => ({ value: s, label: tLabels(`source.${s}`) })),
        ],
        predicate: (r, v) => r.source === v,
      },
      {
        param: "estado",
        label: t("filters.status"),
        variant: "toggle",
        options: [
          { value: "todos", label: t("filters.all") },
          { value: "listo", label: t("filters.listo") },
          { value: "procesando", label: t("filters.procesando") },
          { value: "error", label: t("filters.error") },
        ],
        predicate: (r, v) => r.status === v,
      },
      {
        param: "solo",
        label: t("filters.incidents"),
        variant: "toggle",
        options: [
          { value: "todos", label: t("filters.all") },
          { value: "anomalos", label: t("filters.anomalous") },
          { value: "errores", label: t("filters.errors") },
        ],
        predicate: (r, v) =>
          v === "anomalos"
            ? r.anomalia !== null
            : v === "errores"
              ? r.status === "error"
              : true,
      },
    ],
    [t, tLabels, planName]
  )

  return (
    <AdminTable
      rows={rows}
      columns={columns}
      rowKey={(r) => r.id}
      caption={t("caption")}
      search={{
        placeholder: t("search"),
        keys: (r) => [
          r.userName,
          r.id,
          tLabels(`source.${r.source}`),
          r.anomalia && tMetrics(`anomaly.row.${r.anomalia}`),
        ],
      }}
      filters={filters}
      pageSize={20}
      empty={{ title: t("emptyTitle"), description: t("emptyDescription") }}
      summary={(list) => {
        const coste = list.reduce((n, r) => n + r.cost, 0)
        const minutos = list
          .filter((r) => r.status === "listo")
          .reduce((n, r) => n + r.minutes, 0)
        const clips = list.reduce((n, r) => n + r.clips, 0)
        const incidencias = list.filter(
          (r) => r.sinResolver || r.anomalia || (r.horasEnCola ?? 0) > 2
        ).length
        return (
          <span>
            {t.rich("summaryCost", {
              b: (chunks) => <strong className="text-foreground">{chunks}</strong>,
              monto: f.money(coste, { decimals: 2 }),
            })}
            {" · "}
            {t("summaryVolume", {
              minutos: f.number(Math.round(minutos)),
              clips: f.number(clips),
            })}
            {minutos > 0 && (
              <>
                {" "}
                ·{" "}
                {t("summaryPerMinute", {
                  monto: f.money(coste / minutos, { decimals: 4 }),
                })}
              </>
            )}
            {" · "}
            <span className={incidencias > 0 ? "text-destructive" : undefined}>
              {t("summaryIncidents", { n: incidencias })}
            </span>
          </span>
        )
      }}
      rowClassName={(r) =>
        r.sinResolver ? "bg-destructive/5" : r.anomalia ? "bg-warning/5" : undefined
      }
    />
  )
}
