"use client"

import * as React from "react"

import {
  AHORA_AGENDA,
  agendaSemilla,
  migrarEntradas,
  type EntradaAgenda,
  type NuevaEntrada,
} from "@/lib/agenda"
import { PublicacionFallida, publicar } from "@/lib/api/publicaciones"
import { nuevoId } from "@/lib/campanas"
import { textoParaEnviar, tituloParaEnviar } from "@/lib/publicacion"
import { cuentaPorId, type SocialAccount } from "@/lib/social"
import { useCuentasSociales } from "@/hooks/use-cuentas-sociales"

/**
 * La agenda de publicaciones de este navegador.
 *
 * Mismo patrón que `hooks/use-campanas.ts`: lo guardado se mezcla con las
 * semillas al leer, los cambios sobre una semilla se guardan aparte (nunca se
 * copia una entrada entera para cambiarle la hora) y `useSyncExternalStore`
 * mantiene al día todas las pestañas abiertas.
 *
 * La hora solo se lee dentro de las acciones (`new Date()`), nunca al pintar:
 * lo que se pinta deriva de `AHORA_AGENDA`, igual en el servidor y en el cliente.
 * Lo que se publica se sella con `AHORA_AGENDA` a propósito: el calendario de
 * la demo vive el 13 de septiembre y una publicación sellada con la hora real
 * del navegador aparecería sola una semana más adelante.
 *
 * El envío no se hace aquí: lo hace `lib/api/publicaciones.ts`. Este hook
 * guarda los tres momentos —sale, salió, falló— para que un recargado a mitad
 * no deje una entrada diciendo que está en marcha cuando nadie la lleva.
 */

interface Persistido {
  entradas: EntradaAgenda[]
  cambios: Record<string, Partial<EntradaAgenda>>
}

const CLAVE = "clipealo-agenda-v1"
const EVENTO = "clipealo:agenda"

const VACIO: Persistido = { entradas: [], cambios: {} }

function migrar(p: Persistido): Persistido {
  const entradas = migrarEntradas(Array.isArray(p.entradas) ? p.entradas : [])
  return entradas === p.entradas ? p : { ...p, entradas }
}

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
    valorCache = migrar({ ...VACIO, ...(JSON.parse(crudo) as Persistido) })
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
    // Sin almacenamiento, el cambio vale para esta pestaña
    valorCache = siguiente
  }
  window.dispatchEvent(new Event(EVENTO))
}

/** «Reiniciar demo»: la agenda vuelve a sus semillas. Fuera de un componente. */
export const reiniciarAgenda = () => escribir(() => VACIO)

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

/** Un parche sobre una entrada, sea semilla o creada aquí. */
const parchear = (id: string, parche: Partial<EntradaAgenda>) =>
  escribir((s) => ({
    ...s,
    cambios: { ...s.cambios, [id]: { ...s.cambios[id], ...parche } },
  }))

/**
 * Da de alta unas entradas y devuelve las creadas, con su id.
 *
 * Un lote es EL MISMO CLIP mandado a varias cuentas de una vez, no «todo lo que
 * se creó a la vez»: si no lo trae, se agrupa por clip.
 */
function crear(nuevas: NuevaEntrada[]): EntradaAgenda[] {
  const creadaEn = new Date().toISOString()
  const base = nuevoId("lot")
  const porClip = new Map<string, string>()
  const loteDeClip = (clipId: string | undefined) => {
    if (!clipId) return undefined
    const lote = porClip.get(clipId) ?? `${base}_${porClip.size}`
    porClip.set(clipId, lote)
    return lote
  }
  const entradas = nuevas.map((n) => ({
    ...n,
    id: nuevoId("age"),
    loteId: n.loteId ?? (nuevas.length > 1 ? loteDeClip(n.clipId) : undefined),
    creadaEn,
  }))
  escribir((s) => ({ ...s, entradas: [...s.entradas, ...entradas] }))
  return entradas
}

/**
 * El envío de una entrada concreta, con los tres momentos guardados. Fuera del
 * hook porque lo usan tanto `enviar` como `publicarAhora`, y este último tiene
 * la entrada en la mano sin que haya llegado todavía al render.
 */
async function enviarEntrada(entrada: EntradaAgenda, cuentas: SocialAccount[]) {
  const cuenta = cuentaPorId(entrada.cuentaId, cuentas)
  parchear(entrada.id, {
    estado: "publicando",
    fallo: undefined,
    intentos: (entrada.intentos ?? 0) + 1,
  })
  try {
    const hecho = await publicar({
      entradaId: entrada.id,
      red: entrada.red,
      cuentaId: entrada.cuentaId,
      handle: cuenta?.handle,
      clipId: entrada.clipId,
      titulo: entrada.copia ? tituloParaEnviar(entrada.copia, entrada.red) : undefined,
      texto: entrada.copia ? textoParaEnviar(entrada.copia, entrada.red) : entrada.texto,
    })
    parchear(entrada.id, {
      estado: "publicada",
      url: hecho.url,
      postId: hecho.postId,
      publicadaEn: hecho.publicadaEn,
    })
    return hecho
  } catch (error) {
    parchear(entrada.id, {
      estado: "fallida",
      fallo: error instanceof PublicacionFallida ? error.fallo : "sinRed",
    })
    throw error
  }
}

export function useAgenda() {
  const p = React.useSyncExternalStore(suscribir, leer, () => VACIO)
  const { cuentas } = useCuentasSociales()

  const entradas = React.useMemo(() => {
    const todas = [...agendaSemilla(cuentas), ...p.entradas]
    return todas.map((e) => (p.cambios[e.id] ? { ...e, ...p.cambios[e.id] } : e))
  }, [cuentas, p.entradas, p.cambios])

  // Las acciones no se rehacen en cada render, pero necesitan lo último: un
  // `enviar` que cerrara sobre la lista del primer render mandaría el texto
  // viejo de una entrada que se acaba de editar. Se escribe en un efecto y no
  // al pintar: las acciones se llaman desde manejadores, siempre después
  const ultimo = React.useRef({ entradas, cuentas })
  React.useEffect(() => {
    ultimo.current = { entradas, cuentas }
  }, [entradas, cuentas])

  const acciones = React.useMemo(
    () => ({
      /**
       * Planifica una o varias publicaciones. El mismo clip en tres cuentas es
       * una sola acción: comparten `loteId` para moverlas o cancelarlas juntas.
       */
      programar: crear,

      /** Mover a otro día u otra hora. Solo cambia el instante. */
      reprogramar: (id: string, programadaPara: string) =>
        // Mover una fallida es volver a ponerla en cola: el fallo de la vez
        // anterior deja de aplicar y la tarjeta no puede seguir en rojo
        parchear(id, {
          programadaPara,
          estado: "planificada",
          fallo: undefined,
        }),

      cancelar: (id: string) => parchear(id, { estado: "cancelada" }),

      /** Deshacer una cancelación: vuelve a estar planificada. */
      recuperar: (id: string) => parchear(id, { estado: "planificada" }),

      /**
       * Mandarla a la red. Tres momentos guardados: sale, salió, falló. Si el
       * navegador se cierra a mitad, queda en `publicando` y el servidor real
       * es quien la cierra; en la demo se reintenta a mano.
       *
       * Reintentar es llamar otra vez: no hay dos caminos.
       */
      enviar: (id: string) => {
        const entrada = ultimo.current.entradas.find((e) => e.id === id)
        if (!entrada) return Promise.resolve(null)
        return enviarEntrada(entrada, ultimo.current.cuentas)
      },

      /**
       * «Publicar ahora»: se crean las entradas y salen en el mismo gesto.
       *
       * Van juntas y no por `enviar(id)` porque las entradas acaban de
       * escribirse: buscarlas por id en la lista del render anterior no las
       * encontraría, y el envío se perdería sin decir nada.
       */
      publicarAhora: (nuevas: NuevaEntrada[]) => {
        const entradas = crear(nuevas)
        const cuentas = ultimo.current.cuentas
        return Promise.allSettled(entradas.map((e) => enviarEntrada(e, cuentas))).then(
          (resultados) =>
            entradas.map((entrada, i) => ({
              entrada,
              hecho: resultados[i].status === "fulfilled",
              fallo:
                resultados[i].status === "rejected" &&
                (resultados[i] as PromiseRejectedResult).reason instanceof
                  PublicacionFallida
                  ? (
                      (resultados[i] as PromiseRejectedResult)
                        .reason as PublicacionFallida
                    ).fallo
                  : undefined,
            }))
        )
      },

      /**
       * «Ya la publiqué»: para lo que se subió fuera de Clipealo. El enlace es
       * el que Analíticas sabe seguir y el que «Enviar clip» necesita para una
       * campaña.
       */
      marcarPublicada: (id: string, url: string) =>
        parchear(id, {
          estado: "publicada",
          url,
          // El «hoy» de la demo, como el resto del calendario
          publicadaEn: AHORA_AGENDA,
        }),

      reiniciarAgenda,
    }),
    []
  )

  return { entradas, cuentas, ...acciones }
}
