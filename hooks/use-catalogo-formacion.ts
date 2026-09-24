"use client"

import * as React from "react"

import {
  CATALOGO_SEMILLA,
  CATALOGO_VACIO,
  aplicarCatalogo,
  borradorDeRuta,
  claseDeBorrador,
  leccionPorId,
  migrarCatalogo,
  moverEnRuta,
  nuevoIdClase,
  nuevoIdRuta,
  parcheLeccion,
  parcheRuta,
  rutaDeBorrador,
  type BorradorClase,
  type BorradorRuta,
  type Catalogo,
  type CatalogoGuardado,
  type EstadoClase,
} from "@/lib/formacion"

/**
 * El catálogo de Formación que el admin edita, guardado en este navegador.
 *
 * Mismo patrón que `hooks/use-campanas.ts`: semillas + parches. Nunca se copia
 * la clase entera al editarla —eso la congelaría, y una descripción mejor en la
 * semilla no llegaría a quien la tocó una vez—, solo lo que cambia.
 *
 * Y lo que el admin escribe aquí lo ve el alumno en /formacion sin recargar, que
 * es exactamente lo que ya hacen las disputas con `use-campanas`. Cuando exista
 * la API, esto se sustituye por el cuerpo de `lib/api/admin.ts` y nada más.
 *
 * `AGENTS.md` pide que las acciones del operador sean `MockAction` mientras no
 * haya API; esta es la excepción que ya sentó la cola de disputas: escribe de
 * verdad, porque un catálogo que no cambia no se puede juzgar.
 */

export const CLAVE_CATALOGO = "clipealo-formacion-catalogo-v1"
const EVENTO = "clipealo:formacion-catalogo"

let crudoCache: string | null = null
let valorCache: CatalogoGuardado = CATALOGO_VACIO

function leer(): CatalogoGuardado {
  let crudo: string | null = null
  try {
    crudo = window.localStorage.getItem(CLAVE_CATALOGO)
  } catch {
    return valorCache
  }
  if (crudo === crudoCache) return valorCache
  crudoCache = crudo
  try {
    valorCache = crudo ? migrarCatalogo(JSON.parse(crudo)) : CATALOGO_VACIO
  } catch {
    valorCache = CATALOGO_VACIO
  }
  return valorCache
}

/** Devuelve `false` si el navegador no guarda nada (incógnito, permisos). */
function escribir(cambio: (g: CatalogoGuardado) => CatalogoGuardado): boolean {
  const nuevo = cambio(leer())
  const crudo = JSON.stringify(nuevo)
  let guardado = true
  try {
    window.localStorage.setItem(CLAVE_CATALOGO, crudo)
  } catch {
    guardado = false
  }
  crudoCache = guardado ? crudo : null
  valorCache = nuevo
  window.dispatchEvent(new Event(EVENTO))
  return guardado
}

/** «Reiniciar demo»: el catálogo vuelve a las ocho clases de fábrica. */
export const reiniciarCatalogo = () => void escribir(() => CATALOGO_VACIO)

function suscribir(callback: () => void) {
  const alGuardar = (e: StorageEvent) => {
    if (e.key === CLAVE_CATALOGO || e.key === null) callback()
  }
  window.addEventListener(EVENTO, callback)
  window.addEventListener("storage", alGuardar)
  return () => {
    window.removeEventListener(EVENTO, callback)
    window.removeEventListener("storage", alGuardar)
  }
}

export function useCatalogoFormacion(base: Catalogo = CATALOGO_SEMILLA) {
  const guardado = React.useSyncExternalStore(suscribir, leer, () => CATALOGO_VACIO)
  const catalogo = React.useMemo(() => aplicarCatalogo(guardado, base), [guardado, base])

  const acciones = React.useMemo(
    () => ({
      /**
       * Alta o edición. De una clase que ya existe se guarda el parche mínimo;
       * de una nueva, la clase entera. El instante lo pone quien llama: esto
       * vive en un manejador, nunca al pintar.
       */
      guardarClase: (b: BorradorClase, ahora: string): boolean =>
        escribir((g) => {
          const catalogoActual = aplicarCatalogo(g, base)
          const original = b.id ? leccionPorId(b.id, catalogoActual) : undefined
          const id = b.id ?? nuevoIdClase()
          const clase = claseDeBorrador(b, original ?? null, ahora, id)
          // Creada por el admin: se reemplaza entera, no hay semilla debajo
          if (g.creadas.some((c) => c.id === id))
            return { ...g, creadas: g.creadas.map((c) => (c.id === id ? clase : c)) }
          if (!original) return { ...g, creadas: [...g.creadas, clase] }
          const semilla = base.lecciones.find((l) => l.id === id)
          return semilla
            ? { ...g, cambios: { ...g.cambios, [id]: parcheLeccion(semilla, clase) } }
            : { ...g, creadas: [...g.creadas, clase] }
        }),

      /** Publicar, retirar o devolver a borrador. Despublicar no borra nada. */
      cambiarEstadoClase: (id: string, estado: EstadoClase, ahora: string): boolean =>
        escribir((g) => {
          if (g.creadas.some((c) => c.id === id))
            return {
              ...g,
              creadas: g.creadas.map((c) =>
                c.id === id ? { ...c, estado, editadaEn: ahora } : c
              ),
            }
          return {
            ...g,
            cambios: {
              ...g.cambios,
              [id]: { ...g.cambios[id], estado, editadaEn: ahora },
            },
          }
        }),

      /**
       * Solo se borran las creadas aquí. Una semilla se despublica: borrarla
       * dejaría rutas apuntando a un id que ya no existe y tiraría el avance de
       * quien la estaba viendo.
       */
      borrarClase: (id: string): boolean =>
        escribir((g) => ({
          ...g,
          creadas: g.creadas.filter((c) => c.id !== id),
          cambios: Object.fromEntries(
            Object.entries(g.cambios).filter(([k]) => k !== id)
          ),
        })),

      /** Alta o edición de una ruta. Igual que las clases: parche si es semilla. */
      guardarRuta: (b: BorradorRuta): boolean =>
        escribir((g) => {
          const id = b.id ?? nuevoIdRuta()
          const ruta = rutaDeBorrador(b, id)
          if (g.rutasCreadas.some((r) => r.id === id))
            return {
              ...g,
              rutasCreadas: g.rutasCreadas.map((r) => (r.id === id ? ruta : r)),
            }
          const semilla = base.rutas.find((r) => r.id === id)
          return semilla
            ? { ...g, cambiosRuta: { ...g.cambiosRuta, [id]: parcheRuta(semilla, ruta) } }
            : { ...g, rutasCreadas: [...g.rutasCreadas, ruta] }
        }),

      /** Solo se borran las creadas aquí, como con las clases. */
      borrarRuta: (id: string): boolean =>
        escribir((g) => ({
          ...g,
          rutasCreadas: g.rutasCreadas.filter((r) => r.id !== id),
          cambiosRuta: Object.fromEntries(
            Object.entries(g.cambiosRuta).filter(([k]) => k !== id)
          ),
        })),

      reiniciarCatalogo,
    }),
    [base]
  )

  /**
   * Cambiar la lista de clases de una ruta. Se hace sobre el catálogo ya
   * aplicado —no sobre la semilla— porque el orden que se ve es el que se edita.
   */
  const conLecciones = React.useCallback(
    (rutaId: string, siguiente: (lecciones: string[]) => string[]): boolean => {
      const ruta = catalogo.rutas.find((r) => r.id === rutaId)
      if (!ruta) return true
      const lecciones = siguiente([...ruta.lecciones])
      return acciones.guardarRuta({ ...borradorDeRuta(ruta), lecciones })
    },
    [acciones, catalogo]
  )

  const rutas2 = React.useMemo(
    () => ({
      /** Sube o baja una clase un paso. En un extremo, no pasa nada. */
      moverClaseEnRuta: (rutaId: string, leccionId: string, delta: -1 | 1) => {
        const ruta = catalogo.rutas.find((r) => r.id === rutaId)
        if (!ruta) return true
        return acciones.guardarRuta(borradorDeRuta(moverEnRuta(ruta, leccionId, delta)))
      },
      anadirClaseARuta: (rutaId: string, leccionId: string) =>
        conLecciones(rutaId, (l) => (l.includes(leccionId) ? l : [...l, leccionId])),
      quitarClaseDeRuta: (rutaId: string, leccionId: string) =>
        conLecciones(rutaId, (l) => l.filter((x) => x !== leccionId)),
    }),
    [acciones, catalogo, conLecciones]
  )

  return {
    catalogo,
    lecciones: catalogo.lecciones,
    rutas: catalogo.rutas,
    ...acciones,
    ...rutas2,
  }
}

/** `true` si esa clase la creó el admin aquí; una semilla no se puede borrar. */
export function esClaseCreada(id: string): boolean {
  return leer().creadas.some((c) => c.id === id)
}

/** Lo mismo para las rutas. */
export function esRutaCreada(id: string): boolean {
  return leer().rutasCreadas.some((r) => r.id === id)
}

/** Alias para quien solo necesita leer: el alumno en /formacion. */
export function useCatalogo(base?: Catalogo): Catalogo {
  return useCatalogoFormacion(base).catalogo
}

/** Las clases publicadas sin video, que es el trabajo que le queda al equipo. */
export function sinVideoDe(catalogo: Catalogo): number {
  return catalogo.lecciones.filter((l) => l.estado === "publicada" && !l.video.url).length
}
