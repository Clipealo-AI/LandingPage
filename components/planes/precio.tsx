"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"

import { MONEDA, precio } from "@/lib/pricing"

/**
 * Precio con su moneda en el idioma: «14,50 US$» · «US$14.50» · «US$ 14,50».
 * Lo comparten las tarjetas y la cabecera de la comparativa.
 */
export function usePrecio() {
  const t = useTranslations("pricing")
  const locale = useLocale()
  return React.useCallback(
    (n: number) => t("price", { amount: precio(n, locale), currency: MONEDA }),
    [t, locale]
  )
}
