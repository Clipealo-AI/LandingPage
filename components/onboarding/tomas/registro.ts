import type { ComponentType } from "react"

import { esRender, type PASOS_RENDER, type PasoId } from "@/lib/onboarding"
import { TomaAlcance } from "@/components/onboarding/tomas/alcance"
import { TomaBasicos } from "@/components/onboarding/tomas/basicos"
import { TomaCanal } from "@/components/onboarding/tomas/canal"
import { TomaCuenta } from "@/components/onboarding/tomas/cuenta"
import { TomaDirecto } from "@/components/onboarding/tomas/directo"
import { TomaFandom } from "@/components/onboarding/tomas/fandom"
import { TomaNichos } from "@/components/onboarding/tomas/nichos"
import { TomaObjetivo } from "@/components/onboarding/tomas/objetivo"
import { TomaOrg } from "@/components/onboarding/tomas/org"
import { TomaPromocion } from "@/components/onboarding/tomas/promocion"
import { TomaRedes } from "@/components/onboarding/tomas/redes"
import { TomaTipoOrg } from "@/components/onboarding/tomas/tipo-org"
import { RenderFinal } from "@/components/onboarding/resultados/render-final"
import { ResultAgencia } from "@/components/onboarding/resultados/result-agencia"

export type PasoRender = (typeof PASOS_RENDER)[number]
export type PasoToma = Exclude<PasoId, PasoRender>

export const esPasoToma = (p: PasoId): p is PasoToma => !esRender(p)

/**
 * Registro de tomas: `PasoId` → componente. Cada toma es un componente sin
 * props que lee `useFlujo()` y pinta `<Toma>`. Para sustituir una toma basta
 * con reescribir su archivo manteniendo el nombre exportado.
 */
export const TOMAS: Record<PasoToma, ComponentType> = {
  cuenta: TomaCuenta,
  objetivo: TomaObjetivo,
  nichos: TomaNichos,
  fandom: TomaFandom,
  redes: TomaRedes,
  basicos: TomaBasicos,
  directo: TomaDirecto,
  canal: TomaCanal,
  "tipo-org": TomaTipoOrg,
  org: TomaOrg,
  promocion: TomaPromocion,
  alcance: TomaAlcance,
}

/**
 * El final de cada flujo, a todo el ancho y sin Monitor. `render` decide entre
 * clipero, creador y exprés (`render-final.tsx`).
 */
export const RENDERS: Record<PasoRender, ComponentType> = {
  render: RenderFinal,
  "render-agencia": ResultAgencia,
}
