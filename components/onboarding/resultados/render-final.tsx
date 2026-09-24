"use client"

import { useFlujo } from "@/components/onboarding/contexto"
import { ResultClipero } from "@/components/onboarding/resultados/result-clipero"
import { ResultCreador } from "@/components/onboarding/resultados/result-creador"
import { ResultExpres } from "@/components/onboarding/resultados/result-expres"

/**
 * El paso `render` del clipero: exprés (invitación) → render corto; «mis
 * videos» → resultado del creador; campañas y las dos cosas → resultado del
 * clipero (§6.1-§6.2, §2.7).
 */
export function RenderFinal() {
  const ctx = useFlujo()
  if (ctx.modo === "expres") return <ResultExpres />
  if (ctx.cuenta.clipero.objetivo === "mis-videos") return <ResultCreador />
  return <ResultClipero />
}
