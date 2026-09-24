import type { ReactNode } from "react"
import { CheckCircle2, MinusCircle } from "lucide-react"
import { useTranslations } from "next-intl"

import { cn } from "@/lib/utils"
import type { AffiliateStats } from "@/lib/admin/metrics"
import type { AffiliateUserRow } from "@/lib/admin/rows"
import { useFormat } from "@/hooks/use-format"
import {
  AfiliadoAcciones,
  AfiliadoAlerta,
  AfiliadoEstado,
} from "@/components/admin/afiliados-table"
import { PlanBadge } from "@/components/admin/plan-badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export interface AfiliadoDetalleItem {
  stats: AffiliateStats
  usuarios: AffiliateUserRow[]
}

const DAY_MS = 86_400_000

/**
 * Un bloque desplegable por afiliado con la lista de usuarios que trajo:
 * alta, plan, activación, proyectos, pagos, comisión que generan y coste de
 * IA. Se abren por defecto los códigos con alerta (o el primero si no hay).
 * `hoy` es la marca de la instantánea: nada de `new Date()` sin argumento.
 * El canal del afiliado lo escribe el operador y se enseña tal cual.
 */
export function AfiliadosDetalle({
  items,
  hoy,
}: {
  items: AfiliadoDetalleItem[]
  hoy: string
}) {
  const t = useTranslations("admin.afiliados.detail")
  // Solo las ramas que toca: pedir `admin` entero obliga a mandar sus 90 KB
  const tLabels = useTranslations("admin.labels")
  const tUnits = useTranslations("admin.units")
  const f = useFormat()
  const hoyMs = new Date(hoy).getTime()
  const conAlerta = items
    .filter((i) => i.stats.alerta !== null)
    .map((i) => i.stats.affiliate.id)
  const abiertos = conAlerta.length
    ? conAlerta
    : items.slice(0, 1).map((i) => i.stats.affiliate.id)
  const strong = (chunks: ReactNode) => (
    <strong className="text-foreground">{chunks}</strong>
  )

  return (
    <Accordion
      type="multiple"
      defaultValue={abiertos}
      className="rounded-xl bg-card ring-1 ring-border"
    >
      {items.map(({ stats, usuarios }) => {
        const a = stats.affiliate
        const pagantes = usuarios.filter((u) => u.totalPaid > 0).length
        const sinProyecto = usuarios.filter((u) => u.proyectos === 0).length
        const comision = {
          b: strong,
          devengada: f.money(stats.comisionDevengada),
          pagada: f.money(stats.comisionPagada),
          pendiente: f.money(stats.comisionPendiente),
          ia: f.money(stats.costeIaNoPagantes, { decimals: 2 }),
        }
        return (
          <AccordionItem key={a.id} value={a.id} className="px-4">
            <AccordionTrigger className="items-center gap-4 py-3 hover:no-underline">
              <div className="grid min-w-0 flex-1 gap-2 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                    {a.name}
                    <AfiliadoEstado status={a.status} />
                    {stats.alerta && <AfiliadoAlerta alerta={stats.alerta} />}
                  </p>
                  <p className="text-xs font-normal text-muted-foreground">
                    <span className="font-mono text-[11px] tracking-wide">{a.code}</span>{" "}
                    ·{" "}
                    {t("meta", {
                      canal: a.channel,
                      pct: f.percent(a.commissionPct, 0),
                      fecha: f.date(a.joinedAt),
                    })}
                  </p>
                </div>
                <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-normal text-muted-foreground tabular-nums lg:justify-end">
                  <Dato label={t("signups")} value={String(stats.altas)} />
                  <Dato
                    label={t("activated")}
                    value={
                      stats.activacionPct === null
                        ? "—"
                        : f.percent(stats.activacionPct, 0)
                    }
                  />
                  <Dato label={t("payers")} value={String(stats.pagando)} />
                  <Dato label={t("revenue")} value={f.money(stats.ingresoAtribuido)} />
                  <Dato
                    label={t("pending")}
                    value={f.money(stats.comisionPendiente)}
                    className={
                      stats.comisionPendiente > 0
                        ? (stats.antiguedadPendienteDias ?? 0) > 30
                          ? "text-destructive"
                          : "text-foreground"
                        : undefined
                    }
                  />
                </dl>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pb-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground tabular-nums">
                  {stats.antiguedadPendienteDias !== null
                    ? t.rich("commissionAge", {
                        ...comision,
                        dias: stats.antiguedadPendienteDias,
                      })
                    : t.rich("commission", comision)}
                </p>
                <AfiliadoAcciones row={stats} />
              </div>

              {usuarios.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("none")}</p>
              ) : (
                <div className="overflow-x-auto rounded-lg ring-1 ring-border">
                  <Table className="text-xs sm:text-sm">
                    <caption className="sr-only">
                      {t("caption", { nombre: a.name })}
                    </caption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("user")}</TableHead>
                        <TableHead>{t("signup")}</TableHead>
                        <TableHead>{t("plan")}</TableHead>
                        <TableHead className="text-center">{t("activatedD7")}</TableHead>
                        <TableHead className="text-right">{t("projects")}</TableHead>
                        <TableHead className="text-right">{t("paid")}</TableHead>
                        <TableHead className="text-right">{t("commissionCol")}</TableHead>
                        <TableHead className="text-right">{t("aiCost")}</TableHead>
                        <TableHead className="max-lg:hidden">{t("method")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="tabular-nums">
                      {usuarios.map((u) => {
                        const dias = Math.max(
                          0,
                          Math.round((hoyMs - new Date(u.createdAt).getTime()) / DAY_MS)
                        )
                        const paga = u.totalPaid > 0
                        return (
                          <TableRow
                            key={u.id}
                            className={cn(
                              !paga && u.proyectos === 0 && "text-muted-foreground"
                            )}
                          >
                            <TableCell className="max-w-56">
                              <span
                                className={cn(
                                  "block truncate",
                                  paga && "font-medium text-foreground"
                                )}
                              >
                                {u.name}
                              </span>
                              <span className="block truncate text-[11px] text-muted-foreground">
                                {u.email}
                              </span>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {f.date(u.createdAt)}
                              <span className="ml-1 text-[11px] text-muted-foreground">
                                {tUnits("daysAgo", { n: dias })}
                              </span>
                            </TableCell>
                            <TableCell>
                              <PlanBadge plan={u.plan} />
                            </TableCell>
                            <TableCell className="text-center">
                              {u.activadoD7 ? (
                                <span className="inline-flex items-center gap-1 text-xs text-success">
                                  <CheckCircle2 className="size-3.5" aria-hidden />{" "}
                                  {t("yes")}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                  <MinusCircle className="size-3.5" aria-hidden />{" "}
                                  {t("no")}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">{u.proyectos}</TableCell>
                            <TableCell
                              className={cn(
                                "text-right",
                                paga && "font-medium text-foreground"
                              )}
                            >
                              {f.money(u.totalPaid)}
                            </TableCell>
                            <TableCell className="text-right">
                              {u.comision > 0 ? (
                                f.money(u.comision)
                              ) : (
                                <span className="text-muted-foreground/60">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {f.money(u.costeIa, { decimals: 2 })}
                            </TableCell>
                            <TableCell className="text-muted-foreground max-lg:hidden">
                              {u.method ? tLabels(`paymentMethod.${u.method}`) : "—"}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
              <p className="text-xs text-muted-foreground tabular-nums">
                {t("footer", {
                  n: usuarios.length,
                  pagantes,
                  sinProyecto,
                  pct: f.percent(a.commissionPct, 0),
                })}
              </p>
            </AccordionContent>
          </AccordionItem>
        )
      })}
    </Accordion>
  )
}

function Dato({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className="flex items-baseline gap-1">
      <dt>{label}</dt>
      <dd className={cn("font-medium text-foreground", className)}>{value}</dd>
    </div>
  )
}
