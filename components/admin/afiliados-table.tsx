"use client"

import * as React from "react"
import { Banknote, Pause, Percent, Play } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { cn } from "@/lib/utils"
import type { AffiliateStats } from "@/lib/admin/metrics"
import { useFormat } from "@/hooks/use-format"
import { AdminTable, type Column, type FilterDef } from "@/components/admin/admin-table"
import { MockAction } from "@/components/admin/mock-action"
import { INTL_TAG } from "@/components/admin/textos"
import { Badge } from "@/components/ui/badge"

type BadgeVariant = React.ComponentProps<typeof Badge>["variant"]
type Alerta = NonNullable<AffiliateStats["alerta"]>

/** Variante de cada alerta; la etiqueta y su explicación salen de `admin.afiliados.alert`. */
export const AFILIADO_ALERTA: Record<Alerta, { variant: BadgeVariant }> = {
  liquidar: { variant: "destructive" },
  calidad: { variant: "warning" },
  fraude: { variant: "destructive" },
}

const PESO_ALERTA: Record<Alerta, number> = { liquidar: 3, fraude: 2, calidad: 1 }

/** Etiqueta de estado del código: verde si atribuye altas, contorno si está en pausa. */
export function AfiliadoEstado({
  status,
}: {
  status: AffiliateStats["affiliate"]["status"]
}) {
  const t = useTranslations("admin.afiliados.status")
  return status === "activo" ? (
    <Badge variant="success">{t("activo")}</Badge>
  ) : (
    <Badge variant="outline" className="text-muted-foreground">
      {t("pausado")}
    </Badge>
  )
}

export function AfiliadoAlerta({ alerta }: { alerta: AffiliateStats["alerta"] }) {
  const t = useTranslations("admin.afiliados.alert")
  if (!alerta) return <span className="text-muted-foreground/60">—</span>
  return (
    <Badge variant={AFILIADO_ALERTA[alerta].variant} title={t(`${alerta}.title`)}>
      {t(`${alerta}.label`)}
    </Badge>
  )
}

/** Acciones del operador sobre un código. `compact` quita el texto de las secundarias. */
export function AfiliadoAcciones({
  row,
  compact = false,
}: {
  row: AffiliateStats
  compact?: boolean
}) {
  const t = useTranslations("admin.afiliados.actions")
  const f = useFormat()
  const { affiliate: a } = row
  const activo = a.status === "activo"
  return (
    <div className={cn("flex items-center gap-1", compact && "justify-end")}>
      {row.comisionPendiente > 0 && (
        <MockAction
          size="sm"
          variant="outline"
          efecto={t("payoutEffect", {
            monto: f.money(row.comisionPendiente),
            nombre: a.name,
            codigo: a.code,
          })}
        >
          <Banknote /> {t("payout")}
        </MockAction>
      )}
      <MockAction
        size="sm"
        variant="ghost"
        aria-label={
          activo
            ? t("pauseAria", { codigo: a.code })
            : t("resumeAria", { codigo: a.code })
        }
        title={activo ? t("pauseTitle") : t("resumeTitle")}
        efecto={
          activo
            ? t("pauseEffect", { codigo: a.code })
            : t("resumeEffect", { codigo: a.code })
        }
      >
        {activo ? <Pause /> : <Play />}
        {compact ? null : activo ? t("pause") : t("resume")}
      </MockAction>
      <MockAction
        size="sm"
        variant="ghost"
        aria-label={t("rateAria", { codigo: a.code })}
        title={t("rateTitle")}
        efecto={t("rateEffect", { codigo: a.code, pct: f.percent(a.commissionPct, 0) })}
      >
        <Percent />
        {compact ? null : t("rate")}
      </MockAction>
    </div>
  )
}

/**
 * Tabla de afiliados: una fila por código con su funnel, su ingreso y su
 * comisión. Las filas llegan calculadas del servidor (`AffiliateStats`);
 * aquí solo se filtran y ordenan, con el estado en la URL. `organico` es la
 * referencia con la que se tiñen activación y conversión.
 */
export function AfiliadosTable({
  rows,
  organico,
}: {
  rows: AffiliateStats[]
  organico: { activacionPct: number | null; conversionPct: number | null }
}) {
  const t = useTranslations("admin.afiliados.table")
  const tAlert = useTranslations("admin.afiliados.alert")
  const tTable = useTranslations("admin.table")
  const tUnits = useTranslations("admin.units")
  const f = useFormat()
  const locale = useLocale()
  const actOrg = organico.activacionPct
  const convOrg = organico.conversionPct

  const filtros = React.useMemo<FilterDef<AffiliateStats>[]>(
    () => [
      {
        param: "estado",
        label: t("filters.status"),
        variant: "toggle",
        options: [
          { value: "todos", label: t("filters.all") },
          { value: "activo", label: t("filters.active") },
          { value: "pausado", label: t("filters.paused") },
        ],
        predicate: (row, v) => row.affiliate.status === v,
      },
      {
        param: "pendiente",
        label: t("filters.pending"),
        variant: "toggle",
        options: [
          { value: "todos", label: t("filters.withAndWithout") },
          { value: "con", label: t("filters.withPending") },
        ],
        predicate: (row) => row.comisionPendiente > 0,
      },
      {
        param: "alerta",
        label: t("filters.alert"),
        variant: "select",
        options: [
          { value: "todos", label: t("filters.anyAlert") },
          { value: "alguna", label: t("filters.withAlert") },
          { value: "liquidar", label: tAlert("liquidar.label") },
          { value: "calidad", label: tAlert("calidad.label") },
          { value: "fraude", label: tAlert("fraude.label") },
          { value: "ninguna", label: t("filters.noAlert") },
        ],
        predicate: (row, v) =>
          v === "alguna"
            ? row.alerta !== null
            : v === "ninguna"
              ? row.alerta === null
              : row.alerta === v,
      },
    ],
    [t, tAlert]
  )

  const columnas = React.useMemo<Column<AffiliateStats>[]>(() => {
    const decimal = new Intl.NumberFormat(INTL_TAG[locale], {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
      useGrouping: false,
    })
    const ratio = (v: number | null) => (v === null ? "—" : `${decimal.format(v)}×`)

    return [
      {
        key: "afiliado",
        header: t("affiliate"),
        render: (r) => (
          <div className="min-w-0">
            <p className="flex items-center gap-2 font-medium">
              <span className="truncate">{r.affiliate.name}</span>
              <AfiliadoEstado status={r.affiliate.status} />
            </p>
            <p
              className="max-w-52 truncate text-xs text-muted-foreground"
              title={r.affiliate.channel}
            >
              <span className="font-mono text-[11px] tracking-wide">
                {r.affiliate.code}
              </span>{" "}
              · {t("commissionPct", { pct: f.percent(r.affiliate.commissionPct, 0) })}
            </p>
          </div>
        ),
        sortValue: (r) => r.affiliate.name,
        className: "max-w-64",
      },
      {
        key: "altas",
        header: (
          <span>
            {t("signups")}{" "}
            <span className="font-normal text-muted-foreground">
              {t("signupsWindow")}
            </span>
          </span>
        ),
        align: "right",
        render: (r) => (
          <>
            <span className="font-medium">{r.altas30d}</span>
            <span className="text-muted-foreground"> / {r.altas}</span>
          </>
        ),
        sortValue: (r) => r.altas30d * 1000 + r.altas,
      },
      {
        key: "activacion",
        header: t("activated"),
        align: "right",
        render: (r) => {
          const bajo =
            r.altas >= 5 &&
            r.activacionPct !== null &&
            actOrg !== null &&
            r.activacionPct < actOrg / 2
          return (
            <Doble
              principal={r.activacionPct === null ? "—" : f.percent(r.activacionPct, 0)}
              secundario={t("ofSignups", { n: r.activadosD7, total: r.altas })}
              className={bajo ? "font-medium text-warning" : undefined}
            />
          )
        },
        sortValue: (r) => r.activacionPct,
      },
      {
        key: "pagantes",
        header: t("payers"),
        align: "right",
        render: (r) => {
          const bajo =
            r.altas >= 5 &&
            r.conversionPct !== null &&
            convOrg !== null &&
            r.conversionPct < convOrg
          return (
            <Doble
              principal={String(r.pagando)}
              secundario={r.conversionPct === null ? "—" : f.percent(r.conversionPct, 1)}
              className={bajo ? "font-medium text-warning" : undefined}
            />
          )
        },
        sortValue: (r) => r.pagando * 1000 + (r.conversionPct ?? 0),
      },
      {
        key: "ingreso",
        header: t("revenue"),
        align: "right",
        render: (r) => (
          <Doble
            principal={f.money(r.ingresoAtribuido)}
            secundario={t("revenue30d", { monto: f.money(r.ingreso30d) })}
          />
        ),
        sortValue: (r) => r.ingresoAtribuido,
      },
      {
        key: "devengada",
        header: t("accrued"),
        align: "right",
        render: (r) => (
          <Doble
            principal={f.money(r.comisionDevengada)}
            secundario={t("paid", { monto: f.money(r.comisionPagada) })}
          />
        ),
        sortValue: (r) => r.comisionDevengada,
        // Con la tabla al ancho de un portátil no cabe; la cifra sigue en el resumen y en el detalle.
        className: "max-2xl:hidden",
      },
      {
        key: "pendiente",
        header: t("pending"),
        align: "right",
        render: (r) => (
          <Doble
            principal={f.money(r.comisionPendiente)}
            secundario={
              r.antiguedadPendienteDias === null
                ? t("upToDate")
                : tUnits("daysAgo", { n: r.antiguedadPendienteDias })
            }
            className={cn(
              r.comisionPendiente > 0 && "font-semibold",
              (r.antiguedadPendienteDias ?? 0) > 30
                ? "text-destructive"
                : r.comisionPendiente > 0
                  ? "text-foreground"
                  : "text-muted-foreground"
            )}
          />
        ),
        sortValue: (r) => r.comisionPendiente,
      },
      {
        key: "roi",
        header: t("roi"),
        align: "right",
        render: (r) => (
          <Doble
            principal={ratio(r.roi)}
            secundario={
              r.ratioComisionPct === null
                ? t("noRevenue")
                : t("ratio", { pct: f.percent(r.ratioComisionPct, 0) })
            }
            className={
              r.ratioComisionPct !== null && r.ratioComisionPct > 50
                ? "font-medium text-warning"
                : undefined
            }
          />
        ),
        sortValue: (r) => r.roi,
      },
      {
        key: "ia",
        header: t("aiNonPaying"),
        align: "right",
        render: (r) => f.money(r.costeIaNoPagantes, { decimals: 2 }),
        sortValue: (r) => r.costeIaNoPagantes,
        className: "max-2xl:hidden",
      },
      {
        key: "alerta",
        header: t("alert"),
        render: (r) => <AfiliadoAlerta alerta={r.alerta} />,
        sortValue: (r) => (r.alerta ? PESO_ALERTA[r.alerta] : 0),
      },
      {
        key: "acciones",
        header: <span className="sr-only">{tTable("actions")}</span>,
        align: "right",
        render: (r) => <AfiliadoAcciones row={r} compact />,
      },
    ]
  }, [actOrg, convOrg, t, tTable, tUnits, f, locale])

  return (
    <AdminTable
      rows={rows}
      columns={columnas}
      rowKey={(r) => r.affiliate.id}
      caption={t("caption")}
      search={{
        placeholder: t("search"),
        keys: (r) => [r.affiliate.name, r.affiliate.code, r.affiliate.channel],
      }}
      filters={filtros}
      defaultSort={{ key: "pendiente", dir: "desc" }}
      empty={{ title: t("emptyTitle"), description: t("emptyDescription") }}
      summary={(list) =>
        t.rich("summary", {
          b: (chunks) => <strong className="text-foreground">{chunks}</strong>,
          pendiente: f.money(list.reduce((n, r) => n + r.comisionPendiente, 0)),
          devengada: f.money(list.reduce((n, r) => n + r.comisionDevengada, 0)),
          ingreso: f.money(list.reduce((n, r) => n + r.ingresoAtribuido, 0)),
          ia: f.money(
            list.reduce((n, r) => n + r.costeIaNoPagantes, 0),
            { decimals: 2 }
          ),
        })
      }
    />
  )
}

/** Celda de dos líneas: la cifra y, debajo, su contexto en gris. */
function Doble({
  principal,
  secundario,
  className,
}: {
  principal: string
  secundario: string
  className?: string
}) {
  return (
    <span className={cn("block leading-tight", className)}>
      {principal}
      <span className="block text-[11px] font-normal text-muted-foreground">
        {secundario}
      </span>
    </span>
  )
}
