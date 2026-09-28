"use client"

import * as React from "react"
import { useLocale } from "next-intl"

import { formatPrecio } from "@/lib/pricing"
import type { PricingCurrency } from "@/lib/pricing"

/**
 * Precio con la moneda elegida en el catálogo. Se comparte entre tarjetas,
 * comparativa y recargas para que un cambio de divisa sea consistente.
 */
export function usePrecio(currency: PricingCurrency) {
  const locale = useLocale()
  return React.useCallback(
    (n: number) => formatPrecio(n, currency, locale),
    [currency, locale]
  )
}
