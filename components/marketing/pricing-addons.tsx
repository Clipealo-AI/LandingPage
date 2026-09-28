"use client"

import * as React from "react"
import { Minus, Plus } from "lucide-react"
import { useTranslations } from "next-intl"

import { usePrecio } from "@/components/planes/precio"
import { Link } from "@/i18n/navigation"
import {
  EXTRA_HOUR_MAX,
  EXTRA_HOUR_MIN,
  EXTRA_HOUR_PRICE_PEN,
  EXTRA_HOUR_PRICE_USD,
  type PricingCurrency,
} from "@/lib/pricing"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const RECHARGE_URL = "https://app.clipealo-ai.com/plan/recharge"

export function PricingAddons({
  currency,
  onCurrencyChange,
}: {
  currency: PricingCurrency
  onCurrencyChange: (currency: PricingCurrency) => void
}) {
  const t = useTranslations("pricing.topups")
  const billing = useTranslations("pricing.billing")
  const formatPrice = usePrecio(currency)
  const [enteredHours, setEnteredHours] = React.useState("1")
  const hours = Number(enteredHours)
  const hasHours = enteredHours !== ""
  const unitPrice = currency === "PEN" ? EXTRA_HOUR_PRICE_PEN : EXTRA_HOUR_PRICE_USD

  function setClampedHours(value: string) {
    const digits = value.replace(/\D/g, "")
    if (digits === "") {
      setEnteredHours("")
      return
    }
    const parsed = Number(digits)
    if (!Number.isFinite(parsed)) return
    setEnteredHours(
      String(Math.min(EXTRA_HOUR_MAX, Math.max(EXTRA_HOUR_MIN, Math.trunc(parsed))))
    )
  }

  function changeHours(delta: number) {
    const current = hasHours ? hours : EXTRA_HOUR_MIN
    setEnteredHours(
      String(Math.min(EXTRA_HOUR_MAX, Math.max(EXTRA_HOUR_MIN, current + delta)))
    )
  }

  return (
    <section id="recargas" className="container-page scroll-mt-24 py-12 md:py-16">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-frame bg-card ring-1 ring-border lg:grid-cols-2">
        <div className="flex min-w-0 flex-col justify-center p-6 sm:p-8 lg:p-10">
          <h2 className="max-w-lg display text-[clamp(2rem,3vw,2.25rem)] text-balance">
            {t("title")}
          </h2>
          <p className="mt-4 max-w-md text-pretty text-muted-foreground">
            {t("description")}
          </p>
        </div>

        <div className="min-w-0 border-t border-border p-6 sm:p-8 lg:border-t-0 lg:border-l">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label
              htmlFor="custom-recharge-hours"
              className="block text-sm font-semibold"
            >
              {t("quantityLabel")}
            </label>
            <div
              role="group"
              aria-label={billing("currencyLabel")}
              className="flex w-fit items-center gap-1 rounded-full bg-muted p-1"
            >
              {(["PEN", "USD"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={currency === value}
                  onClick={() => onCurrencyChange(value)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
                    currency === value
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span className="mr-1 text-[10px] font-bold opacity-75">
                    {value === "PEN" ? "PE" : "US"}
                  </span>{" "}
                  {t(value === "PEN" ? "soles" : "dollars")}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex max-w-sm items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={t("decrease")}
              disabled={hasHours && hours <= EXTRA_HOUR_MIN}
              onClick={() => changeHours(-1)}
            >
              <Minus aria-hidden="true" />
            </Button>
            <input
              id="custom-recharge-hours"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={enteredHours}
              onChange={(event) => setClampedHours(event.target.value)}
              onBlur={() => {
                if (!hasHours) setEnteredHours(String(EXTRA_HOUR_MIN))
              }}
              className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 text-center text-lg font-semibold text-foreground tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={t("increase")}
              disabled={hasHours && hours >= EXTRA_HOUR_MAX}
              onClick={() => changeHours(1)}
            >
              <Plus aria-hidden="true" />
            </Button>
          </div>

          <div className="mt-5 rounded-xl bg-muted/50 p-4" aria-live="polite">
            <p className="text-sm font-medium text-muted-foreground">
              {t("estimateTitle")}
            </p>
            <output className="mt-1 block text-3xl font-bold tracking-tight text-foreground tabular-nums sm:text-4xl">
              {hasHours ? formatPrice(hours * unitPrice) : "—"}
            </output>
          </div>

          <Button variant="brand" asChild className="mt-5 w-full sm:w-auto">
            <Link href={RECHARGE_URL}>{t("goToPlan")}</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
