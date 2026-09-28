"use client"

import * as React from "react"
import { useTranslations } from "next-intl"

import { BillingToggle, PlanCards } from "@/components/marketing/pricing"
import { PricingTable } from "@/components/marketing/pricing-table"
import { PricingAddons } from "@/components/marketing/pricing-addons"
import type { PricingCurrency } from "@/lib/pricing"

/**
 * Cuerpo de /precios. El conmutador mensual/anual vive aquí para que las
 * tarjetas y la cabecera de la comparativa cambien a la vez.
 */
export function PricingPage() {
  const t = useTranslations("marketing.pricingPage")
  const [yearly, setYearly] = React.useState(true)
  const [currency, setCurrency] = React.useState<PricingCurrency>("PEN")

  return (
    <>
      <section className="container-page pt-32 pb-12 sm:pt-40 md:pb-16">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="mt-3 display text-[clamp(2.25rem,6vw,4rem)]">
            {t.rich("title", { br: () => <br /> })}
          </h1>
          <p className="mt-5 text-lg text-pretty text-muted-foreground">{t("lead")}</p>
          <div className="mt-8">
            <BillingToggle
              yearly={yearly}
              onChange={setYearly}
              currency={currency}
              onCurrencyChange={setCurrency}
              id="ciclo-precios"
            />
          </div>
        </div>

        <div className="mt-14">
          <PlanCards yearly={yearly} currency={currency} />
        </div>
      </section>

      <section id="comparativa" className="container-page scroll-mt-24 py-12 md:py-16">
        <div className="mb-8">
          <h2 className="display text-[clamp(1.75rem,4vw,2.5rem)]">
            {t("compare.title")}
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-pretty text-muted-foreground">
            {t("compare.lead")}
          </p>
        </div>
        <PricingTable yearly={yearly} currency={currency} />
      </section>

      <PricingAddons currency={currency} onCurrencyChange={setCurrency} />
    </>
  )
}
