"use client"

import { ArrowRight, Check } from "lucide-react"
import { useTranslations } from "next-intl"

import { usePrecio } from "@/components/planes/precio"
import { Link } from "@/i18n/navigation"
import { useFormat } from "@/hooks/use-format"
import {
  CREDIT_PACKS,
  ENTERPRISE_EXTRAS,
  ENTERPRISE_INCLUDED,
  type PricingCurrency,
} from "@/lib/pricing"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { WhatsAppIcon } from "@/components/brand/whatsapp-icon"
import { WHATSAPP_URL } from "@/lib/contact"

export function PricingAddons({ currency }: { currency: PricingCurrency }) {
  const t = useTranslations("pricing")
  const formatPrice = usePrecio(currency)
  const f = useFormat()
  const currencyName = t(
    currency === "PEN" ? "billing.currencyNamePEN" : "billing.currencyNameUSD"
  )

  return (
    <>
      <section id="empresarial" className="container-page scroll-mt-24 py-12 md:py-16">
        <div className="grid gap-8 rounded-frame bg-card p-6 ring-1 ring-border sm:p-8 lg:grid-cols-[0.8fr_1.2fr] lg:p-10">
          <div>
            <p className="text-xs font-semibold tracking-[0.15em] text-brand uppercase">
              {t("enterprise.eyebrow")}
            </p>
            <h2 className="mt-3 display text-3xl">{t("enterprise.title")}</h2>
            <p className="mt-2 text-muted-foreground">{t("enterprise.lead")}</p>
            <p className="mt-6 display text-3xl">{t("enterprise.price")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("enterprise.turnaround")}
            </p>
            <Button variant="brand" size="lg" asChild className="mt-5">
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon className="size-4" />
                {t("enterprise.contact")} <ArrowRight />
              </a>
            </Button>
          </div>

          <div className="grid gap-7 sm:grid-cols-2">
            <List
              title={t("enterprise.includesTitle")}
              items={ENTERPRISE_INCLUDED.map((id) => t(`enterprise.included.${id}`))}
            />
            <List
              title={t("enterprise.extrasTitle")}
              items={ENTERPRISE_EXTRAS.map((id) => t(`enterprise.extras.${id}`))}
            />
          </div>
        </div>
      </section>

      <section id="recargas" className="container-page scroll-mt-24 py-12 md:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="display text-[clamp(1.75rem,4vw,2.5rem)]">
            {t("topups.title")}
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            {t("topups.lead", { credits: f.grouped(60), hours: 1 })}
          </p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {CREDIT_PACKS.map((pack) => (
            <article
              key={pack.id}
              className="relative flex flex-col rounded-frame bg-card p-6 ring-1 ring-border"
            >
              {"popular" in pack && pack.popular && (
                <Badge
                  variant="brand"
                  className="absolute -top-2.5 left-1/2 -translate-x-1/2"
                >
                  {t("topups.popular")}
                </Badge>
              )}
              <p className="display text-3xl tabular-nums">{f.grouped(pack.credits)}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("topups.creditsLabel", { count: pack.credits })}
              </p>
              <p className="mt-4 text-sm">{t("topups.hours", { count: pack.hours })}</p>
              <p className="mt-1 display text-2xl tabular-nums">
                {formatPrice(currency === "PEN" ? pack.PEN : pack.USD)}
              </p>
              <Button variant="outline" asChild className="mt-5 w-full">
                <Link href="https://app.clipealo-ai.com/">{t("topups.buy")}</Link>
              </Button>
            </article>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          {t("topups.footer", { currency: currencyName })}
        </p>
      </section>
    </>
  )
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold tracking-[0.15em] text-muted-foreground uppercase">
        {title}
      </h3>
      <ul className="space-y-2.5 text-sm">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2.5">
            <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            <span className="text-muted-foreground">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
