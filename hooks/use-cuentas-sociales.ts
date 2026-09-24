"use client"

import * as React from "react"

import { cuentaActiva, socialAccounts, type SocialAccount } from "@/lib/social"

/**
 * Las cuentas conectadas de este navegador.
 *
 * Hasta ahora vivían en un `useState` dentro de Ajustes › Cuentas conectadas, así
 * que conectar una red se perdía al recargar y el resto de la app nunca se
 * enteraba. El Calendario no puede trabajar así: necesita saber a qué cuenta
 * programa, y que desconectar una red se vea en la agenda al momento.
 *
 * Mismo patrón que el resto del estado del navegador (`hooks/use-cuenta.ts`):
 * localStorage con versión, `useSyncExternalStore` y un evento propio para que
 * todas las pestañas abiertas se enteren.
 */

interface Persistido {
  /** Ids de las cuentas semilla que se han desconectado. */
  desconectadas: string[]
  /** Las que se han conectado desde Ajustes. */
  anadidas: SocialAccount[]
}

const CLAVE = "clipealo-cuentas-v1"
const EVENTO = "clipealo:cuentas"

const VACIO: Persistido = { desconectadas: [], anadidas: [] }

let crudoCache: string | null = null
let valorCache: Persistido = VACIO

function leer(): Persistido {
  let crudo: string | null = null
  try {
    crudo = window.localStorage.getItem(CLAVE)
  } catch {
    // Almacenamiento bloqueado: manda lo último que se hizo en esta pestaña.
    // Devolver VACIO aquí borraba cada cambio en el mismo instante de hacerlo
    return valorCache
  }
  if (crudo === crudoCache) return valorCache
  crudoCache = crudo
  if (!crudo) {
    valorCache = VACIO
    return valorCache
  }
  try {
    const leido = JSON.parse(crudo) as Partial<Persistido>
    valorCache = {
      desconectadas: Array.isArray(leido.desconectadas) ? leido.desconectadas : [],
      anadidas: Array.isArray(leido.anadidas) ? leido.anadidas : [],
    }
  } catch {
    valorCache = VACIO
  }
  return valorCache
}

function escribir(cambio: (p: Persistido) => Persistido) {
  const siguiente = cambio(leer())
  try {
    const crudo = JSON.stringify(siguiente)
    window.localStorage.setItem(CLAVE, crudo)
    crudoCache = crudo
    valorCache = siguiente
  } catch {
    valorCache = siguiente
  }
  window.dispatchEvent(new Event(EVENTO))
}

/** «Reiniciar demo»: vuelven las cuentas semilla. Fuera de un componente. */
export const reiniciarCuentas = () => escribir(() => VACIO)

function suscribir(callback: () => void) {
  const alGuardar = (e: StorageEvent) => {
    if (e.key === CLAVE) callback()
  }
  window.addEventListener(EVENTO, callback)
  window.addEventListener("storage", alGuardar)
  return () => {
    window.removeEventListener(EVENTO, callback)
    window.removeEventListener("storage", alGuardar)
  }
}

export function useCuentasSociales() {
  const p = React.useSyncExternalStore(suscribir, leer, () => VACIO)

  const cuentas = React.useMemo(
    () => [
      ...socialAccounts.filter((c) => !p.desconectadas.includes(c.id)),
      ...p.anadidas,
    ],
    [p.desconectadas, p.anadidas]
  )

  const acciones = React.useMemo(
    () => ({
      /**
       * Volver a conectar una cuenta semilla es quitarla de las desconectadas;
       * añadirla otra vez la duplicaría en la lista.
       */
      conectar: (cuenta: SocialAccount) =>
        escribir((s) => {
          const esSemilla = socialAccounts.some((c) => c.id === cuenta.id)
          return {
            desconectadas: s.desconectadas.filter((id) => id !== cuenta.id),
            anadidas:
              esSemilla || s.anadidas.some((c) => c.id === cuenta.id)
                ? s.anadidas
                : [...s.anadidas, cuenta],
          }
        }),
      desconectar: (id: string) =>
        escribir((s) => ({
          desconectadas: s.desconectadas.includes(id)
            ? s.desconectadas
            : [...s.desconectadas, id],
          anadidas: s.anadidas.filter((c) => c.id !== id),
        })),
      reiniciarCuentas,
    }),
    []
  )

  return { cuentas, activas: cuentas.filter(cuentaActiva), ...acciones }
}
