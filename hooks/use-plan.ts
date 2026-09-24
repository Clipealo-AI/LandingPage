"use client"

import * as React from "react"

import { CLAVE_PLAN, PLAN_DEMO } from "@/lib/pricing"
import { planDe, type PlanCatalogo, type PlanId } from "@/lib/planes"
import { leerCatalogoPlanes, useCatalogoPlanes } from "@/hooks/use-catalogo-planes"

/**
 * El plan de la cuenta en la demo.
 *
 * Antes vivía copiado en `usage.plan` y en `suscripcionDemo.plan`, los dos fijos
 * en «creator» y sin nada que los sincronizara: la barra lateral y Facturación
 * podían decir cosas distintas, y ver la experiencia Prueba obligaba a tocar el
 * código. Ahora es un solo id guardado, y lo que se devuelve es el plan entero
 * resuelto contra el catálogo (`lib/planes.ts`): quien lo lee tiene minutos,
 * precios y capacidades sin volver a mirar ninguna tabla.
 *
 * Mismo patrón que `hooks/use-agenda.ts`: clave versionada, caché de dos
 * niveles, evento propio para esta pestaña y `storage` para las demás. En el
 * servidor vale `PLAN_DEMO` y el cliente corrige al hidratar: mientras el
 * candado se decida en React y no en CSS, ese parpadeo existe y no hay atributo
 * de arranque que lo quite.
 *
 * En producción esto lo diría la sesión, no el navegador.
 */

const EVENTO = "clipealo:plan"

let crudoCache: string | null = null
let valorCache: PlanId = PLAN_DEMO

function leer(): PlanId {
  let crudo: string | null = null
  try {
    crudo = window.localStorage.getItem(CLAVE_PLAN)
  } catch {
    // Almacenamiento bloqueado: manda lo último que se eligió en esta pestaña
    return valorCache
  }
  if (crudo === crudoCache) return valorCache
  crudoCache = crudo
  // Solo el id: si ya no está en el catálogo, `planDe` lo hace caer al de la demo
  valorCache = crudo && crudo.trim() ? crudo : PLAN_DEMO
  return valorCache
}

/** Cambiar de plan. Fuera de un componente también: lo usan «Reiniciar demo» y conceder el perfil. */
export function cambiarPlan(plan: PlanId) {
  try {
    window.localStorage.setItem(CLAVE_PLAN, plan)
  } catch {
    // Sin almacenamiento el cambio vive hasta recargar, como el resto de la demo
  }
  crudoCache = plan
  valorCache = plan
  window.dispatchEvent(new Event(EVENTO))
}

/** «Reiniciar demo»: el plan vuelve al de la demo. */
export const reiniciarPlan = () => cambiarPlan(PLAN_DEMO)

/** El plan resuelto, fuera de un componente. */
export const leerPlan = (): PlanCatalogo => planDe(leer(), leerCatalogoPlanes())

function suscribir(callback: () => void) {
  const alGuardar = (e: StorageEvent) => {
    if (e.key === CLAVE_PLAN || e.key === null) callback()
  }
  window.addEventListener(EVENTO, callback)
  window.addEventListener("storage", alGuardar)
  return () => {
    window.removeEventListener(EVENTO, callback)
    window.removeEventListener("storage", alGuardar)
  }
}

export function usePlan() {
  const planId = React.useSyncExternalStore(suscribir, leer, () => PLAN_DEMO)
  const catalogo = useCatalogoPlanes()
  // En el servidor el catálogo son las semillas y el id el de la demo: el mismo
  // plan que el primer render del cliente, sin desajuste de hidratación
  const plan = React.useMemo(() => planDe(planId, catalogo), [planId, catalogo])
  return { plan, cambiarPlan }
}
