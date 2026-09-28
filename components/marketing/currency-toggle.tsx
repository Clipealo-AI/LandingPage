"use client"

import { useTranslations } from "next-intl"

import { PRICING_CURRENCIES, type PricingCurrency } from "@/lib/pricing"
import { cn } from "@/lib/utils"

export function CurrencyToggle({
  value,
  onChange,
  className,
}: {
  value: PricingCurrency
  onChange: (currency: PricingCurrency) => void
  className?: string
}) {
  const t = useTranslations("pricing.billing")

  return (
    <div
      role="group"
      aria-label={t("currencyLabel")}
      className={cn("flex w-fit items-center gap-1 rounded-full bg-muted p-1", className)}
    >
      {PRICING_CURRENCIES.map((currency) => (
        <button
          key={currency}
          type="button"
          aria-pressed={value === currency}
          onClick={() => onChange(currency)}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
            value === currency
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <span aria-hidden="true" className="mr-1 text-[10px] font-bold opacity-75">
            {currency === "PEN" ? "PE" : "US"}
          </span>
          {t(currency === "PEN" ? "soles" : "dollars")}
        </button>
      ))}
    </div>
  )
}
