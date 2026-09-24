"use client"

import * as React from "react"
import { ArrowRight } from "lucide-react"
import { useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"
import { BillingToggle, PlanCards } from "@/components/marketing/pricing"
import { PricingNetworks } from "@/components/marketing/pricing-networks"
import { PricingTable } from "@/components/marketing/pricing-table"
import { PricingAddons } from "@/components/marketing/pricing-addons"
import { Button } from "@/components/ui/button"
import type { PricingCurrency } from "@/lib/pricing"

/**
 * Cuerpo de /precios. El conmutador mensual/anual vive aquí para que las
 * tarjetas y la cabecera de la comparativa cambien a la vez.
 */
export function PricingPage() {
  const t = useTranslations("marketing.pricingPage")
  const [yearly, setYearly] = React.useState(false)
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
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="display text-[clamp(1.75rem,4vw,2.5rem)]">
              {t("compare.title")}
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-pretty text-muted-foreground">
              {t("compare.lead")}
            </p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="#redes">
              {t("compare.networksLink")} <ArrowRight />
            </Link>
          </Button>
        </div>
        <PricingTable yearly={yearly} currency={currency} />
      </section>

      <section id="redes" className="container-page scroll-mt-24 py-12 md:py-16">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-semibold tracking-wide text-brand uppercase">
            {t("networks.eyebrow")}
          </p>
          <h2 className="mt-3 display text-[clamp(1.75rem,4vw,2.5rem)]">
            {t("networks.title")}
          </h2>
          <p className="mt-3 text-sm text-pretty text-muted-foreground">
            {t("networks.lead")}
          </p>
        </div>
        <PricingNetworks />
      </section>

      <PricingAddons currency={currency} />
    </>
  )
}
