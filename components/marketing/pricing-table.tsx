"use client"

import { Check, Minus } from "lucide-react"
import { useTranslations } from "next-intl"

import { usePrecio } from "@/components/planes/precio"
import { useNombrePlan } from "@/components/planes/nombre-plan"
import { Link } from "@/i18n/navigation"
import { useFormat } from "@/hooks/use-format"
import { cn } from "@/lib/utils"
import {
  FEATURE_GROUPS,
  planPrice,
  type FeatureValue,
  type PricingCurrency,
} from "@/lib/pricing"
import { PLANES_SEMILLA, planesVisibles } from "@/lib/planes"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { WhatsAppIcon } from "@/components/brand/whatsapp-icon"

/** Tabla semántica con desplazamiento horizontal en pantallas estrechas. */
export function PricingTable({
  yearly,
  currency,
}: {
  yearly: boolean
  currency: PricingCurrency
}) {
  const t = useTranslations("marketing.pricingTable")
  const tp = useTranslations("pricing")
  const formatoPrecio = usePrecio(currency)
  const nombrePlan = useNombrePlan()
  const planes = planesVisibles(PLANES_SEMILLA)

  return (
    <div className="relative overflow-x-auto rounded-frame bg-card ring-1 ring-border">
      <table className="w-full min-w-[58rem] border-separate border-spacing-0 text-sm">
        <caption className="sr-only">{t("caption")}</caption>
        <thead className="sticky top-0 z-10 bg-card">
          <tr>
            <th
              scope="col"
              className="sticky left-0 z-20 w-[30%] border-b bg-card p-4 text-left align-bottom sm:p-5"
            >
              <span className="text-xs font-medium text-muted-foreground">
                {t("feature")}
              </span>
            </th>
            {planes.map((plan) => {
              const price = planPrice(plan, plan.includedCredits, yearly, currency)
              return (
                <th
                  key={plan.id}
                  scope="col"
                  className={cn(
                    "border-b p-4 text-left align-bottom sm:p-5",
                    plan.featured && "bg-brand-subtle/40"
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2">
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
                    <span className="text-muted-foreground"> {tp("perMonth")}</span>
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="mt-3 w-full max-w-40"
                  >
                    <Link href="https://app.clipealo-ai.com/">
                      {tp(`plans.${plan.base}.cta`)}
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
                  <span className="inline-flex items-center gap-1.5">
                    {tp(`features.${row.id}`)}
                    {(row.id === "whatsappSupport" || row.id === "priorityWhatsapp") && (
                      <WhatsAppIcon className="size-4" />
                    )}
                  </span>
                </th>
                {planes.map((plan) => (
                  <td
                    key={plan.id}
                    className={cn(
                      "border-b p-4 align-top group-hover/row:bg-muted/30 sm:p-5",
                      plan.featured && "bg-brand-subtle/20"
                    )}
                  >
                    <Celda value={row.values[plan.base]} />
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

function Celda({ value }: { value: FeatureValue }) {
  const t = useTranslations("marketing.pricingTable")
  const tp = useTranslations("pricing")
  const f = useFormat()

  if (value === true) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <Check className="size-4 text-primary" aria-hidden />
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
  if (typeof value === "number") {
    return <span className="tabular-nums">{f.grouped(value)}</span>
  }
  return (
    <span className="tabular-nums">
      {typeof value === "string" ? value : tp(`values.${value.text}`)}
    </span>
  )
}
