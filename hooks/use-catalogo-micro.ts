"use client"

import * as React from "react"

import {
  CATALOGO_MICRO_SEMILLA,
  CATALOGO_MICRO_VACIO,
  aplicarCatalogoMicro,
  migrarCatalogoMicro,
  moverPregunta,
  parchePregunta,
  preguntaDeBorrador,
  type BorradorPregunta,
  type CatalogoMicro,
  type CatalogoMicroGuardado,
  type PreguntaCatalogo,
  type ReglasMicro,
} from "@/lib/micro-catalogo"

/**
 * El catálogo de preguntas que el admin edita, guardado en este navegador.
 *
 * Mismo patrón que el de Formación: semillas + parches. De una semilla se
 * guarda solo lo que cambia —si se pregunta, dónde y en qué orden—, nunca la
 * pregunta entera: copiarla la congelaría, y un texto mejor en `messages/` no
 * llegaría a quien la tocó una vez.
 *
 * Lo que se cambia aquí se nota en la app sin recargar: es lo que permite
 * juzgar si una pregunta nueva encaja antes de decidir que se queda.
 */

export const CLAVE_CATALOGO_MICRO = "clipealo-micro-catalogo-v1"
const EVENTO = "clipealo:micro-catalogo"

let crudoCache: string | null = null
let valorCache: CatalogoMicroGuardado = CATALOGO_MICRO_VACIO

function leer(): CatalogoMicroGuardado {
  let crudo: string | null = null
  try {
    crudo = window.localStorage.getItem(CLAVE_CATALOGO_MICRO)
  } catch {
    // Almacenamiento bloqueado: manda lo último de esta pestaña
    return valorCache
  }
  if (crudo === crudoCache) return valorCache
  crudoCache = crudo
  try {
    valorCache = crudo ? migrarCatalogoMicro(JSON.parse(crudo)) : CATALOGO_MICRO_VACIO
  } catch {
    valorCache = CATALOGO_MICRO_VACIO
  }
  return valorCache
}

function escribir(cambio: (g: CatalogoMicroGuardado) => CatalogoMicroGuardado) {
  const siguiente = cambio(leer())
  const crudo = JSON.stringify(siguiente)
  let guardado = true
  try {
    window.localStorage.setItem(CLAVE_CATALOGO_MICRO, crudo)
  } catch {
    guardado = false
  }
  crudoCache = guardado ? crudo : crudoCache
  valorCache = siguiente
  window.dispatchEvent(new Event(EVENTO))
}

/** «Reiniciar demo»: vuelven las nueve de fábrica. Fuera de un componente. */
export const reiniciarCatalogoMicro = () => escribir(() => CATALOGO_MICRO_VACIO)

function suscribir(callback: () => void) {
  const alGuardar = (e: StorageEvent) => {
    if (e.key === CLAVE_CATALOGO_MICRO || e.key === null) callback()
  }
  window.addEventListener(EVENTO, callback)
  window.addEventListener("storage", alGuardar)
  return () => {
    window.removeEventListener(EVENTO, callback)
    window.removeEventListener("storage", alGuardar)
  }
}

/** El catálogo ya aplicado: es lo que lee la app para decidir qué preguntar. */
export function useCatalogoMicro(base: CatalogoMicro = CATALOGO_MICRO_SEMILLA) {
  const guardado = React.useSyncExternalStore(suscribir, leer, () => CATALOGO_MICRO_VACIO)
  return React.useMemo(() => aplicarCatalogoMicro(guardado, base), [guardado, base])
}

/** `true` si la pregunta la escribió el admin: solo esas se pueden borrar. */
export const esPreguntaCreada = (id: string): boolean =>
  leer().creadas.some((p) => p.id === id)

export function useEditorMicro() {
  const catalogo = useCatalogoMicro()

  const acciones = React.useMemo(
    () => ({
      /** Encender o apagar. Apagar no borra: lo respondido sigue en la cuenta. */
      alternar: (p: PreguntaCatalogo) =>
        escribir((g) => ({
          ...g,
          cambios: {
            ...g.cambios,
            [p.id]: { ...g.cambios[p.id], activa: !p.activa },
          },
        })),

      /** Cambiar de lugar: del panel a «Enviar clip» o al revés. */
      cambiarLugar: (p: PreguntaCatalogo, lugar: PreguntaCatalogo["lugar"]) =>
        escribir((g) => ({
          ...g,
          cambios: { ...g.cambios, [p.id]: { ...g.cambios[p.id], lugar } },
        })),

      /**
       * Subir o bajar dentro de su lugar. Se recalcula el orden de TODAS y se
       * guarda solo el de las que cambian: dos parches, no nueve.
       */
      mover: (p: PreguntaCatalogo, delta: -1 | 1) =>
        escribir((g) => {
          const antes = aplicarCatalogoMicro(g).preguntas
          const despues = moverPregunta(antes, p.id, delta)
          const cambios = { ...g.cambios }
          for (const q of despues) {
            const previo = antes.find((x) => x.id === q.id)
            if (!previo || previo.orden === q.orden) continue
            cambios[q.id] = { ...cambios[q.id], orden: q.orden }
          }
          return { ...g, cambios }
        }),

      /** Crear o editar una pregunta del admin. */
      guardar: (b: BorradorPregunta, id: string) =>
        escribir((g) => {
          const existente = g.creadas.find((p) => p.id === id)
          // Una nueva va al final de su lugar; una editada conserva su sitio
          const orden =
            existente?.orden ??
            Math.max(0, ...aplicarCatalogoMicro(g).preguntas.map((p) => p.orden + 1), 0)
          const pregunta = preguntaDeBorrador(b, id, orden)
          return {
            ...g,
            creadas: existente
              ? g.creadas.map((p) => (p.id === id ? pregunta : p))
              : [...g.creadas, pregunta],
            // Al reescribirla entera, el parche viejo sobra
            cambios: Object.fromEntries(
              Object.entries(g.cambios).filter(([k]) => k !== id)
            ),
          }
        }),

      /** Borrar: solo las creadas. Una semilla se apaga, no se borra. */
      borrar: (id: string) =>
        escribir((g) => ({
          ...g,
          creadas: g.creadas.filter((p) => p.id !== id),
          cambios: Object.fromEntries(
            Object.entries(g.cambios).filter(([k]) => k !== id)
          ),
        })),

      /** Cambiar una regla de frecuencia. El rango lo impone la migración. */
      cambiarRegla: (clave: keyof ReglasMicro, valor: number) =>
        escribir((g) => ({ ...g, reglas: { ...g.reglas, [clave]: valor } })),

      reiniciarCatalogoMicro,
    }),
    []
  )

  return { catalogo, ...acciones }
}

/** El parche mínimo, para quien quiera comparar contra la semilla. */
export { parchePregunta }
