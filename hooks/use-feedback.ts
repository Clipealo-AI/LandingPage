"use client"

import * as React from "react"

import {
  archivar,
  feedbackSemilla,
  limpiarFeedback,
  limpiarParcheFeedback,
  marcarLeido,
  marcarVisto,
  responder,
  type Feedback,
} from "@/lib/feedback"

/**
 * El casillero, guardado en este navegador.
 *
 * Mismo patrón que el catálogo de Formación: semillas + parches. Lo que una
 * agencia escribe en /ayuda aparece en /admin/feedback sin recargar, y la
 * respuesta que el equipo escribe allí vuelve a Ayuda › Tus mensajes por el
 * mismo camino. Es la única forma de poder juzgar el circuito entero antes de
 * que exista el servidor.
 *
 * Un mensaje NO se borra nunca: se archiva. Lo que alguien se molestó en
 * escribir no se tira, y menos desde el otro lado.
 */

export const CLAVE_FEEDBACK = "clipealo-feedback-v1"
const EVENTO = "clipealo:feedback"

interface Persistido {
  /** Los que se han escrito en este navegador. */
  creados: Feedback[]
  /** id → lo que cambió (estado, respuesta). También sobre las semillas. */
  cambios: Record<string, Partial<Feedback>>
}

const VACIO: Persistido = { creados: [], cambios: {} }

let crudoCache: string | null = null
let valorCache: Persistido = VACIO

function migrar(guardado: unknown): Persistido {
  if (!guardado || typeof guardado !== "object") return VACIO
  const g = guardado as Partial<Persistido>
  const creados = (Array.isArray(g.creados) ? g.creados : [])
    .map(limpiarFeedback)
    .filter((f): f is Feedback => f !== null)
  const ids = new Set([...feedbackSemilla.map((f) => f.id), ...creados.map((f) => f.id)])
  const cambios: Record<string, Partial<Feedback>> = {}
  for (const [id, parche] of Object.entries(g.cambios ?? {})) {
    // Un parche a un mensaje que ya no está no sirve de nada
    if (!ids.has(id) || !parche || typeof parche !== "object") continue
    cambios[id] = limpiarParcheFeedback(parche)
  }
  return { creados, cambios }
}

function leer(): Persistido {
  let crudo: string | null = null
  try {
    crudo = window.localStorage.getItem(CLAVE_FEEDBACK)
  } catch {
    // Almacenamiento bloqueado: manda lo último de esta pestaña
    return valorCache
  }
  if (crudo === crudoCache) return valorCache
  crudoCache = crudo
  try {
    valorCache = crudo ? migrar(JSON.parse(crudo)) : VACIO
  } catch {
    valorCache = VACIO
  }
  return valorCache
}

function escribir(cambio: (p: Persistido) => Persistido) {
  const siguiente = cambio(leer())
  const crudo = JSON.stringify(siguiente)
  let guardado = true
  try {
    window.localStorage.setItem(CLAVE_FEEDBACK, crudo)
  } catch {
    guardado = false
  }
  crudoCache = guardado ? crudo : crudoCache
  valorCache = siguiente
  window.dispatchEvent(new Event(EVENTO))
}

/** «Reiniciar demo»: vuelve la cola de semillas. Fuera de un componente. */
export const reiniciarFeedback = () => escribir(() => VACIO)

function suscribir(callback: () => void) {
  const alGuardar = (e: StorageEvent) => {
    if (e.key === CLAVE_FEEDBACK || e.key === null) callback()
  }
  window.addEventListener(EVENTO, callback)
  window.addEventListener("storage", alGuardar)
  return () => {
    window.removeEventListener(EVENTO, callback)
    window.removeEventListener("storage", alGuardar)
  }
}

const aplicar = (p: Persistido): Feedback[] =>
  [...feedbackSemilla, ...p.creados]
    .map((f) => (p.cambios[f.id] ? { ...f, ...p.cambios[f.id] } : f))
    .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn))

export function useFeedback() {
  const p = React.useSyncExternalStore(suscribir, leer, () => VACIO)
  const mensajes = React.useMemo(() => aplicar(p), [p])

  const acciones = React.useMemo(
    () => ({
      /** Lo manda quien usa la app. Nace «nuevo» y nadie lo ha leído. */
      enviar: (f: Feedback) => escribir((s) => ({ ...s, creados: [...s.creados, f] })),

      /** Un parche del dominio (leer, responder, archivar, marcar visto). */
      parchear: (id: string, parche: Partial<Feedback>) =>
        Object.keys(parche).length === 0
          ? undefined
          : escribir((s) => ({
              ...s,
              cambios: { ...s.cambios, [id]: { ...s.cambios[id], ...parche } },
            })),
    }),
    []
  )

  /** Azúcar para el backoffice: las tres acciones del dominio, ya atadas. */
  const equipo = React.useMemo(
    () => ({
      leer: (f: Feedback) => acciones.parchear(f.id, marcarLeido(f)),
      responder: (f: Feedback, texto: string, en: string) =>
        acciones.parchear(f.id, responder(texto, en)),
      archivar: (f: Feedback) => acciones.parchear(f.id, archivar()),
      visto: (f: Feedback) => acciones.parchear(f.id, marcarVisto()),
    }),
    [acciones]
  )

  return { mensajes, ...acciones, ...equipo }
}
