"use client"

import * as React from "react"

import {
  COPIA_VACIA,
  PUBLICACION_VACIA,
  claveCopia,
  clavePlantilla,
  copiaEfectiva,
  migrarPublicacion,
  type ClipDePublicacion,
  type CopiaPublicacion,
  type PublicacionGuardada,
} from "@/lib/publicacion"
import type { SocialId } from "@/lib/social"

/**
 * El texto de publicación de cada clip y de cada proyecto, guardado en este
 * navegador. Se escribe al teclear: nadie quiere perder un texto de 2.000
 * caracteres por cambiar de pestaña.
 *
 * Dos mapas, como en `lib/publicacion.ts`: la plantilla del proyecto y lo
 * propio de cada clip. Lo guardado por la versión anterior era por proyecto,
 * así que al leerlo se convierte en plantilla y nadie pierde nada.
 *
 * Mismo patrón que el resto del estado del navegador (`hooks/use-agenda.ts`).
 * En producción viajarían con el clip (`docs/costuras-backend.md`).
 */

export const CLAVE_PUBLICACION = "clipealo-publicacion-v1"
const EVENTO = "clipealo:publicacion"

let crudoCache: string | null = null
let valorCache: PublicacionGuardada = PUBLICACION_VACIA

function leer(): PublicacionGuardada {
  let crudo: string | null = null
  try {
    crudo = window.localStorage.getItem(CLAVE_PUBLICACION)
  } catch {
    // Almacenamiento bloqueado: manda lo último de esta pestaña
    return valorCache
  }
  if (crudo === crudoCache) return valorCache
  crudoCache = crudo
  try {
    valorCache = crudo ? migrarPublicacion(JSON.parse(crudo)) : PUBLICACION_VACIA
  } catch {
    valorCache = PUBLICACION_VACIA
  }
  return valorCache
}

/** Lo guardado, fuera de un componente: lo necesita quien envía a la red. */
export const leerPublicacion = () => leer()

function escribir(cambio: (g: PublicacionGuardada) => PublicacionGuardada) {
  const siguiente = cambio(leer())
  const crudo = JSON.stringify(siguiente)
  let guardado = true
  try {
    window.localStorage.setItem(CLAVE_PUBLICACION, crudo)
  } catch {
    guardado = false
  }
  crudoCache = guardado ? crudo : crudoCache
  valorCache = siguiente
  window.dispatchEvent(new Event(EVENTO))
}

/** «Reiniciar demo»: se vacían las copias y las plantillas. Fuera de un componente. */
export const reiniciarPublicacion = () => escribir(() => PUBLICACION_VACIA)

function suscribir(callback: () => void) {
  const alGuardar = (e: StorageEvent) => {
    if (e.key === CLAVE_PUBLICACION || e.key === null) callback()
  }
  window.addEventListener(EVENTO, callback)
  window.addEventListener("storage", alGuardar)
  return () => {
    window.removeEventListener(EVENTO, callback)
    window.removeEventListener("storage", alGuardar)
  }
}

function sinClave(mapa: Record<string, CopiaPublicacion>, clave: string) {
  const copia = { ...mapa }
  delete copia[clave]
  return copia
}

export function usePublicacion() {
  const guardado = React.useSyncExternalStore(suscribir, leer, () => PUBLICACION_VACIA)

  const acciones = React.useMemo(
    () => ({
      /** El texto propio de un clip en una red. */
      guardarCopia: (clipId: string, red: SocialId, copia: CopiaPublicacion) =>
        escribir((g) => ({
          ...g,
          copias: { ...g.copias, [claveCopia(clipId, red)]: copia },
        })),

      /** Volver a la plantilla del proyecto: se borra lo propio del clip. */
      vaciarCopia: (clipId: string, red: SocialId) =>
        escribir((g) => ({ ...g, copias: sinClave(g.copias, claveCopia(clipId, red)) })),

      /** La plantilla de un proyecto en una red: la heredan sus clips. */
      guardarPlantilla: (proyectoId: string, red: SocialId, copia: CopiaPublicacion) =>
        escribir((g) => ({
          ...g,
          plantillas: { ...g.plantillas, [clavePlantilla(proyectoId, red)]: copia },
        })),

      vaciarPlantilla: (proyectoId: string, red: SocialId) =>
        escribir((g) => ({
          ...g,
          plantillas: sinClave(g.plantillas, clavePlantilla(proyectoId, red)),
        })),

      reiniciarPublicacion,
    }),
    []
  )

  /** Lo que de verdad sale: lo del clip, o la plantilla de su proyecto. */
  const copiaDe = React.useCallback(
    (clip: ClipDePublicacion, red: SocialId): CopiaPublicacion =>
      copiaEfectiva(guardado, clip, red),
    [guardado]
  )

  /** Solo lo propio del clip, sin heredar: es lo que edita su ficha. */
  const copiaPropia = React.useCallback(
    (clipId: string, red: SocialId): CopiaPublicacion =>
      guardado.copias[claveCopia(clipId, red)] ?? COPIA_VACIA,
    [guardado]
  )

  const plantillaDe = React.useCallback(
    (proyectoId: string, red: SocialId): CopiaPublicacion =>
      guardado.plantillas[clavePlantilla(proyectoId, red)] ?? COPIA_VACIA,
    [guardado]
  )

  return { guardado, copiaDe, copiaPropia, plantillaDe, ...acciones }
}
