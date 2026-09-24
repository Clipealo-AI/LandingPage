"use client"

import * as React from "react"
import { useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import type { ReferralRow } from "@/lib/admin/rows"
import { REFERRAL_STATUSES } from "@/lib/admin/types"
import { conMes } from "@/lib/admin/enlaces"
import { useFormat } from "@/hooks/use-format"
import { AdminTable, type Column, type FilterDef } from "@/components/admin/admin-table"
import { MockAction } from "@/components/admin/mock-action"
import { PlanBadge } from "@/components/admin/plan-badge"
import { Badge } from "@/components/ui/badge"

const ESTADO_VARIANT: Record<ReferralRow["status"], "outline" | "secondary" | "default"> =
  {
    registrado: "outline",
    activado: "secondary",
    convertido: "default",
  }

const RECOMPENSA_VARIANT: Record<
  ReferralRow["rewardEstado"],
  "warning" | "success" | "outline"
> = {
  pendiente: "warning",
  otorgada: "success",
  "no-procede": "outline",
}

const RECOMPENSA_ORDEN: Record<ReferralRow["rewardEstado"], number> = {
  pendiente: 0,
  otorgada: 1,
  "no-procede": 2,
}
const RECOMPENSAS = Object.keys(RECOMPENSA_ORDEN) as ReferralRow["rewardEstado"][]

const DIA_MS = 86_400_000
const diasDesde = (iso: string, hoy: Date) =>
  Math.max(0, Math.round((hoy.getTime() - new Date(iso).getTime()) / DIA_MS))

function enlaceUsuario(nombre: string, mes?: string | null) {
  return conMes(`/admin/usuarios?q=${encodeURIComponent(nombre)}`, mes)
}

/**
 * Una fila por invitado. Las filas llegan ya ordenadas del servidor:
 * recompensas pendientes por antigüedad y después los atascados, así que la
 * tabla no impone un orden por defecto y solo reordena si el operador lo pide.
 * Para caber en un portátil, cada celda apila dos datos: estado + atascado,
 * recompensa + minutos, activación + conversión.
 */
export function ReferidosTable({
  rows,
  hoy,
  slaDias,
  mes,
}: {
  rows: ReferralRow[]
  hoy: string
  slaDias: number
  /** El mes elegido en el backoffice, para que los enlaces no lo pierdan. */
  mes?: string | null
}) {
  const t = useTranslations("admin.referidos.table")
  const tLabels = useTranslations("admin.labels")
  const tTable = useTranslations("admin.table")
  const tUnits = useTranslations("admin.units")
  const f = useFormat()
  const ahora = React.useMemo(() => new Date(hoy), [hoy])

  const filtros = React.useMemo<FilterDef<ReferralRow>[]>(
    () => [
      {
        param: "estado",
        label: t("filters.status"),
        variant: "select",
        options: [
          { value: "todos", label: t("filters.anyStatus") },
          ...REFERRAL_STATUSES.map((s) => ({
            value: s,
            label: tLabels(`referralStatus.${s}`),
          })),
        ],
        predicate: (r, v) => r.status === v,
      },
      {
        param: "recompensa",
        label: t("filters.reward"),
        variant: "select",
        options: [
          { value: "todos", label: t("filters.anyReward") },
          ...RECOMPENSAS.map((e) => ({ value: e, label: t(`rewardState.${e}`) })),
        ],
        predicate: (r, v) => r.rewardEstado === v,
      },
      {
        param: "atascados",
        label: t("filters.stuck"),
        variant: "toggle",
        options: [
          { value: "todos", label: t("filters.all") },
          { value: "si", label: t("filters.stuck") },
        ],
        predicate: (r) => r.atascado,
      },
    ],
    [t, tLabels]
  )

  const columns = React.useMemo<Column<ReferralRow>[]>(
    () => [
      {
        key: "invitador",
        header: t("referrer"),
        sortValue: (r) => r.referrerName,
        className: "max-w-44",
        render: (r) => (
          <div className="flex min-w-0 flex-col items-start gap-1">
            <Link
              href={enlaceUsuario(r.referrerName, mes)}
              className="block max-w-full truncate font-medium underline-offset-4 hover:text-primary hover:underline"
            >
              {r.referrerName}
            </Link>
            <PlanBadge plan={r.referrerPlan} />
          </div>
        ),
      },
      {
        key: "invitado",
        header: t("invitee"),
        sortValue: (r) => r.referredName,
        className: "max-w-48",
        render: (r) => (
          <div className="min-w-0">
            <Link
              href={enlaceUsuario(r.referredName, mes)}
              className="block truncate font-medium underline-offset-4 hover:text-primary hover:underline"
            >
              {r.referredName}
            </Link>
            <span className="block truncate text-xs text-muted-foreground">
              {r.referredEmail}
            </span>
          </div>
        ),
      },
      {
        key: "registro",
        header: t("signup"),
        sortValue: (r) => r.createdAt,
        hideBelow: "lg",
        render: (r) => (
          <span className="text-xs text-muted-foreground">{f.date(r.createdAt)}</span>
        ),
      },
      {
        key: "estado",
        header: t("status"),
        sortValue: (r) => REFERRAL_STATUSES.indexOf(r.status) * 10 + (r.atascado ? 0 : 1),
        render: (r) => (
          <div className="flex flex-col items-start gap-1">
            <Badge variant={ESTADO_VARIANT[r.status]}>
              {tLabels(`referralStatus.${r.status}`)}
            </Badge>
            {r.atascado && (
              <Badge variant="warning">
                {t("notActivated", { n: diasDesde(r.createdAt, ahora) })}
              </Badge>
            )}
          </div>
        ),
      },
      {
        key: "hitos",
        header: t("milestones"),
        sortValue: (r) => r.convertidoAt ?? r.activadoAt ?? null,
        hideBelow: "xl",
        render: (r) =>
          r.activadoAt || r.convertidoAt ? (
            <div className="space-y-0.5 text-xs text-muted-foreground">
              {r.activadoAt && (
                <p>
                  {t.rich("activatedOn", {
                    fecha: f.date(r.activadoAt),
                    date: (chunks) => <span className="text-foreground">{chunks}</span>,
                  })}
                </p>
              )}
              {r.convertidoAt && (
                <p>
                  {t.rich("convertedOn", {
                    fecha: f.date(r.convertidoAt),
                    date: (chunks) => <span className="text-foreground">{chunks}</span>,
                  })}
                </p>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        key: "recompensa",
        header: t("reward"),
        sortValue: (r) => RECOMPENSA_ORDEN[r.rewardEstado],
        render: (r) => (
          <div className="flex flex-col items-start gap-0.5">
            <Badge variant={RECOMPENSA_VARIANT[r.rewardEstado]}>
              {t(`rewardState.${r.rewardEstado}`)}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {t("rewardDetail", {
                minutos: r.rewardMinutes,
                monto: f.money(r.rewardValor, { decimals: 2 }),
              })}
            </span>
          </div>
        ),
      },
      {
        key: "antiguedad",
        header: t("age"),
        align: "right",
        sortValue: (r) => r.antiguedadPendienteDias,
        render: (r) =>
          r.antiguedadPendienteDias === null ? (
            <span className="text-muted-foreground">—</span>
          ) : (
            <span
              className={cn(
                "font-semibold",
                r.antiguedadPendienteDias > slaDias ? "text-destructive" : "text-warning"
              )}
            >
              {tUnits("days", { n: r.antiguedadPendienteDias })}
            </span>
          ),
      },
      {
        key: "ingreso",
        header: t("revenue"),
        align: "right",
        sortValue: (r) => r.ingresoInvitado,
        render: (r) =>
          r.ingresoInvitado > 0 ? (
            <span className="font-medium">{f.money(r.ingresoInvitado)}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        key: "acciones",
        header: <span className="sr-only">{tTable("actions")}</span>,
        align: "right",
        render: (r) => {
          if (r.rewardEstado === "pendiente") {
            return (
              <div className="flex flex-col items-end gap-1">
                <MockAction
                  size="sm"
                  variant="outline"
                  efecto={t("grantEffect", {
                    minutos: r.rewardMinutes,
                    nombre: r.referrerName,
                  })}
                >
                  {t("grant")}
                </MockAction>
                <MockAction
                  size="sm"
                  variant="ghost"
                  efecto={t("notApplicableEffect", { nombre: r.referrerName })}
                >
                  {t("notApplicable")}
                </MockAction>
              </div>
            )
          }
          if (r.status === "registrado") {
            return (
              <div className="flex justify-end">
                <MockAction
                  size="sm"
                  variant="ghost"
                  efecto={t("remindEffect", { nombre: r.referredName })}
                >
                  {t("remind")}
                </MockAction>
              </div>
            )
          }
          return null
        },
      },
    ],
    [ahora, slaDias, t, tLabels, tTable, tUnits, f, mes]
  )

  return (
    <AdminTable
      rows={rows}
      columns={columns}
      rowKey={(r) => r.id}
      caption={t("caption")}
      search={{
        placeholder: t("search"),
        keys: (r) => [r.referrerName, r.referredName, r.referredEmail],
      }}
      filters={filtros}
      pageSize={20}
      empty={{ title: t("emptyTitle"), description: t("emptyDescription") }}
      summary={(list) => {
        const convertidos = list.filter((r) => r.status === "convertido").length
        const pendientes = list.filter((r) => r.rewardEstado === "pendiente")
        const valorPendiente = pendientes.reduce((n, r) => n + r.rewardValor, 0)
        const ingreso = list.reduce((n, r) => n + r.ingresoInvitado, 0)
        return t.rich("summary", {
          b: (chunks) => <strong className="text-foreground">{chunks}</strong>,
          convertidos,
          pendientes: pendientes.length,
          valor: f.money(valorPendiente, { decimals: 2 }),
          ingreso: f.money(ingreso),
        })
      }}
      rowClassName={(r) =>
        r.rewardEstado === "pendiente"
          ? (r.antiguedadPendienteDias ?? 0) > slaDias
            ? "bg-destructive/5 hover:bg-destructive/10"
            : "bg-warning/5 hover:bg-warning/10"
          : undefined
      }
    />
  )
}
