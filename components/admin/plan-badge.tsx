import type { PlanId } from "@/lib/admin/types"
import { usePlanName } from "@/components/admin/textos"
import { Badge } from "@/components/ui/badge"

const VARIANT: Record<
  PlanId,
  "outline" | "secondary" | "default" | "brand-subtle" | "ghost"
> = {
  free: "outline",
  creator: "secondary",
  business: "default",
  interno: "ghost",
}

/** Etiqueta de plan. Empresa en azul (estructura), Prueba en contorno, Interno apagado. */
export function PlanBadge({ plan }: { plan: PlanId }) {
  const planName = usePlanName()
  return (
    <Badge variant={VARIANT[plan]} className="font-medium">
      {planName(plan)}
    </Badge>
  )
}
