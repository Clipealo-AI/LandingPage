"use client"

import * as React from "react"
import { useTranslations } from "next-intl"

import { planDe, type PlanCatalogo, type PlanId } from "@/lib/planes"
import type { PricingPlanId } from "@/lib/pricing"
import { useCatalogoPlanes } from "@/hooks/use-catalogo-planes"

/**
 * Nombre visible de un plan. Los tres de la web lo tienen en el catálogo de
 * precios (`pricing.plans.<id>.name`); uno creado en el backoffice lo lleva
 * escrito (`nombre`), en el idioma en que se escribió, porque es contenido.
 *
 * Acepta el plan entero o su id —también el id de un escalón, que es lo que
 * llevan las clases y las puertas («es del plan Creador»)— y resuelve contra el
 * catálogo: un id que ya no existe se nombra como el plan de la demo, igual que
 * lo resuelve la cuenta.
 *
 * Estaba escrito en tres sitios (`app.sidebar.plan` con un `select` de ICU y
 * `onboarding.creador.resultado.prevision.planes.<id>`), así que renombrar
 * «Creador» dejaba las otras dos copias viejas. La del onboarding sigue viva a
 * propósito: el espacio `pricing` no viaja a esa zona (`i18n/messages.ts`) y
 * meterlo entero por tres palabras no compensa.
 */
export function useNombrePlan() {
  const t = useTranslations("pricing")
  const catalogo = useCatalogoPlanes()
  // Memoizado como `useNombreIdioma`: una función nueva por render obligaría a
  // recalcular a todo el que la reciba en dependencias
  return React.useMemo(
    () => (plan: PlanCatalogo | PlanId | PricingPlanId) => {
      const p = typeof plan === "string" ? planDe(plan, catalogo) : plan
      return p.nombre ?? t(`plans.${p.base}.name`)
    },
    [t, catalogo]
  )
}

/** Lema de la tarjeta: el escrito, o el de su escalón. */
export function useLemaPlan() {
  const t = useTranslations("pricing")
  return React.useCallback(
    (plan: PlanCatalogo) => plan.lema ?? t(`plans.${plan.base}.tagline`),
    [t]
  )
}
