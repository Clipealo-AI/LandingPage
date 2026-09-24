import * as React from "react"
import { Pencil } from "lucide-react"
import { useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import type { PlanStats } from "@/lib/admin/metrics"
import { conMes } from "@/lib/admin/enlaces"
import { useFormat } from "@/hooks/use-format"
import { Button } from "@/components/ui/button"
import { usePlanName } from "@/components/admin/textos"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

/** Plan que vende: ni Prueba ni la cortesía interna. Los otros dos son filas de coste. */
export const esDePago = (p: PlanStats) => !p.internal && p.priceMonthly > 0

/** Umbrales de contribución del plan: ámbar < 80 %, rojo < 50 % (revisar límites). */
function toneContribucion(pct: number | null) {
  if (pct === null) return ""
  if (pct < 50) return "text-destructive"
  if (pct < 80) return "text-warning"
  return "text-success"
}

/**
 * Una fila por plan, MRR descendente; Prueba e Interno cierran la tabla como
 * filas de coste sin MRR. Las acciones son iconos con etiqueta accesible
 * porque tres botones de texto por fila no caben a 1440 px sin scroll.
 */
export function PlanesTable({
  planes,
  churn3mPct,
  mes,
}: {
  planes: PlanStats[]
  churn3mPct: number | null
  /** El mes elegido en el backoffice, para que los enlaces no lo pierdan. */
  mes?: string | null
}) {
  const t = useTranslations("admin.planes.table")
  const tTable = useTranslations("admin.table")
  const f = useFormat()
  const pago = planes
    .filter(esDePago)
    .sort((a, b) => b.mrr - a.mrr || b.priceMonthly - a.priceMonthly)
  const coste = planes
    .filter((p) => !esDePago(p))
    .sort((a, b) => Number(a.internal) - Number(b.internal))
  const filas = [...pago, ...coste]

  const total = {
    clientes: pago.reduce((n, p) => n + p.clientes, 0),
    mrr: pago.reduce((n, p) => n + p.mrr, 0),
    costeIa: pago.reduce((n, p) => n + p.costeIa, 0),
    contribucion: pago.reduce((n, p) => n + p.contribucion, 0),
    conMargenBajo: pago.reduce((n, p) => n + p.conMargenBajo, 0),
    nuevos90d: pago.reduce((n, p) => n + p.nuevos90d, 0),
    bajas90d: pago.reduce((n, p) => n + p.bajas90d, 0),
  }
  const totalPct = total.mrr > 0 ? (total.contribucion / total.mrr) * 100 : null
  const arppuTotal = total.clientes > 0 ? total.mrr / total.clientes : null

  return (
    <TooltipProvider>
      <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-border">
        <Table className="text-xs sm:text-sm">
          <caption className="sr-only">{t("caption")}</caption>
          <TableHeader>
            <TableRow>
              <TableHead>{t("plan")}</TableHead>
              <TableHead className="text-right">{t("customers")}</TableHead>
              <TableHead className="text-right">{t("mrr")}</TableHead>
              <TableHead className="text-right">{t("arppu")}</TableHead>
              <TableHead className="text-right">{t("aiCost")}</TableHead>
              <TableHead className="text-right">{t("contribution")}</TableHead>
              <TableHead className="min-w-32">
                {t("usage")}{" "}
                <span className="font-normal text-muted-foreground">
                  {t("usageWindow")}
                </span>
              </TableHead>
              <TableHead className="text-right">{t("lowMargin")}</TableHead>
              <TableHead className="text-right">{t("window90d")}</TableHead>
              <TableHead className="text-right">{t("churn3m")}</TableHead>
              <TableHead className="text-right">
                <span className="sr-only">{tTable("actions")}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="tabular-nums">
            {filas.map((p) => (
              <FilaPlan key={p.plan} p={p} mes={mes} />
            ))}
          </TableBody>
          <TableFooter className="tabular-nums">
            <TableRow>
              <TableCell className="font-semibold">
                {t("paidPlans")}
                <span className="block text-[11px] font-normal text-muted-foreground">
                  {t("paidPlansHint")}
                </span>
              </TableCell>
              <TableCell className="text-right font-semibold">{total.clientes}</TableCell>
              <TableCell className="text-right font-semibold">
                {f.money(total.mrr)}
              </TableCell>
              <TableCell className="text-right">
                {arppuTotal === null ? "—" : f.money(arppuTotal)}
              </TableCell>
              <TableCell className="text-right">
                {f.money(total.costeIa, { decimals: 2 })}
              </TableCell>
              <TableCell
                className={cn("text-right font-semibold", toneContribucion(totalPct))}
              >
                {f.money(total.contribucion)}
                {totalPct !== null && (
                  <span className="ml-1 text-[11px] font-normal">
                    {f.percent(totalPct, 0)}
                  </span>
                )}
              </TableCell>
              <TableCell />
              <TableCell
                className={cn(
                  "text-right",
                  total.conMargenBajo > 0 && "font-semibold text-warning"
                )}
              >
                {total.conMargenBajo}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                <span className="text-success">+{total.nuevos90d}</span>
                <span className="text-muted-foreground"> / </span>
                <span className={total.bajas90d > 0 ? "text-destructive" : undefined}>
                  −{total.bajas90d}
                </span>
              </TableCell>
              <TableCell className="text-right">
                {churn3mPct === null ? "—" : f.percent(churn3mPct, 1)}
              </TableCell>
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </TooltipProvider>
  )
}

function FilaPlan({ p, mes }: { p: PlanStats; mes?: string | null }) {
  const t = useTranslations("admin.planes.table")
  const f = useFormat()
  const planName = usePlanName()
  const nombre = planName(p.plan)
  const dePago = esDePago(p)
  const uso = p.usoIncluidoPct
  const usoAlto = uso !== null && uso >= 100
  const usoBajo = dePago && uso !== null && uso < 20
  const sinLimite = p.internal

  return (
    <TableRow className={cn(!dePago && "bg-muted/30 text-muted-foreground")}>
      <TableCell className="min-w-40">
        <div className="flex flex-wrap items-center gap-1.5">
          <Link
            href={conMes(`/admin/usuarios?plan=${p.plan}`, mes)}
            className={cn(
              "font-semibold underline-offset-4 hover:text-primary hover:underline",
              !dePago && "text-foreground"
            )}
          >
            {nombre}
          </Link>
          {!dePago && (
            <Badge variant="outline" className="h-4 px-1 text-[10px]">
              {p.internal ? t("courtesyBadge") : t("costBadge")}
            </Badge>
          )}
        </div>
        <p className="mt-0.5 text-[11px] whitespace-nowrap text-muted-foreground">
          {dePago ? (
            <>
              {t("perMonth", { monto: f.money(p.priceMonthly) })}
              {p.priceYearly !== undefined && (
                <> · {t("perYear", { monto: f.money(p.priceYearly) })}</>
              )}
              {p.seatPriceMonthly !== undefined && p.seatPriceMonthly > 0 && (
                <> · {t("perSeat", { monto: f.money(p.seatPriceMonthly) })}</>
              )}
            </>
          ) : (
            t("noPrice")
          )}
          {" · "}
          {sinLimite ? t("unlimited") : t("included", { n: f.number(p.minutesIncluded) })}
          {!dePago && ` · ${t("users", { n: f.number(p.usuarios) })}`}
        </p>
      </TableCell>

      <TableCell className="text-right">
        {dePago ? (
          <>
            <span className="font-medium">{p.clientes}</span>
            <span className="ml-1 text-[11px] text-muted-foreground">
              {f.percent(p.pctClientes, 0)}
            </span>
          </>
        ) : (
          "—"
        )}
      </TableCell>

      <TableCell className="text-right">
        {dePago ? (
          <>
            <span className="font-medium">{f.money(p.mrr)}</span>
            <span className="ml-1 text-[11px] text-muted-foreground">
              {f.percent(p.pctMrr, 0)}
            </span>
          </>
        ) : (
          "—"
        )}
      </TableCell>

      <TableCell className="text-right">
        {p.arppu === null ? "—" : f.money(p.arppu)}
      </TableCell>

      <TableCell className="text-right">{f.money(p.costeIa, { decimals: 2 })}</TableCell>

      <TableCell
        className={cn(
          "text-right",
          dePago ? toneContribucion(p.contribucionPct) : "text-destructive"
        )}
      >
        {dePago ? (
          <>
            <span className="font-medium">{f.money(p.contribucion)}</span>
            {p.contribucionPct !== null && (
              <span className="ml-1 text-[11px]">{f.percent(p.contribucionPct, 0)}</span>
            )}
          </>
        ) : (
          <span className="font-medium">{f.money(-p.costeIa, { decimals: 2 })}</span>
        )}
      </TableCell>

      <TableCell>
        {p.medianaMinutos === null ? (
          <span className="text-muted-foreground">{t("noUsage")}</span>
        ) : (
          <div className="space-y-1">
            <div className="flex items-baseline justify-between gap-2 text-[11px] whitespace-nowrap">
              <span>
                <span className="font-medium text-foreground">
                  {f.number(Math.round(p.medianaMinutos))}
                </span>
                {!sinLimite && (
                  <span className="text-muted-foreground">
                    {t("ofMinutes", { n: f.number(p.minutesIncluded) })}
                  </span>
                )}
                {sinLimite && (
                  <span className="text-muted-foreground">{t("minutes")}</span>
                )}
              </span>
              {uso !== null && !sinLimite && (
                <span
                  className={cn(
                    "text-muted-foreground",
                    usoAlto && "font-medium text-destructive",
                    usoBajo && "font-medium text-warning"
                  )}
                >
                  {f.percent(uso, 0)}
                </span>
              )}
            </div>
            {uso !== null && !sinLimite && (
              <Progress
                value={Math.min(100, uso)}
                aria-label={t("usageAria", { pct: f.percent(uso, 0) })}
                className={cn(
                  "h-1.5",
                  usoAlto && "[&>[data-slot=progress-indicator]]:bg-destructive",
                  usoBajo && "[&>[data-slot=progress-indicator]]:bg-warning"
                )}
              />
            )}
          </div>
        )}
      </TableCell>

      <TableCell
        className={cn("text-right", p.conMargenBajo > 0 && "font-semibold text-warning")}
      >
        {dePago ? p.conMargenBajo : "—"}
      </TableCell>

      <TableCell className="text-right whitespace-nowrap">
        {dePago ? (
          <>
            <span className={p.nuevos90d > 0 ? "text-success" : undefined}>
              +{p.nuevos90d}
            </span>
            <span className="text-muted-foreground"> / </span>
            <span className={p.bajas90d > 0 ? "text-destructive" : undefined}>
              −{p.bajas90d}
            </span>
          </>
        ) : (
          "—"
        )}
      </TableCell>

      <TableCell
        className={cn(
          "text-right",
          p.churn3mPct !== null && p.churn3mPct > 10 && "font-semibold text-destructive"
        )}
      >
        {p.churn3mPct === null ? "—" : f.percent(p.churn3mPct, 1)}
      </TableCell>

      <TableCell className="pl-0 text-right">
        <div className="flex items-center justify-end">
          {/* Precio, límites y altas se cambian en el catálogo de arriba, que es
              real; Interno no está en el catálogo porque no se vende */}
          {!p.internal && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  asChild
                  aria-label={t("editInCatalogue", { plan: nombre })}
                >
                  <Link href="#catalogo">
                    <Pencil />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("editInCatalogue", { plan: nombre })}</TooltipContent>
            </Tooltip>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}
