"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"
import type { PaymentRow } from "@/lib/admin/rows"
import { PAYMENT_KINDS, PAYMENT_METHODS, type PaymentStatus } from "@/lib/admin/types"
import { conMes } from "@/lib/admin/enlaces"
import { useFormat } from "@/hooks/use-format"
import { AdminTable, type Column, type FilterDef } from "@/components/admin/admin-table"
import { MockAction } from "@/components/admin/mock-action"
import { PlanBadge } from "@/components/admin/plan-badge"
import { INTL_TAG, useCanalResuelto, usePlanName } from "@/components/admin/textos"
import { Badge } from "@/components/ui/badge"

const ESTADO_VARIANT: Record<
  PaymentStatus,
  "success" | "destructive" | "warning" | "outline"
> = {
  aprobado: "success",
  rechazado: "destructive",
  pendiente: "warning",
  reembolsado: "outline",
}

/** Lo urgente arriba: pendiente antes que rechazado, y dentro de cada peso la fecha más reciente. */
const PESO: Record<PaymentStatus, number> = {
  pendiente: 2,
  rechazado: 1,
  aprobado: 0,
  reembolsado: 0,
}

const PLANES_DE_PAGO = ["creator", "business"] as const

/** Acciones por estado. En el arquetipo solo avisan de lo que harían. */
function Acciones({ row }: { row: PaymentRow }) {
  const t = useTranslations("admin.ingresos.table")
  const tLabels = useTranslations("admin.labels")
  const f = useFormat()
  const quien = t("who", { nombre: row.userName, monto: f.money(row.amount) })
  switch (row.status) {
    case "pendiente":
      return (
        <div className="flex justify-end gap-1">
          <MockAction
            size="sm"
            variant="outline"
            efecto={t("approveEffect", {
              pago: row.id,
              quien,
              suscripcion: row.subscriptionId,
            })}
          >
            {t("approve")}
          </MockAction>
          <MockAction
            size="sm"
            variant="ghost"
            efecto={t("rejectEffect", { pago: row.id, quien })}
          >
            {t("reject")}
          </MockAction>
        </div>
      )
    case "rechazado":
      return (
        <div className="flex justify-end">
          <MockAction
            size="sm"
            variant="outline"
            efecto={t("retryEffect", {
              quien,
              metodo: tLabels(`paymentMethod.${row.method}`),
            })}
          >
            {t("retry")}
          </MockAction>
        </div>
      )
    case "aprobado": {
      const comision = f.money(row.comision)
      const efecto =
        row.comision > 0 && row.recompensa > 0
          ? t("refundEffectBoth", { quien, comision })
          : row.comision > 0
            ? t("refundEffectCommission", { quien, comision })
            : row.recompensa > 0
              ? t("refundEffectReward", { quien })
              : t("refundEffect", { quien })
      return (
        <div className="flex justify-end">
          <MockAction size="sm" variant="ghost" efecto={efecto}>
            {t("refund")}
          </MockAction>
        </div>
      )
    }
    default:
      return <span className="block text-right text-xs text-muted-foreground">—</span>
  }
}

const suma = (rows: PaymentRow[], status: PaymentStatus) =>
  rows.filter((r) => r.status === status).reduce((n, r) => n + r.amount, 0)

/**
 * Tabla de pagos de /admin/ingresos. Orden por defecto: pendientes y
 * rechazados fijados arriba y, dentro de cada grupo, los más recientes.
 * Búsqueda, filtros, orden y página viven en la URL.
 */
export function IngresosPagosTable({
  rows,
  mes,
}: {
  rows: PaymentRow[]
  mes?: string | null
}) {
  const t = useTranslations("admin.ingresos.table")
  const tLabels = useTranslations("admin.labels")
  const tTable = useTranslations("admin.table")
  const f = useFormat()
  const locale = useLocale()
  const planName = usePlanName()
  const canal = useCanalResuelto()

  const columns = React.useMemo<Column<PaymentRow>[]>(() => {
    const horaLima = new Intl.DateTimeFormat(INTL_TAG[locale], {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Lima",
    })
    return [
      {
        key: "fecha",
        header: t("date"),
        sortValue: (r) => Date.parse(r.createdAt),
        render: (r) => (
          <>
            <span className="whitespace-nowrap">{f.date(r.createdAt)}</span>
            <span className="block text-xs whitespace-nowrap text-muted-foreground">
              {t("time", { hora: horaLima.format(new Date(r.createdAt)) })}
            </span>
          </>
        ),
      },
      {
        key: "usuario",
        header: t("user"),
        sortValue: (r) => r.userName,
        className: "max-w-48",
        render: (r) => (
          <>
            <Link
              href={conMes(`/admin/usuarios?q=${encodeURIComponent(r.userName)}`, mes)}
              className="block truncate font-medium underline-offset-4 hover:text-primary hover:underline"
            >
              {r.userName}
            </Link>
            <span className="block truncate text-xs text-muted-foreground">
              {r.userEmail}
            </span>
          </>
        ),
      },
      {
        key: "plan",
        header: t("plan"),
        sortValue: (r) => planName(r.plan),
        hideBelow: "sm",
        render: (r) => <PlanBadge plan={r.plan} />,
      },
      {
        key: "tipo",
        header: t("kind"),
        sortValue: (r) => tLabels(`paymentKind.${r.kind}`),
        render: (r) => (
          <>
            <span className="whitespace-nowrap">{tLabels(`paymentKind.${r.kind}`)}</span>
            <span className="block text-xs whitespace-nowrap text-muted-foreground">
              {tLabels(`billing.${r.billing}`)} · {tLabels(`paymentMethod.${r.method}`)}
            </span>
          </>
        ),
      },
      {
        key: "importe",
        header: t("amount"),
        align: "right",
        sortValue: (r) => r.amount,
        render: (r) => <span className="font-medium">{f.money(r.amount)}</span>,
      },
      {
        key: "estado",
        header: t("status"),
        sortValue: (r) => PESO[r.status] * 1e13 + Date.parse(r.createdAt),
        render: (r) => (
          <>
            <Badge variant={ESTADO_VARIANT[r.status]}>
              {tLabels(`paymentStatus.${r.status}`)}
            </Badge>
            {r.status === "rechazado" && r.failureReason && (
              <span className="mt-0.5 block max-w-36 text-xs leading-snug whitespace-normal text-muted-foreground">
                {tLabels(`failureReason.${r.failureReason}`)}
              </span>
            )}
            {r.status === "reembolsado" && r.causaReembolso && (
              <span className="mt-0.5 block max-w-36 text-xs leading-snug whitespace-normal text-muted-foreground">
                {t("probableCause", { causa: t(`cause.${r.causaReembolso}`) })}
              </span>
            )}
          </>
        ),
      },
      {
        key: "atribucion",
        header: t("attribution"),
        sortValue: (r) => canal(r.atribucion),
        hideBelow: "lg",
        className: "max-w-40",
        render: (r) => (
          <>
            <span className="block truncate text-xs" title={canal(r.atribucion)}>
              {canal(r.atribucion)}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {r.comision > 0 || r.recompensa > 0
                ? [
                    r.comision > 0 && t("commission", { monto: f.money(r.comision) }),
                    r.recompensa > 0 && t("reward", { monto: f.money(r.recompensa) }),
                  ]
                    .filter(Boolean)
                    .join(" · ")
                : "—"}
            </span>
          </>
        ),
      },
      {
        key: "acciones",
        header: <span className="sr-only">{tTable("actions")}</span>,
        align: "right",
        render: (r) => <Acciones row={r} />,
      },
    ]
  }, [t, tLabels, tTable, f, locale, planName, canal, mes])

  const filters = React.useMemo<FilterDef<PaymentRow>[]>(
    () => [
      {
        param: "estado",
        label: t("filters.status"),
        options: [
          { value: "todos", label: t("filters.allStatuses") },
          { value: "pendiente", label: t("filters.pendiente") },
          { value: "rechazado", label: t("filters.rechazado") },
          { value: "aprobado", label: t("filters.aprobado") },
          { value: "reembolsado", label: t("filters.reembolsado") },
        ],
        predicate: (r, v) => r.status === v,
      },
      {
        param: "tipo",
        label: t("filters.kind"),
        options: [
          { value: "todos", label: t("filters.allKinds") },
          ...PAYMENT_KINDS.map((k) => ({ value: k, label: tLabels(`paymentKind.${k}`) })),
        ],
        predicate: (r, v) => r.kind === v,
      },
      {
        param: "metodo",
        label: t("filters.method"),
        options: [
          { value: "todos", label: t("filters.allMethods") },
          ...PAYMENT_METHODS.map((m) => ({
            value: m,
            label: tLabels(`paymentMethod.${m}`),
          })),
        ],
        predicate: (r, v) => r.method === v,
      },
      {
        param: "plan",
        label: t("filters.plan"),
        options: [
          { value: "todos", label: t("filters.allPlans") },
          ...PLANES_DE_PAGO.map((p) => ({ value: p, label: planName(p) })),
        ],
        predicate: (r, v) => r.plan === v,
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
          r.userEmail,
          r.id,
          canal(r.atribucion),
          r.failureReason && tLabels(`failureReason.${r.failureReason}`),
          r.causaReembolso && t(`cause.${r.causaReembolso}`),
        ],
      }}
      filters={filters}
      defaultSort={{ key: "estado", dir: "desc" }}
      empty={{ title: t("emptyTitle"), description: t("emptyDescription") }}
      rowClassName={(r) =>
        r.status === "pendiente"
          ? "bg-warning/5"
          : r.status === "rechazado"
            ? "bg-destructive/5"
            : undefined
      }
      summary={(list) =>
        t.rich("summary", {
          b: (chunks) => <strong className="text-foreground">{chunks}</strong>,
          aprobados: f.money(suma(list, "aprobado")),
          pendientes: f.money(suma(list, "pendiente")),
          rechazados: f.money(suma(list, "rechazado")),
          reembolsados: f.money(suma(list, "reembolsado")),
        })
      }
    />
  )
}
