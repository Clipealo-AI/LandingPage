"use client"

import * as React from "react"
import { ArrowRight, Check } from "lucide-react"
import { useTranslations } from "next-intl"

import { usePrecio } from "@/components/planes/precio"
import { useNombrePlan } from "@/components/planes/nombre-plan"
import { Link } from "@/i18n/navigation"
import { useMotionGroup } from "@/hooks/use-motion-group"
import { cn } from "@/lib/utils"
import {
  CARD_HIGHLIGHTS,
  DESCUENTO_ANUAL_PCT,
  planPrice,
  type PricingCurrency,
} from "@/lib/pricing"
import { PLANES_SEMILLA, planesVisibles, type PlanCatalogo } from "@/lib/planes"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { CurrencyToggle } from "@/components/marketing/currency-toggle"

function useHaCambiado<T>(valor: T) {
  const [inicial] = React.useState(valor)
  const [cambiado, setCambiado] = React.useState(false)
  if (!cambiado && !Object.is(valor, inicial)) setCambiado(true)
  return cambiado
}

export function BillingToggle({
  yearly,
  onChange,
  currency,
  onCurrencyChange,
  id = "ciclo",
}: {
  yearly: boolean
  onChange: (yearly: boolean) => void
  currency: PricingCurrency
  onCurrencyChange: (currency: PricingCurrency) => void
  id?: string
}) {
  const t = useTranslations("pricing.billing")
  const cambiado = useHaCambiado(yearly)

  return (
    <div className="flex flex-col items-center justify-center gap-x-7 gap-y-4 sm:flex-row">
      <div className="flex items-center justify-center gap-3">
        <Label htmlFor={id} className="text-sm text-muted-foreground">
          {t("monthly")}
        </Label>
        <Switch
          id={id}
          checked={yearly}
          onCheckedChange={onChange}
          aria-label={t("yearlyLabel")}
        />
        <Label htmlFor={id} className="text-sm">
          {t("yearly")}
          <Badge
            key={String(yearly)}
            variant="brand-subtle"
            className={cn("ml-1.5", cambiado && yearly && "m-flash")}
          >
            −{DESCUENTO_ANUAL_PCT}%
          </Badge>
        </Label>
      </div>

      <CurrencyToggle value={currency} onChange={onCurrencyChange} />
    </div>
  )
}

const ESCALONADO_TARJETAS = [
  "lg:[--i:0]",
  "lg:[--i:1]",
  "lg:[--i:2]",
  "lg:[--i:3]",
] as const

export function PlanCards({
  yearly,
  currency,
  entrada = false,
}: {
  yearly: boolean
  currency: PricingCurrency
  entrada?: boolean
}) {
  const cambiado = useHaCambiado(yearly)
  const planes = planesVisibles(PLANES_SEMILLA)

  return (
    <div className="grid items-start gap-5 md:grid-cols-2 xl:grid-cols-4">
      {planes.map((plan, indice) => (
        <TarjetaPlan
          key={plan.id}
          plan={plan}
          yearly={yearly}
          currency={currency}
          cambiado={cambiado}
          entrada={entrada}
          escalonado={ESCALONADO_TARJETAS[indice]}
        />
      ))}
    </div>
  )
}

function TarjetaPlan({
  plan,
  yearly,
  currency,
  cambiado,
  entrada,
  escalonado,
}: {
  plan: PlanCatalogo
  yearly: boolean
  currency: PricingCurrency
  cambiado: boolean
  entrada: boolean
  escalonado: string
}) {
  const t = useTranslations("pricing")
  const formatoPrecio = usePrecio(currency)
  const nombrePlan = useNombrePlan()
  const tarjeta = React.useRef<HTMLDivElement>(null)
  useMotionGroup(tarjeta)

  const featured = plan.featured
  const price = planPrice(plan, yearly, currency)
  const billingNote = t(yearly ? "billing.billedYearly" : "billing.billedMonthly")

  return (
    <div
      ref={entrada ? tarjeta : undefined}
      data-motion-group={entrada ? "client" : undefined}
      data-light="claro"
      className={cn(
        "relative flex flex-col rounded-frame p-6 sm:p-8",
        entrada && ["m-anim m-rise", escalonado],
        featured
          ? "bg-card shadow-lg ring-2 ring-brand lg:-my-4 lg:py-12"
          : "bg-card ring-1 ring-border"
      )}
    >
      {featured && (
        <Badge
          variant="brand"
          className="absolute -top-2.5 left-1/2 h-6 -translate-x-1/2 px-3"
        >
          {t("mostPopular")}
        </Badge>
      )}

      <h3 className="text-lg font-bold tracking-tight">{nombrePlan(plan)}</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {t(`plans.${plan.id}.tagline`)}
      </p>

      <p className="mt-6 flex flex-wrap items-baseline gap-x-1.5">
        <span
          key={`${plan.id}-${yearly}-${currency}`}
          className={cn(
            "display text-[clamp(1.75rem,9vw,2.25rem)] tabular-nums",
            cambiado && plan.monthly[currency] !== plan.yearly[currency] && "m-price"
          )}
        >
          {formatoPrecio(price)}
        </span>
        <span className="text-sm text-muted-foreground">{t("perMonth")}</span>
      </p>
      <p
        className={cn(
          "mt-1 min-h-4 text-xs text-muted-foreground",
          cambiado && plan.id !== "free" && "m-price"
        )}
      >
        {plan.id === "free" ? null : billingNote}
      </p>

      <Button
        variant={featured ? "brand" : "outline"}
        size="lg"
        asChild
        className="mt-5 w-full"
      >
        <Link href="https://app.clipealo-ai.com/">{t(`plans.${plan.id}.cta`)}</Link>
      </Button>

      <ul className="mt-7 space-y-3 text-sm">
        {CARD_HIGHLIGHTS[plan.id].map((highlight) => (
          <li key={highlight} className="flex items-start gap-2.5">
            <Check
              className={cn(
                "mt-0.5 size-4 shrink-0",
                featured ? "text-brand" : "text-primary"
              )}
              aria-hidden
            />
            <span className="text-muted-foreground">
              {highlight === "time"
                ? t("includedTime", {
                    minutes: plan.includedMinutes,
                    hours: plan.includedMinutes / 60,
                  })
                : t(
                    `plans.${plan.id}.highlights.${highlight}` as Parameters<typeof t>[0]
                  )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Resumen de los planes en la landing; la comparativa completa vive en /precios. */
export function Pricing() {
  const t = useTranslations("marketing.pricing")
  const [yearly, setYearly] = React.useState(false)
  const [currency, setCurrency] = React.useState<PricingCurrency>("PEN")
  const encabezado = React.useRef<HTMLDivElement>(null)
  useMotionGroup(encabezado)

  return (
    <section id="precios" className="container-page scroll-mt-24 py-20 md:py-28">
      <div
        ref={encabezado}
        data-motion-group="client"
        className="mx-auto max-w-2xl text-center"
      >
        <p className="m-anim m-rise text-sm font-semibold tracking-wide text-brand uppercase">
          {t("eyebrow")}
        </p>
        <h2 className="m-anim m-cut mt-3 display text-[clamp(2rem,5vw,3.25rem)] [--i:1]">
          {t.rich("title", { br: () => <br /> })}
        </h2>
        <p className="m-anim m-rise mt-5 text-lg text-pretty text-muted-foreground [--i:2]">
          {t("lead")}
        </p>
        <div className="m-anim m-rise mt-8 [--i:3]">
          <BillingToggle
            yearly={yearly}
            onChange={setYearly}
            currency={currency}
            onCurrencyChange={setCurrency}
          />
        </div>
      </div>

      <div className="mt-14">
        <PlanCards yearly={yearly} currency={currency} entrada />
      </div>

      <div className="mt-10 flex flex-col items-center gap-3 text-center">
        <Button
          variant="ghost"
          size="lg"
          asChild
          className="h-auto min-h-9 max-w-full py-1.5 whitespace-normal"
        >
          <Link href="/precios">
            {t("compare")} <ArrowRight />
          </Link>
        </Button>
      </div>
    </section>
  )
}
