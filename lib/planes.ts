import { PLANS, type PricingPlan, type PricingPlanId } from "@/lib/pricing"

/** Presentación estática y tipada del catálogo comercial. */
export type PlanId = PricingPlanId

export interface PlanCatalogo extends PricingPlan {
  base: PricingPlanId
  orden: number
}

export const PLANES_SEMILLA: PlanCatalogo[] = PLANS.map((plan, orden) => ({
  ...plan,
  base: plan.id,
  orden,
}))

export function planDe(
  ref: PlanId | PlanCatalogo | null | undefined,
  catalogo: readonly PlanCatalogo[] = PLANES_SEMILLA
): PlanCatalogo {
  const id = typeof ref === "string" ? ref : ref?.id
  return catalogo.find((plan) => plan.id === id) ?? catalogo[1] ?? PLANES_SEMILLA[0]
}

export const planesVisibles = (catalogo: readonly PlanCatalogo[]) => [...catalogo]
