"use client"

import * as React from "react"
import { Check, Minus } from "lucide-react"
import { useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import { FEATURE_GROUPS, hasHint, type FeatureValue } from "@/lib/pricing"
import {
  clipsEnAnaliticas,
  planesVisibles,
  redesDe,
  valorCelda,
  type PlanCatalogo,
} from "@/lib/planes"
import { SOCIAL_NETWORKS } from "@/lib/social"
import { useFormat } from "@/hooks/use-format"
import { useCatalogoPlanes } from "@/hooks/use-catalogo-planes"
import { usePrecio } from "@/components/planes/precio"
import { useNombrePlan } from "@/components/planes/nombre-plan"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

/**
 * Comparativa completa. Una tabla de verdad (semántica, navegable con
 * lector de pantalla), con la primera columna fija para que en móvil se
 * pueda deslizar entre planes sin perder la fila. Los booleanos se pintan
 * con icono y texto oculto: nunca solo con color.
 *
 * Una columna por plan visible del catálogo. La columna de un plan creado es
 * la de su escalón salvo lo que la app cobra de verdad (`valorCelda`).
 *
 * La única acción naranja de /precios es el CTA de la tarjeta destacada
 * (`pricing.tsx`): la comparativa no lo repite. La columna destacada sigue
 * marcada por su tinte y su etiqueta.
 */
export function PricingTable({ yearly }: { yearly: boolean }) {
  const t = useTranslations("marketing.pricingTable")
  const tp = useTranslations("pricing")
  const formatoPrecio = usePrecio()
  const nombrePlan = useNombrePlan()
  const planes = planesVisibles(useCatalogoPlanes())

  return (
    // `relative`: el caption oculto (sr-only, absoluto) debe recortarse dentro
    // del scroll; sin contenedor posicionado escapa y ensancha la página en móvil
    <div className="relative overflow-x-auto rounded-frame bg-card ring-1 ring-border">
      <table className="w-full min-w-[44rem] border-separate border-spacing-0 text-sm">
        <caption className="sr-only">{t("caption")}</caption>
        <thead className="sticky top-0 z-10 bg-card">
          <tr>
            <th
              scope="col"
              className="sticky left-0 z-20 w-[40%] border-b bg-card p-4 text-left align-bottom sm:p-5"
            >
              <span className="text-xs font-medium text-muted-foreground">
                {t("feature")}
              </span>
            </th>
            {planes.map((plan) => {
              const price = yearly ? plan.yearly : plan.monthly
              return (
                <th
                  key={plan.id}
                  scope="col"
                  className={cn(
                    "border-b p-4 text-left align-bottom sm:p-5",
                    plan.featured && "bg-brand-subtle/40"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold tracking-tight">
                      {nombrePlan(plan)}
                    </span>
                    {plan.featured && (
                      <Badge variant="brand" className="h-5">
                        {tp("mostPopularShort")}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-xs tabular-nums">
                    <span className="text-lg font-bold">{formatoPrecio(price)}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      {price === 0 ? tp("forever") : tp("perMonth")}
                    </span>
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="mt-3 w-full max-w-40"
                  >
                    <Link href="/subir">
                      {plan.origen === "semilla"
                        ? tp(`plans.${plan.base}.cta`)
                        : tp("choose", { plan: nombrePlan(plan) })}
                    </Link>
                  </Button>
                </th>
              )
            })}
          </tr>
        </thead>

        {FEATURE_GROUPS.map((group) => (
          <tbody key={group.id}>
            <tr>
              <th
                scope="rowgroup"
                colSpan={planes.length + 1}
                className="sticky left-0 border-b bg-muted/60 px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-foreground uppercase sm:px-5"
              >
                {tp(`groups.${group.id}`)}
              </th>
            </tr>
            {group.rows.map((row) => (
              <tr key={row.id} className="group/row">
                <th
                  scope="row"
                  className="sticky left-0 z-10 border-b bg-card p-4 text-left font-medium group-hover/row:bg-muted/30 sm:p-5"
                >
                  {tp(`features.${row.id}`)}
                  {hasHint(row.id) && (
                    <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                      {tp(`featureHints.${row.id}`)}
                    </span>
                  )}
                </th>
                {planes.map((plan) => (
                  <td
                    key={plan.id}
                    className={cn(
                      "border-b p-4 align-top group-hover/row:bg-muted/30 sm:p-5",
                      plan.featured && "bg-brand-subtle/20"
                    )}
                  >
                    <Celda value={valorCelda(row, plan)} plan={plan} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  )
}

function Celda({ value, plan }: { value: FeatureValue; plan: PlanCatalogo }) {
  const t = useTranslations("marketing.pricingTable")
  const tp = useTranslations("pricing")
  const f = useFormat()
  const formatoPrecio = usePrecio()
  const featured = plan.featured

  if (value === true) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <Check
          className={cn("size-4", featured ? "text-brand" : "text-primary")}
          aria-hidden
        />
        <span className="sr-only">{t("included")}</span>
      </span>
    )
  }
  if (value === false) {
    return (
      <span className="inline-flex items-center text-muted-foreground/60">
        <Minus className="size-4" aria-hidden />
        <span className="sr-only">{t("notIncluded")}</span>
      </span>
    )
  }
  return (
    <span className="tabular-nums">
      {typeof value === "string"
        ? value
        : tp(`values.${value.text}`, {
            minutes: f.number(plan.minutos),
            accounts: f.number(plan.cuentas),
            seat: formatoPrecio(plan.asiento),
            clips: clipsEnAnaliticas(plan) ?? 0,
            red: SOCIAL_NETWORKS[redesDe(plan)[0]].name,
          })}
    </span>
  )
}
