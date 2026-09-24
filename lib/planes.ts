import {
  NETWORKS_BY_PLAN,
  PLANS,
  type FeatureRow,
  type FeatureValue,
  type PricingPlan,
  type PricingPlanId,
} from "@/lib/pricing"
import type { SocialId } from "@/lib/social"

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

export const redesDe = (plan: PlanCatalogo): readonly SocialId[] =>
  NETWORKS_BY_PLAN[plan.base]

function valorCelda(row: FeatureRow, plan: PlanCatalogo): FeatureValue {
  return row.values[plan.base]
}
