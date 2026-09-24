"use client"

import * as React from "react"

import {
  PROGRESO_VACIO,
  completar,
  migrarProgreso,
  ocultarRuta,
  reiniciar,
  verSegundo,
  type Leccion,
  type ProgresoFormacion,
} from "@/lib/formacion"

/**
 * Lo que el clipero lleva visto de Formación, en su navegador.
 *
 * Mismo patrón que `hooks/use-cuenta.ts`: `useSyncExternalStore`, clave propia,
 * evento propio más `storage` (para que dos pestañas no se pisen), caché del
 * valor crudo y lectura en try/catch con `migrarProgreso`. No hay backend: el
 * avance es del navegador hasta que exista la API.
 *
 * Vive aquí y no en `hooks/` porque `hooks/` es de otro agente esta semana;
 * cuando se pueda, este archivo se mueve tal cual a `hooks/use-formacion.ts`.
 */

export const CLAVE_FORMACION = "clipealo-formacion-v1"
const EVENTO = "clipealo:formacion"

let crudoCache: string | null = null
let valorCache: ProgresoFormacion = PROGRESO_VACIO

function leer(): ProgresoFormacion {
  let crudo: string | null = null
  try {
    crudo = window.localStorage.getItem(CLAVE_FORMACION)
  } catch {
    // Almacenamiento bloqueado: se trabaja en memoria
  }
  if (crudo === crudoCache) return valorCache
  crudoCache = crudo
  try {
    valorCache = crudo ? migrarProgreso(JSON.parse(crudo)) : PROGRESO_VACIO
  } catch {
    valorCache = PROGRESO_VACIO
  }
  return valorCache
}

/** `true` si se guardó de verdad; `false` si solo vive en memoria hasta recargar. */
function escribir(cambio: (p: ProgresoFormacion) => ProgresoFormacion): boolean {
  const actual = leer()
  const nuevo = cambio(actual)
  if (nuevo === actual) return true
  const crudo = JSON.stringify(nuevo)
  let guardado = true
  try {
    window.localStorage.setItem(CLAVE_FORMACION, crudo)
  } catch {
    guardado = false
  }
  // Sin almacenamiento, la caché sigue al valor en memoria
  crudoCache = guardado ? crudo : crudoCache
  valorCache = nuevo
  window.dispatchEvent(new Event(EVENTO))
  return guardado
}

function suscribir(callback: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === CLAVE_FORMACION || e.key === null) callback()
  }
  window.addEventListener(EVENTO, callback)
  window.addEventListener("storage", onStorage)
  return () => {
    window.removeEventListener(EVENTO, callback)
    window.removeEventListener("storage", onStorage)
  }
}

const ahora = () => new Date().toISOString()

/**
 * ¿Guarda algo este navegador? Llamar en un manejador o en un efecto, nunca en
 * el render: en modo incógnito escribir lanza y eso hay que avisarlo una vez.
 */
export function almacenamientoDisponible(): boolean {
  try {
    const prueba = `${CLAVE_FORMACION}:prueba`
    window.localStorage.setItem(prueba, "1")
    window.localStorage.removeItem(prueba)
    return true
  } catch {
    return false
  }
}

/** Borra el avance. Lo usa «Reiniciar demo» si algún día lo pide. */
export function reiniciarFormacion() {
  try {
    window.localStorage.removeItem(CLAVE_FORMACION)
  } catch {
    // Nada que borrar
  }
  crudoCache = null
  valorCache = PROGRESO_VACIO
  window.dispatchEvent(new Event(EVENTO))
}

export function useProgresoFormacion() {
  const progreso = React.useSyncExternalStore(suscribir, leer, () => PROGRESO_VACIO)

  const acciones = React.useMemo(
    () => ({
      /** Avanza el punto visto de una clase (lo llama el reproductor). */
      ver: (leccion: Leccion, segundo: number) =>
        escribir((p) => verSegundo(p, leccion, segundo, ahora())),
      /** «La he visto», con o sin video. Devuelve `false` si no se pudo guardar. */
      completar: (leccion: Leccion) => escribir((p) => completar(p, leccion, ahora())),
      reiniciar: (leccion: Leccion) => escribir((p) => reiniciar(p, leccion)),
      /**
       * «Ya me lo sé»: aparta la ruta de arriba sin tocar su avance. Se guarda
       * porque la decisión es de la persona y tiene que aguantar la recarga; y
       * se puede deshacer, que es lo que la separa de borrar algo.
       */
      ocultarRuta: (rutaId: string, oculta: boolean) =>
        escribir((p) => ocultarRuta(p, rutaId, oculta)),
    }),
    []
  )

  return { progreso, ...acciones }
}
