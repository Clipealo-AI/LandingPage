"use client"

import * as React from "react"

import {
  CLAVE_AVISOS,
  avisosPorDefecto,
  migrarAvisos,
  type CanalAviso,
  type PreferenciasAviso,
} from "@/lib/ajustes"

/**
 * Qué avisos quiere recibir esta cuenta y por dónde.
 *
 * Antes era un `useState` de la pantalla: apagar «Novedades» duraba hasta
 * cambiar de pestaña, y la página no decía en ningún sitio que no se estuviera
 * guardando. Ahora es un ajuste de verdad, con el mismo patrón que el resto
 * (`hooks/use-plan.ts`): clave versionada, caché de dos niveles, migración en
 * `lib/` y aviso a las demás pestañas.
 *
 * En producción esto lo diría el servidor. Cuando exista, lo único que cambia
 * es de dónde salen `leer` y `poner`; la pantalla no se entera.
 */

const EVENTO = "clipealo:avisos"
const VACIO = avisosPorDefecto()

let crudoCache: string | null = null
let valorCache: PreferenciasAviso = VACIO

function leer(): PreferenciasAviso {
  let crudo: string | null = null
  try {
    crudo = window.localStorage.getItem(CLAVE_AVISOS)
  } catch {
    // Almacenamiento bloqueado: manda lo último elegido en esta pestaña
    return valorCache
  }
  if (crudo === crudoCache) return valorCache
  crudoCache = crudo
  try {
    valorCache = migrarAvisos(crudo ? JSON.parse(crudo) : null)
  } catch {
    valorCache = VACIO
  }
  return valorCache
}

function guardar(siguiente: PreferenciasAviso) {
  const crudo = JSON.stringify(siguiente)
  try {
    window.localStorage.setItem(CLAVE_AVISOS, crudo)
  } catch {
    // Sin almacenamiento el cambio vive hasta recargar, como el resto de la demo
  }
  crudoCache = crudo
  valorCache = siguiente
  window.dispatchEvent(new Event(EVENTO))
}

/** «Reiniciar demo»: los avisos vuelven a lo que trae una cuenta nueva. */
export const reiniciarAvisos = () => guardar(avisosPorDefecto())

function suscribir(callback: () => void) {
  const alGuardar = (e: StorageEvent) => {
    if (e.key === CLAVE_AVISOS) callback()
  }
  window.addEventListener(EVENTO, callback)
  window.addEventListener("storage", alGuardar)
  return () => {
    window.removeEventListener(EVENTO, callback)
    window.removeEventListener("storage", alGuardar)
  }
}

export function useAvisos() {
  const avisos = React.useSyncExternalStore(suscribir, leer, () => VACIO)
  const cambiar = React.useCallback(
    (tipo: string, canal: CanalAviso, valor: boolean) =>
      guardar({ ...leer(), [tipo]: { ...leer()[tipo], [canal]: valor } }),
    []
  )
  return { avisos, cambiar }
}
