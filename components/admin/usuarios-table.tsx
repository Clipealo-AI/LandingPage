"use client"

import * as React from "react"
import { ArrowLeftRight, UserCheck } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { cn } from "@/lib/utils"
import { countryName } from "@/lib/countries"
import { DAY_MS } from "@/lib/admin/dates"
import { ACQUISITION_CHANNELS, COUNTRY_CODES, PLAN_IDS } from "@/lib/admin/types"
import { TIPOS_ORGANIZACION } from "@/lib/taxonomia"
import {
  PESO_SEGMENTO,
  SEGMENTOS_POR_PESO,
  resumenFilas,
  type Segmento,
  type SuscripcionEstado,
  type UserRow,
} from "@/lib/admin/rows"
import { useFormat } from "@/hooks/use-format"
import { AdminTable, type Column, type FilterDef } from "@/components/admin/admin-table"
import { CountryBadge } from "@/components/shared/country-flag"
import { MockAction } from "@/components/admin/mock-action"
import { PlanBadge } from "@/components/admin/plan-badge"
import { useCanalResuelto, usePlanName } from "@/components/admin/textos"
import { Badge } from "@/components/ui/badge"

type BadgeVariant = React.ComponentProps<typeof Badge>["variant"]

const SEGMENTO_VARIANT: Record<Segmento, BadgeVariant> = {
  pql: "default",
  "pagante-inactivo": "destructive",
  "cobro-fallido": "destructive",
  "pendiente-verificacion": "warning",
  incoherencia: "warning",
  revisar: "warning",
  "ex-pagante": "secondary",
  dormido: "secondary",
  "sin-activar": "outline",
  activo: "success",
}

const ORDEN_SUSCRIPCION: SuscripcionEstado[] = [
  "cliente-de-pago",
  "pendiente-pago",
  "vencida",
  "cancelada",
  "ninguna",
]

const SUSCRIPCION_CLASS: Record<SuscripcionEstado, string> = {
  "cliente-de-pago": "text-success font-medium",
  "pendiente-pago": "text-warning",
  vencida: "text-warning",
  cancelada: "text-muted-foreground",
  ninguna: "text-muted-foreground",
}

/**
 * Tabla de trabajo de usuarios. Las filas llegan calculadas del servidor
 * (`UserRow`); aquí solo se buscan, filtran y ordenan, con el estado en la
 * URL. `hoy` es la marca de la instantánea, no el reloj del navegador.
 */
export function UsuariosTable({ rows, hoy }: { rows: UserRow[]; hoy: string }) {
  const t = useTranslations("admin.usuarios.table")
  const tLabels = useTranslations("admin.labels")
  const tTable = useTranslations("admin.table")
  const tTaxonomy = useTranslations("taxonomy")
  const f = useFormat()
  const locale = useLocale()
  const planName = usePlanName()
  const canal = useCanalResuelto()
  const hoyDate = React.useMemo(() => new Date(hoy), [hoy])

  const cohortes = React.useMemo(
    () => [...new Set(rows.map((r) => r.cohorte))].sort((a, b) => b.localeCompare(a)),
    [rows]
  )

  const filtros = React.useMemo<FilterDef<UserRow>[]>(
    () => [
      {
        param: "segmento",
        label: t("filters.segment"),
        options: [
          { value: "todos", label: t("filters.anySegment") },
          ...SEGMENTOS_POR_PESO.map((s) => ({
            value: s,
            label: tLabels(`segment.${s}`),
          })),
        ],
        predicate: (r, v) => r.segmentos.includes(v as Segmento),
      },
      {
        param: "plan",
        label: t("filters.plan"),
        options: [
          { value: "todos", label: t("filters.anyPlan") },
          ...PLAN_IDS.map((p) => ({ value: p, label: planName(p) })),
        ],
        predicate: (r, v) => r.plan === v,
      },
      {
        // Universidades, institutos, marcas…: es lo que la dirección quiere
        // poder separar de un vistazo. Solo las agencias lo tienen
        param: "organizacion",
        label: t("filters.organisation"),
        options: [
          { value: "todos", label: t("filters.anyOrganisation") },
          ...TIPOS_ORGANIZACION.map((o) => ({
            value: o,
            label: tTaxonomy(`tiposOrganizacion.${o}`),
          })),
        ],
        predicate: (r, v) => r.tipoOrganizacion === v,
      },
      {
        param: "suscripcion",
        label: t("filters.subscription"),
        options: [
          { value: "todos", label: t("filters.anySubscription") },
          ...ORDEN_SUSCRIPCION.map((s) => ({
            value: s,
            label: tLabels(`subscriptionState.${s}`),
          })),
        ],
        predicate: (r, v) => r.suscripcion === v,
      },
      {
        param: "pais",
        label: t("filters.country"),
        options: [
          { value: "todos", label: t("filters.anyCountry") },
          ...COUNTRY_CODES.map((c) => ({ value: c, label: countryName(c, locale) })),
        ],
        predicate: (r, v) => r.countryCode === v,
      },
      {
        param: "canal",
        label: t("filters.channel"),
        options: [
          { value: "todos", label: t("filters.anyChannel") },
          ...ACQUISITION_CHANNELS.map((c) => ({
            value: c,
            label: tLabels(`channel.${c}`),
          })),
        ],
        predicate: (r, v) => r.channel === v,
      },
      {
        param: "cohorte",
        label: t("filters.cohort"),
        options: [
          { value: "todos", label: t("filters.anyCohort") },
          ...cohortes.map((m) => ({ value: m, label: f.month(m, { capital: true }) })),
        ],
        predicate: (r, v) => r.cohorte === v,
      },
      {
        param: "actividad",
        label: t("filters.activity"),
        options: [
          { value: "todos", label: t("filters.anyActivity") },
          { value: "7", label: t("filters.active", { n: 7 }) },
          { value: "30", label: t("filters.active", { n: 30 }) },
          { value: "90", label: t("filters.active", { n: 90 }) },
        ],
        // «Activo» es haber creado un proyecto, como en el KPI de arriba: la
        // última actividad solo sirve para los pagantes inactivos
        predicate: (r, v) =>
          r.ultimoProyectoAt !== null &&
          new Date(r.ultimoProyectoAt).getTime() >=
            hoyDate.getTime() - Number(v) * DAY_MS,
      },
    ],
    [cohortes, hoyDate, t, tLabels, tTaxonomy, f, locale, planName]
  )

  const columnas = React.useMemo<Column<UserRow>[]>(
    () => [
      {
        key: "usuario",
        header: t("user"),
        sortValue: (r) => r.name,
        className: "max-w-44",
        render: (r) => (
          <div className="min-w-0">
            <p className="truncate font-medium">{r.name}</p>
            <p className="truncate text-xs text-muted-foreground">{r.email}</p>
          </div>
        ),
      },
      {
        key: "pais",
        header: t("country"),
        sortValue: (r) => countryName(r.countryCode, locale),
        render: (r) => <CountryBadge code={r.countryCode} short className="text-xs" />,
      },
      {
        key: "plan",
        header: t("plan"),
        sortValue: (r) => PLAN_IDS.indexOf(r.plan),
        render: (r) => <PlanBadge plan={r.plan} />,
      },
      {
        key: "suscripcion",
        header: t("subscription"),
        hideBelow: "lg",
        sortValue: (r) => ORDEN_SUSCRIPCION.indexOf(r.suscripcion),
        render: (r) => (
          <span
            className={cn("text-xs whitespace-nowrap", SUSCRIPCION_CLASS[r.suscripcion])}
          >
            {tLabels(`subscriptionState.${r.suscripcion}`)}
          </span>
        ),
      },
      {
        key: "canal",
        header: t("channel"),
        sortValue: (r) => canal(r.canalResuelto),
        className: "max-w-36 max-2xl:hidden",
        render: (r) => (
          <span className="block truncate text-xs" title={canal(r.canalResuelto)}>
            {canal(r.canalResuelto)}
          </span>
        ),
      },
      {
        key: "alta",
        header: t("signup"),
        className: "max-2xl:hidden",
        sortValue: (r) => r.createdAt,
        render: (r) => (
          <span className="text-xs whitespace-nowrap">{f.date(r.createdAt)}</span>
        ),
      },
      {
        key: "actividad",
        header: t("activity"),
        hideBelow: "md",
        sortValue: (r) => r.lastActiveAt,
        render: (r) => (
          <span
            className={cn(
              "text-xs whitespace-nowrap",
              r.diasInactivo > 30 && "text-muted-foreground"
            )}
          >
            {f.relative(r.lastActiveAt, hoyDate)}
          </span>
        ),
      },
      {
        key: "proyectos30d",
        header: t("projects30d"),
        align: "right",
        sortValue: (r) => r.proyectos30d,
        render: (r) =>
          r.proyectos30d === 0 ? (
            <span className="text-muted-foreground">0</span>
          ) : (
            r.proyectos30d
          ),
      },
      {
        key: "listos",
        header: t("ready"),
        align: "right",
        hideBelow: "xl",
        sortValue: (r) => r.proyectosListos,
        render: (r) => r.proyectosListos,
      },
      {
        key: "minutos30d",
        header: t("min30d"),
        align: "right",
        sortValue: (r) => r.minutos30d,
        render: (r) =>
          r.minutos30d === 0 ? (
            <span className="text-muted-foreground">0</span>
          ) : (
            f.number(Math.round(r.minutos30d))
          ),
      },
      {
        key: "costeIa30d",
        header: t("ai30d"),
        align: "right",
        hideBelow: "xl",
        sortValue: (r) => r.costeIa30d,
        render: (r) =>
          r.costeIa30d > 0 ? (
            <span className="whitespace-nowrap">
              {f.money(r.costeIa30d, { decimals: 2 })}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        key: "pagos",
        header: t("payments"),
        align: "right",
        sortValue: (r) => r.totalPaid,
        render: (r) => (
          <div className="whitespace-nowrap">
            {r.pagosAprobados === 0 ? (
              <span className="text-muted-foreground">—</span>
            ) : (
              <span>
                {t("paymentsCell", { n: r.pagosAprobados, monto: f.money(r.totalPaid) })}
              </span>
            )}
            {(r.pagosPendientes > 0 || r.pagosRechazados > 0) && (
              <span className="block text-[11px] leading-tight text-warning">
                {[
                  r.pagosPendientes > 0 && t("toVerify", { n: r.pagosPendientes }),
                  r.pagosRechazados > 0 && t("declined", { n: r.pagosRechazados }),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            )}
          </div>
        ),
      },
      {
        key: "segmentos",
        header: t("segment"),
        sortValue: (r) => r.prioridad,
        render: (r) =>
          r.segmentos.length === 0 ? (
            <span className="text-xs text-muted-foreground">—</span>
          ) : (
            <div className="flex max-w-44 flex-wrap gap-1">
              {[...r.segmentos]
                .sort((a, b) => PESO_SEGMENTO[b] - PESO_SEGMENTO[a])
                .map((s) => (
                  <Badge key={s} variant={SEGMENTO_VARIANT[s]} className="font-medium">
                    {tLabels(`segment.${s}`)}
                  </Badge>
                ))}
            </div>
          ),
      },
      {
        key: "acciones",
        header: <span className="sr-only">{tTable("actions")}</span>,
        align: "right",
        render: (r) => (
          <div className="flex justify-end gap-1">
            <MockAction
              size="sm"
              variant="ghost"
              title={t("contacted")}
              efecto={t("contactedEffect", { nombre: r.name })}
            >
              <UserCheck data-icon="inline-start" />
              <span className="max-2xl:sr-only">{t("contacted")}</span>
            </MockAction>
            <MockAction
              size="sm"
              variant="outline"
              title={t("changePlan")}
              efecto={t("changePlanEffect", { nombre: r.name, plan: planName(r.plan) })}
            >
              <ArrowLeftRight data-icon="inline-start" />
              <span className="max-2xl:sr-only">{t("changePlan")}</span>
            </MockAction>
          </div>
        ),
      },
    ],
    [hoyDate, t, tLabels, tTable, f, locale, planName, canal]
  )

  return (
    <AdminTable
      rows={rows}
      columns={columnas}
      rowKey={(r) => r.id}
      caption={t("caption")}
      search={{
        placeholder: t("search"),
        keys: (r) => [r.name, r.email, countryName(r.countryCode, locale), r.countryCode],
      }}
      filters={filtros}
      defaultSort={{ key: "segmentos", dir: "desc" }}
      empty={{ title: t("emptyTitle"), description: t("emptyDescription") }}
      summary={(lista) => {
        const { dePago, pql, pagantesInactivos, minutos30d } = resumenFilas(lista)
        return (
          <span>
            {t("summary", {
              dePago,
              pql,
              inactivos: pagantesInactivos,
              minutos: f.number(Math.round(minutos30d)),
            })}
          </span>
        )
      }}
    />
  )
}
