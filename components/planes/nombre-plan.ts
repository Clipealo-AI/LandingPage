"use client"

import * as React from "react"
import { useTranslations } from "next-intl"

import { planDe, type PlanCatalogo, type PlanId } from "@/lib/planes"
import type { PricingPlanId } from "@/lib/pricing"

/** Nombre traducido de uno de los planes públicos. */
export function useNombrePlan() {
  const t = useTranslations("pricing")
  return React.useCallback(
    (plan: PlanCatalogo | PlanId | PricingPlanId) => {
      const seleccionado = typeof plan === "string" ? planDe(plan) : plan
      return t(`plans.${seleccionado.base}.name`)
    },
    [t]
  )
}

/** Lema traducido del plan público. */
function useLemaPlan() {
  const t = useTranslations("pricing")
  return React.useCallback(
    (plan: PlanCatalogo) => t(`plans.${plan.base}.tagline`),
    [t]
  )
}
