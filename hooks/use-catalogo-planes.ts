"use client"

import * as React from "react"

import {
  PLANES_SEMILLA,
  PLANES_VACIO,
  aplicarPlanes,
  migrarPlanes,
  moverPlan,
  parchePlan,
  planDeBorrador,
  type BorradorPlan,
  type ParchePlan,
  type PlanCatalogo,
  type PlanId,
  type PlanesGuardados,
} from "@/lib/planes"

/**
 * El catálogo de planes que el admin edita, guardado en este navegador.
 *
 * Mismo patrón que el de preguntas: semillas + parches. De un escalón de la
 * web se guarda solo lo que cambia —precio, minutos, capacidades, si sale—,
 * nunca el plan entero: copiarlo lo congelaría, y un texto mejor en `messages/`
 * no llegaría a quien lo tocó una vez. Un plan creado se guarda entero.
 *
 * Lo que se cambia aquí se nota en /precios, en la barra lateral y en cada
 * puerta sin recargar: es lo que permite juzgar un plan antes de venderlo.
 *
 * En producción esto lo diría la API (`docs/costuras-backend.md`).
 */

export const CLAVE_CATALOGO_PLANES = "clipealo-planes-v1"
const EVENTO = "clipealo:planes"

let crudoCache: string | null = null
let valorCache: PlanesGuardados = PLANES_VACIO
let aplicadoCache: PlanCatalogo[] = PLANES_SEMILLA

function leer(): PlanesGuardados {
  let crudo: string | null = null
  try {
    crudo = window.localStorage.getItem(CLAVE_CATALOGO_PLANES)
  } catch {
    // Almacenamiento bloqueado: manda lo último de esta pestaña
    return valorCache
  }
  if (crudo === crudoCache) return valorCache
  crudoCache = crudo
  try {
    valorCache = crudo ? migrarPlanes(JSON.parse(crudo)) : PLANES_VACIO
  } catch {
    valorCache = PLANES_VACIO
  }
  aplicadoCache = aplicarPlanes(valorCache)
  return valorCache
}

/** El catálogo aplicado, con la misma referencia mientras no cambie lo guardado. */
export function leerCatalogoPlanes(): PlanCatalogo[] {
  leer()
  return aplicadoCache
}

function escribir(cambio: (g: PlanesGuardados) => PlanesGuardados) {
  const siguiente = cambio(leer())
  const crudo = JSON.stringify(siguiente)
  let guardado = true
  try {
    window.localStorage.setItem(CLAVE_CATALOGO_PLANES, crudo)
  } catch {
    guardado = false
  }
  crudoCache = guardado ? crudo : crudoCache
  valorCache = siguiente
  aplicadoCache = aplicarPlanes(siguiente)
  window.dispatchEvent(new Event(EVENTO))
}

/**
 * Solo una tarjeta destacada: al destacar `id`, los demás dejan de estarlo. De
 * una semilla se guarda el parche; de un creado, el plan.
 */
function unicoDestacado(g: PlanesGuardados, id: PlanId): PlanesGuardados {
  const cambios = { ...g.cambios }
  for (const semilla of PLANES_SEMILLA) {
    if (semilla.id === id) continue
    const actual = { ...semilla, ...cambios[semilla.id] }
    if (actual.featured)
      cambios[semilla.id] = parchePlan(semilla, { ...actual, featured: false })
  }
  return {
    ...g,
    cambios,
    creados: g.creados.map((p) =>
      p.id !== id && p.featured ? { ...p, featured: false } : p
    ),
  }
}

/** «Reiniciar demo»: vuelven los tres de fábrica. Fuera de un componente. */
export const reiniciarCatalogoPlanes = () => escribir(() => PLANES_VACIO)

function suscribir(callback: () => void) {
  const alGuardar = (e: StorageEvent) => {
    if (e.key === CLAVE_CATALOGO_PLANES || e.key === null) callback()
  }
  window.addEventListener(EVENTO, callback)
  window.addEventListener("storage", alGuardar)
  return () => {
    window.removeEventListener(EVENTO, callback)
    window.removeEventListener("storage", alGuardar)
  }
}

/** El catálogo ya aplicado: es lo que leen /precios, la app y las puertas. */
export function useCatalogoPlanes(): PlanCatalogo[] {
  return React.useSyncExternalStore(suscribir, leerCatalogoPlanes, () => PLANES_SEMILLA)
}

/** Escribir el catálogo desde el backoffice. */
export function useEditorPlanes() {
  const planes = useCatalogoPlanes()

  const acciones = React.useMemo(
    () => ({
      /**
       * Guardar un borrador: un plan creado se escribe entero; de una semilla
       * se guarda solo el parche contra lo de fábrica.
       */
      guardar: (b: BorradorPlan, id: PlanId) =>
        escribir((g0) => {
          const g = b.featured ? unicoDestacado(g0, id) : g0
          const aplicado = aplicarPlanes(g)
          const existente = aplicado.find((p) => p.id === id)
          if (b.origen === "semilla") {
            const semilla = PLANES_SEMILLA.find((p) => p.id === id)
            if (!semilla || !existente) return g
            const siguiente: PlanCatalogo = {
              ...existente,
              monthly: b.monthly,
              yearly: b.yearly,
              minutos: b.minutos,
              cuentas: b.cuentas,
              asiento: b.asiento,
              capacidades: b.capacidades,
              visible: b.visible,
              activo: b.activo,
              featured: b.featured,
            }
            return {
              ...g,
              cambios: { ...g.cambios, [id]: parchePlan(semilla, siguiente) },
            }
          }
          // Uno nuevo va al final; uno editado conserva su sitio
          const orden =
            existente?.orden ?? Math.max(-1, ...aplicado.map((p) => p.orden)) + 1
          const plan = planDeBorrador(b, id, orden)
          return {
            ...g,
            creados: existente
              ? g.creados.map((p) => (p.id === id ? plan : p))
              : [...g.creados, plan],
          }
        }),

      /** Un cambio suelto (mostrar, apagar, destacar) sin pasar por el formulario. */
      parchear: (id: PlanId, parche: ParchePlan) =>
        escribir((g0) => {
          const g = parche.featured ? unicoDestacado(g0, id) : g0
          const semilla = PLANES_SEMILLA.find((p) => p.id === id)
          if (semilla) {
            const actual = { ...semilla, ...g.cambios[id] }
            return {
              ...g,
              cambios: {
                ...g.cambios,
                [id]: parchePlan(semilla, { ...actual, ...parche }),
              },
            }
          }
          return {
            ...g,
            creados: g.creados.map((p) => (p.id === id ? { ...p, ...parche } : p)),
          }
        }),

      /** Subir o bajar un puesto. Se renumeran todos y se guarda solo lo que cambia. */
      mover: (id: PlanId, delta: -1 | 1) =>
        escribir((g) => {
          const antes = aplicarPlanes(g)
          const despues = moverPlan(antes, id, delta)
          const cambios = { ...g.cambios }
          let creados = g.creados
          for (const q of despues) {
            const previo = antes.find((x) => x.id === q.id)
            if (!previo || previo.orden === q.orden) continue
            if (q.origen === "semilla")
              cambios[q.id] = { ...cambios[q.id], orden: q.orden }
            else
              creados = creados.map((p) => (p.id === q.id ? { ...p, orden: q.orden } : p))
          }
          return { ...g, cambios, creados }
        }),

      /** Borrar: solo los creados. Un escalón de la web se apaga, no se borra. */
      borrar: (id: PlanId) =>
        escribir((g) => ({ ...g, creados: g.creados.filter((p) => p.id !== id) })),

      reiniciarCatalogoPlanes,
    }),
    []
  )

  return { planes, ...acciones }
}
