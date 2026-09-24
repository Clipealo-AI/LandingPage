import { useTranslations } from "next-intl"

import { cn } from "@/lib/utils"
import type { PlanStats } from "@/lib/admin/metrics"
import type { PlanId } from "@/lib/admin/types"
import { useFormat } from "@/hooks/use-format"
import { usePlanName } from "@/components/admin/textos"

/** Azul estructural en dos intensidades, del plan más barato al más caro. */
const SEGMENTO: Partial<Record<PlanId, string>> = {
  // Solo el sólido lleva texto «primary-foreground»: sobre un tinte al 65 %
  // el contraste dependía del tema. Los tintes llevan el texto normal.
  creator: "bg-primary/25",
  business: "bg-primary",
}

/**
 * Mezcla por plan: la barra de clientes y la de MRR, una encima de la otra.
 * Si un plan ocupa más en clientes que en MRR, ese plan está barato para lo
 * que se usa; si ocupa más en MRR, sostiene el negocio con pocos nombres.
 */
export function PlanesMezcla({ planes }: { planes: PlanStats[] }) {
  const t = useTranslations("admin.planes.mix")
  const f = useFormat()
  const planName = usePlanName()
  const pago = planes
    .filter((p) => !p.internal && p.priceMonthly > 0)
    .sort((a, b) => a.priceMonthly - b.priceMonthly)
  const clientes = pago.reduce((n, p) => n + p.clientes, 0)
  const mrr = pago.reduce((n, p) => n + p.mrr, 0)

  if (clientes === 0) {
    return <p className="text-sm text-muted-foreground">{t("empty")}</p>
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <Barra
          etiqueta={t("customers")}
          total={clientes}
          partes={pago.map((p) => ({
            plan: p.plan,
            name: planName(p.plan),
            valor: p.clientes,
            pct: p.pctClientes,
          }))}
        />
        <Barra
          etiqueta={t("mrr")}
          total={mrr}
          partes={pago.map((p) => ({
            plan: p.plan,
            name: planName(p.plan),
            valor: p.mrr,
            pct: p.pctMrr,
          }))}
        />
      </div>

      <ul className="grid gap-2 text-xs tabular-nums sm:grid-cols-3">
        {pago.map((p) => {
          const gap = p.pctMrr - p.pctClientes
          return (
            <li key={p.plan} className="flex items-start gap-2">
              <span
                className={cn(
                  "mt-1 size-2.5 shrink-0 rounded-sm",
                  SEGMENTO[p.plan] ?? "bg-primary"
                )}
                aria-hidden
              />
              <span className="min-w-0">
                <span className="block font-medium text-foreground">
                  {planName(p.plan)}
                </span>
                <span className="block text-muted-foreground">
                  {t("legend", {
                    n: p.clientes,
                    pctClientes: f.percent(p.pctClientes, 0),
                    mrr: f.money(p.mrr),
                    pctMrr: f.percent(p.pctMrr, 0),
                  })}
                </span>
                <span
                  className={cn(
                    "block",
                    gap < -5
                      ? "text-warning"
                      : gap > 5
                        ? "text-success"
                        : "text-muted-foreground"
                  )}
                >
                  {gap < -5
                    ? t("heavierCustomers")
                    : gap > 5
                      ? t("heavierMrr")
                      : t("balanced")}
                </span>
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function Barra({
  etiqueta,
  total,
  partes,
}: {
  etiqueta: string
  total: number
  partes: { plan: PlanId; name: string; valor: number; pct: number }[]
}) {
  const f = useFormat()
  return (
    <div className="grid grid-cols-[4rem_minmax(0,1fr)] items-center gap-3">
      <span className="text-xs font-medium text-muted-foreground">{etiqueta}</span>
      <div
        className="flex h-5 w-full overflow-hidden rounded-md bg-muted"
        role="img"
        aria-label={`${etiqueta}: ${partes.map((x) => `${x.name} ${f.percent(x.pct, 0)}`).join(", ")}`}
      >
        {partes.map((x) => {
          const ancho = total > 0 ? (x.valor / total) * 100 : 0
          if (ancho <= 0) return null
          return (
            <span
              key={x.plan}
              className={cn(
                "flex h-full items-center justify-center overflow-hidden text-[10px] font-semibold whitespace-nowrap",
                SEGMENTO[x.plan] ?? "bg-primary",
                x.plan === "business" ? "text-primary-foreground" : "text-foreground"
              )}
              style={{ width: `${ancho}%` }}
              title={`${x.name}: ${f.percent(x.pct, 0)}`}
            >
              {ancho >= 14 && f.percent(x.pct, 0)}
            </span>
          )
        })}
      </div>
    </div>
  )
}
