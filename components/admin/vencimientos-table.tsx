"use client"

import * as React from "react"
import { useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import type { RenewalItem, Semaforo } from "@/lib/admin/metrics"
import { conMes } from "@/lib/admin/enlaces"
import {
  PAYMENT_METHODS,
  PLAN_IDS,
  type PaymentStatus,
  type PlanId,
} from "@/lib/admin/types"
import { useFormat } from "@/hooks/use-format"
import { AdminTable, type Column, type FilterDef } from "@/components/admin/admin-table"
import { CountryFlag } from "@/components/shared/country-flag"
import { MockAction } from "@/components/admin/mock-action"
import { PlanBadge } from "@/components/admin/plan-badge"
import { SemaforoDot } from "@/components/admin/semaforo"
import { useMotivoCola, usePlanName } from "@/components/admin/textos"
import { Badge } from "@/components/ui/badge"

type Cola = RenewalItem["cola"]

const COLA_ORDER: Cola[] = ["pendiente", "rechazado", "vencida", "proxima", "inactivo"]
const PESO: Record<Semaforo, number> = { rojo: 0, ambar: 1, verde: 2 }
const SEMAFOROS: Semaforo[] = ["rojo", "ambar", "verde"]
const ESTADO_PAGO_CLASS: Record<PaymentStatus, string> = {
  aprobado: "text-success",
  rechazado: "text-destructive",
  pendiente: "text-warning",
  reembolsado: "text-muted-foreground",
}
const PLANES_DE_PAGO = PLAN_IDS.filter(
  (p): p is Exclude<PlanId, "free" | "interno"> => p !== "free" && p !== "interno"
)

/**
 * Tabla de trabajo de vencimientos: una fila por suscripción en alguna cola.
 * Búsqueda, filtros, orden y página viven en la URL; `updatedAt` es «hoy»
 * para que la última actividad se pinte igual en servidor y en cliente.
 * Los títulos de cola son los mismos que en las colas del panel: quien llega
 * desde allí reconoce la fila.
 */
export function VencimientosTable({
  rows,
  updatedAt,
  mes,
}: {
  rows: RenewalItem[]
  updatedAt: string
  /** El mes elegido en el backoffice, para que los enlaces no lo pierdan. */
  mes?: string | null
}) {
  const t = useTranslations("admin.vencimientos.table")
  // Solo las ramas que toca: pedir `admin` entero obliga a mandar sus 90 KB
  const tLabels = useTranslations("admin.labels")
  const tMetrics = useTranslations("admin.metrics")
  const f = useFormat()
  const planName = usePlanName()
  const motivo = useMotivoCola()

  /**
   * `AdminTable` usa los filtros como clave de su estado de URL y necesita la
   * misma referencia en cada render. El parámetro `cola` es el que enlaza el
   * panel (`?cola=proxima`, `?cola=inactivo`).
   */
  const filters = React.useMemo<FilterDef<RenewalItem>[]>(
    () => [
      {
        param: "cola",
        label: t("filters.queue"),
        variant: "toggle",
        options: [
          { value: "todos", label: t("filters.allQueues") },
          ...COLA_ORDER.map((c) => ({ value: c, label: t(`queueFilter.${c}`) })),
        ],
        predicate: (r, v) => r.cola === v,
      },
      {
        param: "semaforo",
        label: t("filters.priority"),
        variant: "select",
        options: [
          { value: "todos", label: t("filters.anyPriority") },
          ...SEMAFOROS.map((s) => ({ value: s, label: tLabels(`semaforo.${s}`) })),
        ],
        predicate: (r, v) => r.semaforo === v,
      },
      {
        param: "plan",
        label: t("filters.plan"),
        variant: "select",
        options: [
          { value: "todos", label: t("filters.allPlans") },
          ...PLANES_DE_PAGO.map((p) => ({ value: p, label: planName(p) })),
        ],
        predicate: (r, v) => r.plan === v,
      },
      {
        param: "metodo",
        label: t("filters.method"),
        variant: "select",
        options: [
          { value: "todos", label: t("filters.allMethods") },
          ...PAYMENT_METHODS.map((m) => ({
            value: m,
            label: tLabels(`paymentMethod.${m}`),
          })),
        ],
        predicate: (r, v) => r.method === v,
      },
    ],
    [t, tLabels, planName]
  )

  const columns = React.useMemo<Column<RenewalItem>[]>(() => {
    const hoy = new Date(updatedAt)
    /** «en 5 d» · «hoy» · «vencida hace 3 d». Negativo = ya venció. */
    const diasLabel = (d: number) =>
      d === 0 ? t("today") : d > 0 ? t("inDays", { n: d }) : t("lapsedAgo", { n: -d })

    return [
      {
        key: "prioridad",
        header: <span className="sr-only">{t("priority")}</span>,
        // Rojo primero y, dentro de cada color, lo que vence antes.
        sortValue: (r) => PESO[r.semaforo] * 1000 + r.diasRestantes,
        className: "w-8 pr-0",
        render: (r) => (
          <span title={tLabels(`semaforo.${r.semaforo}`)}>
            <SemaforoDot value={r.semaforo} className="[&>span:last-child]:sr-only" />
          </span>
        ),
      },
      {
        key: "cola",
        header: t("queue"),
        sortValue: (r) => COLA_ORDER.indexOf(r.cola),
        render: (r) => (
          <div className="max-w-52 min-w-0">
            <p className="font-medium">{tMetrics(`queueTitle.${r.cola}`)}</p>
            <p
              className="truncate text-xs text-muted-foreground"
              title={motivo(r.motivo)}
            >
              {motivo(r.motivo)}
            </p>
          </div>
        ),
      },
      {
        key: "usuario",
        header: t("user"),
        sortValue: (r) => r.userName,
        render: (r) => (
          <div className="max-w-44 min-w-0">
            <Link
              href={conMes(`/admin/usuarios?q=${encodeURIComponent(r.userName)}`, mes)}
              className="flex items-center gap-1.5 truncate font-medium underline-offset-4 hover:text-primary hover:underline"
            >
              <CountryFlag code={r.countryCode} decorative={false} />
              <span className="truncate">{r.userName}</span>
            </Link>
            <span className="block truncate text-xs text-muted-foreground">
              {r.userEmail}
            </span>
          </div>
        ),
      },
      {
        key: "plan",
        header: t("plan"),
        sortValue: (r) => PLAN_IDS.indexOf(r.plan),
        render: (r) => <PlanBadge plan={r.plan} />,
      },
      {
        key: "importe",
        header: t("amount"),
        align: "right",
        sortValue: (r) => r.amount,
        render: (r) => (
          <div>
            <p className="font-medium">{f.money(r.amount)}</p>
            <p className="text-xs text-muted-foreground">
              {t("amountSub", { billing: r.billing, mrr: f.money(r.mrr) })}
            </p>
          </div>
        ),
      },
      {
        key: "renovacion",
        header: t("renewal"),
        sortValue: (r) => r.diasRestantes,
        render: (r) => (
          <div>
            <p>{f.date(r.renewsAt)}</p>
            <p
              className={cn(
                "text-xs",
                r.diasRestantes < 0
                  ? "text-destructive"
                  : r.diasRestantes <= 7
                    ? "text-warning"
                    : "text-muted-foreground"
              )}
            >
              {diasLabel(r.diasRestantes)}
            </p>
          </div>
        ),
      },
      {
        key: "senales",
        header: t("signals"),
        className: "whitespace-normal",
        render: (r) =>
          r.senales.length > 0 ? (
            <div className="flex max-w-52 flex-wrap gap-1">
              {r.senales.map((s) => (
                <Badge
                  key={s}
                  variant="outline"
                  className="h-auto py-0 text-[11px] font-normal"
                >
                  {tMetrics(`signal.${s}`)}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      // Las dos columnas de contexto (pago e intentos, actividad y proyectos)
      // solo caben a partir de 2xl; por debajo, sus señales ya están en «Señales».
      {
        key: "ultimoPago",
        header: t("lastPayment"),
        className: "max-2xl:hidden",
        sortValue: (r) => r.ultimoPago?.createdAt ?? null,
        render: (r) =>
          r.ultimoPago ? (
            <div>
              <p>{f.date(r.ultimoPago.createdAt)}</p>
              <p className="text-xs">
                <span className={ESTADO_PAGO_CLASS[r.ultimoPago.status]}>
                  {tLabels(`paymentStatus.${r.ultimoPago.status}`)}
                </span>
                <span className="text-muted-foreground">
                  {" "}
                  · {tLabels(`paymentMethod.${r.ultimoPago.method}`)}
                </span>
              </p>
              {r.intentosFallidos > 0 && (
                <p className="text-xs text-destructive">
                  {t("failedAttempts", { n: r.intentosFallidos })}
                </p>
              )}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">{t("noPayments")}</span>
          ),
      },
      {
        key: "actividad",
        header: t("activity"),
        className: "max-2xl:hidden",
        sortValue: (r) => r.lastActiveAt,
        render: (r) => (
          <div className="text-xs">
            <p>{f.relative(r.lastActiveAt, hoy)}</p>
            <p
              className={
                r.proyectosCiclo === 0 ? "text-warning" : "text-muted-foreground"
              }
            >
              {t("cycleProjects", { n: r.proyectosCiclo })}
            </p>
          </div>
        ),
      },
      {
        key: "accion",
        header: <span className="sr-only">{t("action")}</span>,
        align: "right",
        render: (r) => {
          const accion = tMetrics(`action.${r.accion}`)
          return r.accion === "sin-accion" ? (
            <span className="text-xs text-muted-foreground">{accion}</span>
          ) : (
            <MockAction
              size="sm"
              variant="outline"
              efecto={t("actionEffect", {
                accion,
                nombre: r.userName,
                plan: planName(r.plan),
                monto: f.money(r.amount),
                metodo: tLabels(`paymentMethod.${r.method}`),
              })}
            >
              {accion}
            </MockAction>
          )
        },
      },
    ]
  }, [updatedAt, t, tLabels, tMetrics, f, planName, motivo, mes])

  return (
    <AdminTable
      rows={rows}
      columns={columns}
      rowKey={(r) => r.subscriptionId}
      caption={t("caption")}
      filters={filters}
      defaultSort={{ key: "prioridad", dir: "asc" }}
      empty={{ title: t("emptyTitle"), description: t("emptyDescription") }}
      summary={(list) => {
        const importe = list.reduce((n, r) => n + r.amount, 0)
        const mrr = list.reduce((n, r) => n + r.mrr, 0)
        const rojos = list.filter((r) => r.semaforo === "rojo").length
        return t.rich("summary", {
          b: (chunks) => (
            <strong className="font-semibold text-foreground">{chunks}</strong>
          ),
          rojos,
          importe: f.money(importe),
          mrr: f.money(mrr),
        })
      }}
    />
  )
}
