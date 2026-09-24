"use client"

import * as React from "react"

import {
  CUENTA_DEMO,
  HOY_CAMPANAS,
  campanasSemilla,
  enviosSemilla,
  migrarCampanas,
  nuevoId,
  type Campana,
  type Envio,
  type EstadoCampana,
  type EstadoEnvio,
  type Perfil,
} from "@/lib/campanas"
import type { SolicitudAgenciaDatos } from "@/lib/onboarding"
import {
  MOTIVOS_RECHAZO_AGENCIA,
  SECTOR_REGULADO,
  esId,
  type MotivoRechazo,
} from "@/lib/taxonomia"
import {
  aceptar,
  abrirDisputa as abrirDisputaDominio,
  cumplir,
  disputasSemilla,
  participacionesSemilla,
  type CompromisoAlEntregar,
  rechazar,
  resolverDisputa as resolverDisputaDominio,
  retirar,
  solicitar,
  type Disputa,
  type Laudo,
  type MotivoDecision,
  type MotivoDisputa,
  type Participacion,
} from "@/lib/participacion"
import { retirosSemilla, type EstadoRetiro, type Retiro } from "@/lib/wallet"
import {
  registrarEventoCuenta,
  reiniciarCuenta,
  useNombreCuenta,
} from "@/hooks/use-cuenta"
import type { PlanId } from "@/lib/planes"
import { cambiarPlan, reiniciarPlan } from "@/hooks/use-plan"
import { reiniciarCuentas } from "@/hooks/use-cuentas-sociales"
import { reiniciarFeedback } from "@/hooks/use-feedback"
import { reiniciarCatalogoPlanes } from "@/hooks/use-catalogo-planes"
import {
  limpiarSolicitudListaBlanca,
  resolverListaBlanca as resolverLB,
  type SolicitudListaBlanca,
} from "@/lib/derechos"
import { AHORA_DEMO } from "@/lib/fechas"

/**
 * Estado de las campañas en el arquetipo, sin backend.
 *
 * Parte de las semillas de `lib/campanas.ts` y guarda en localStorage solo lo
 * que cambia: campañas creadas, cambios de estado, envíos nuevos, el perfil de
 * la cuenta y las campañas privadas desbloqueadas. Se sincroniza entre pestañas
 * (evento `storage`), así que lo que el admin aprueba en /admin aparece en la
 * app sin recargar. También lleva los retiros del wallet (`lib/wallet.ts`), que
 * nacen de lo cobrado en campañas. Con la API real, cada acción pasa a ser una
 * mutación.
 *
 * Quién es la cuenta (nombre, respuestas del onboarding) vive en
 * `hooks/use-cuenta.ts`: de ahí sale `cuenta.nombre`. La solicitud de agencia
 * guarda aquí lo que ve la cola del admin (`datosSolicitud`) y, al resolverse,
 * su motivo de rechazo como código.
 */

/**
 * Por dónde va la solicitud. `entrevista` es el paso que hay entre pedirlo y
 * concederlo: el equipo mira la organización, la cita y le hace un plan.
 */
export type SolicitudAgencia =
  "ninguna" | "pendiente" | "entrevista" | "aprobada" | "rechazada"
export const ESTADOS_SOLICITUD: readonly SolicitudAgencia[] = [
  "ninguna",
  "pendiente",
  "entrevista",
  "aprobada",
  "rechazada",
]

/** La cita: cuándo y, si hace falta, qué llevar. */
export interface Entrevista {
  citadaEn: string
  nota?: string
}

interface Persistido {
  creadas: Campana[]
  cambios: Record<
    string,
    Partial<Pick<Campana, "estado" | "destacada" | "inscripcionesAbiertas">>
  >
  envios: Envio[]
  cambiosEnvio: Record<
    string,
    Partial<Pick<Envio, "estado" | "motivoRechazo" | "vistas" | "vistasEn">>
  >
  retiros: Retiro[]
  cambiosRetiro: Record<string, Partial<Pick<Retiro, "estado" | "resueltoEn" | "motivo">>>
  /** Perfil de la cuenta de la app. El admin trabaja desde /admin. */
  perfil: Exclude<Perfil, "admin">
  solicitudAgencia: SolicitudAgencia
  /** Lo que envió el onboarding de agencia; sin él, la cola del admin usa su respaldo. */
  datosSolicitud?: SolicitudAgenciaDatos
  /** Código del rechazo; el texto está en `taxonomy.motivosRechazo`. */
  motivoRechazo?: MotivoRechazo
  /** La entrevista citada, mientras la solicitud está en ese paso o después. */
  entrevista?: Entrevista
  /** El plan con el que se concedió el perfil. Sale de la entrevista; puede ser uno creado a medida. */
  planAsignado?: PlanId
  desbloqueadas: string[]
  /** Compromisos entre cliperos y campañas (docs/campanas-ciclo-2026-09.md). */
  participaciones: Participacion[]
  cambiosParticipacion: Record<string, Partial<Participacion>>
  disputas: Disputa[]
  /** Cuentas que piden alta en el Content ID de una campaña (`lib/derechos.ts`). */
  solicitudesListaBlanca: SolicitudListaBlanca[]
}

const CLAVE = "clipealo-campanas-v1"
const EVENTO = "clipealo:campanas"

const VACIO: Persistido = {
  creadas: [],
  cambios: {},
  envios: [],
  cambiosEnvio: {},
  retiros: [],
  cambiosRetiro: {},
  perfil: "usuario",
  solicitudAgencia: "ninguna",
  desbloqueadas: [],
  participaciones: [],
  cambiosParticipacion: {},
  disputas: [],
  solicitudesListaBlanca: [],
}

/**
 * Lo guardado se limpia al leer, con la misma clave: las campañas creadas pasan
 * por `migrarCampanas` (la categoría antigua con su etiqueta, «Música», y los
 * campos de segmentación con ids válidos) y un motivo de rechazo desconocido se
 * descarta. Si no cambia nada devuelve lo mismo.
 */
function migrar(p: Persistido): Persistido {
  const creadas = migrarCampanas(Array.isArray(p.creadas) ? p.creadas : [])
  const motivoValido =
    p.motivoRechazo === undefined || esId(MOTIVOS_RECHAZO_AGENCIA, p.motivoRechazo)
  const estadoValido = ESTADOS_SOLICITUD.includes(p.solicitudAgencia)
  const entrevistaValida =
    p.entrevista === undefined || typeof p.entrevista?.citadaEn === "string"
  // Solo se exige que sea un id: si el plan ya no está en el catálogo, la cuenta
  // lo resuelve al de la demo al leerlo (`planDe`), y aquí queda escrito cuál fue
  const planValidoOAusente =
    p.planAsignado === undefined ||
    (typeof p.planAsignado === "string" && p.planAsignado.length > 0)
  const solicitudes = (
    Array.isArray(p.solicitudesListaBlanca) ? p.solicitudesListaBlanca : []
  )
    .map(limpiarSolicitudListaBlanca)
    .filter((s): s is SolicitudListaBlanca => s !== null)
  const solicitudesValidas =
    Array.isArray(p.solicitudesListaBlanca) &&
    solicitudes.length === p.solicitudesListaBlanca.length
  if (
    creadas === p.creadas &&
    motivoValido &&
    estadoValido &&
    entrevistaValida &&
    planValidoOAusente &&
    solicitudesValidas
  )
    return p
  const sig: Persistido = { ...p, creadas, solicitudesListaBlanca: solicitudes }
  if (!motivoValido) delete sig.motivoRechazo
  if (!estadoValido) sig.solicitudAgencia = "ninguna"
  if (!entrevistaValida) delete sig.entrevista
  if (!planValidoOAusente) delete sig.planAsignado
  return sig
}

/** Evento del funnel (§7.7) para la cuenta, si la solicitud llevaba datos. */
function eventoSolicitud(
  datos: SolicitudAgenciaDatos | undefined,
  estado: "pendiente" | "aprobada" | "rechazada"
) {
  if (!datos) return
  registrarEventoCuenta({
    tipo: "solicitud_agencia",
    estado,
    regulado: SECTOR_REGULADO[datos.sector] ?? false,
    tramo: datos.tramoPresupuesto,
  })
}

let crudoCache: string | null = null
let valorCache: Persistido = VACIO

function leer(): Persistido {
  let crudo: string | null = null
  try {
    crudo = window.localStorage.getItem(CLAVE)
  } catch {
    // Almacenamiento bloqueado: se trabaja en memoria
  }
  if (crudo === crudoCache) return valorCache
  crudoCache = crudo
  try {
    valorCache = crudo
      ? migrar({ ...VACIO, ...(JSON.parse(crudo) as Partial<Persistido>) })
      : VACIO
  } catch {
    valorCache = VACIO
  }
  return valorCache
}

function escribir(cambio: (p: Persistido) => Persistido) {
  const nuevo = cambio(leer())
  const crudo = JSON.stringify(nuevo)
  let guardado = true
  try {
    window.localStorage.setItem(CLAVE, crudo)
  } catch {
    guardado = false
  }
  // `crudoCache` solo avanza si SE GUARDÓ. Si se marcaba como guardado sin
  // haberlo hecho, la lectura siguiente veía `getItem` fallando (null) contra
  // una caché que decía otra cosa, daba el guardado por cambiado y devolvía
  // VACÍO: con el almacenamiento bloqueado, cada escritura se borraba a sí
  // misma en el mismo instante, justo al revés de lo que prometía el comentario
  crudoCache = guardado ? crudo : crudoCache
  valorCache = nuevo
  window.dispatchEvent(new Event(EVENTO))
}

function suscribir(callback: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === CLAVE) callback()
  }
  window.addEventListener(EVENTO, callback)
  window.addEventListener("storage", onStorage)
  return () => {
    window.removeEventListener(EVENTO, callback)
    window.removeEventListener("storage", onStorage)
  }
}

const aplicar = <T extends { id: string }>(
  items: T[],
  cambios: Record<string, Partial<T>>
) => items.map((x) => (cambios[x.id] ? { ...x, ...cambios[x.id] } : x))

export function useCampanas() {
  const p = React.useSyncExternalStore(suscribir, leer, () => VACIO)
  const nombre = useNombreCuenta()
  // El id sigue siendo el de la demo: los envíos y retiros semilla son de esta cuenta
  const cuenta = React.useMemo(() => ({ userId: CUENTA_DEMO.userId, nombre }), [nombre])

  const campanas = React.useMemo(
    () =>
      aplicar(
        [...campanasSemilla, ...p.creadas],
        p.cambios as Record<string, Partial<Campana>>
      ),
    [p.creadas, p.cambios]
  )
  const envios = React.useMemo(
    () =>
      aplicar(
        [...enviosSemilla, ...p.envios],
        p.cambiosEnvio as Record<string, Partial<Envio>>
      ),
    [p.envios, p.cambiosEnvio]
  )
  const participaciones = React.useMemo(
    () =>
      aplicar(
        [...participacionesSemilla, ...p.participaciones],
        p.cambiosParticipacion as Record<string, Partial<Participacion>>
      ),
    [p.participaciones, p.cambiosParticipacion]
  )
  const disputas = React.useMemo(() => [...disputasSemilla, ...p.disputas], [p.disputas])

  const retiros = React.useMemo(
    () =>
      aplicar(
        [...retirosSemilla, ...p.retiros],
        p.cambiosRetiro as Record<string, Partial<Retiro>>
      ),
    [p.retiros, p.cambiosRetiro]
  )

  const acciones = React.useMemo(
    () => ({
      crear: (c: Campana) => escribir((s) => ({ ...s, creadas: [...s.creadas, c] })),
      cambiarEstado: (id: string, estado: EstadoCampana) =>
        escribir((s) => ({
          ...s,
          cambios: { ...s.cambios, [id]: { ...s.cambios[id], estado } },
        })),
      destacar: (id: string, destacada: boolean) =>
        escribir((s) => ({
          ...s,
          cambios: { ...s.cambios, [id]: { ...s.cambios[id], destacada } },
        })),
      /**
       * Entregar el clip. Si venía de un compromiso aceptado, la participación
       * pasa a «entregada»: desde aquí la pelota es de la agencia.
       */
      enviarClip: (e: Envio, compromiso: CompromisoAlEntregar = { tipo: "ninguno" }) =>
        escribir((s) => {
          // El mismo clip no entra dos veces en la misma campaña: se reconoce
          // por su publicación, y si vino por enlace, por la URL
          const repetido = s.envios.some(
            (x) =>
              x.campanaId === e.campanaId &&
              (e.publicacionId ? x.publicacionId === e.publicacionId : x.url === e.url)
          )
          if (repetido) return s
          return {
            ...s,
            envios: [...s.envios, e],
            // Crear y marcar son dos escrituras distintas: una campaña abierta no
            // tiene compromiso previo que parchear, y parchear uno que no existe
            // era lo que dejaba la participación en «aceptada» hasta caducar
            participaciones:
              compromiso.tipo === "crear"
                ? [...s.participaciones, compromiso.participacion]
                : s.participaciones,
            cambiosParticipacion:
              compromiso.tipo === "marcar"
                ? {
                    ...s.cambiosParticipacion,
                    [compromiso.participacion.id]: compromiso.participacion,
                  }
                : s.cambiosParticipacion,
          }
        }),

      /**
       * Guardar una lectura de vistas. La hace quien tiene las publicaciones
       * delante (`lib/api/analiticas.ts`); aquí solo se escribe, con la marca
       * de cuándo se leyó para poder decir «leído hace dos horas».
       */
      anotarVistas: (id: string, vistas: number, leidoEn: string) =>
        escribir((s) => ({
          ...s,
          cambiosEnvio: {
            ...s.cambiosEnvio,
            [id]: { ...s.cambiosEnvio[id], vistas, vistasEn: leidoEn },
          },
        })),

      /** Aprobar cierra el compromiso: la participación queda cumplida. */
      revisarEnvio: (
        id: string,
        estado: EstadoEnvio,
        motivoRechazo?: string,
        participacion?: Participacion
      ) =>
        escribir((s) => ({
          ...s,
          cambiosEnvio: { ...s.cambiosEnvio, [id]: { estado, motivoRechazo } },
          /**
           * Aprobar cierra el compromiso. Rechazar lo devuelve a «aceptada»: si
           * le queda plazo puede entregar otro clip, y si no, el reloj lo dará
           * por caducado solo. En los dos casos deja de bloquear el cierre de la
           * campaña, que es lo que importaba.
           */
          cambiosParticipacion: participacion
            ? {
                ...s.cambiosParticipacion,
                [participacion.id]:
                  estado === "aprobado"
                    ? cumplir(participacion)
                    : { ...participacion, estado: "aceptada", envioId: undefined },
              }
            : s.cambiosParticipacion,
        })),
      solicitarRetiro: (r: Retiro) =>
        escribir((s) => ({ ...s, retiros: [...s.retiros, r] })),
      resolverRetiro: (
        id: string,
        estado: Exclude<EstadoRetiro, "solicitado">,
        motivo?: string
      ) =>
        escribir((s) => ({
          ...s,
          cambiosRetiro: {
            ...s.cambiosRetiro,
            [id]: { estado, motivo, resueltoEn: HOY_CAMPANAS },
          },
        })),
      /**
       * Pide el perfil de agencia. Con `datos` (el render de agencia del
       * onboarding) la cola del admin los enseña; sin ellos conserva los de una
       * solicitud anterior.
       */
      solicitarAgencia: (datos?: SolicitudAgenciaDatos) => {
        escribir((s) => {
          const sig: Persistido = {
            ...s,
            solicitudAgencia: "pendiente",
            datosSolicitud: datos ?? s.datosSolicitud,
          }
          delete sig.motivoRechazo
          return sig
        })
        eventoSolicitud(datos, "pendiente")
      },
      /**
       * El equipo cita a la agencia antes de decidir. Se puede volver a citar:
       * la última cita es la que vale y la que ve la agencia.
       */
      citarEntrevista: (entrevista: Entrevista) =>
        escribir((s) => ({ ...s, solicitudAgencia: "entrevista", entrevista })),

      /**
       * El admin concede —con el plan que salió de la entrevista— o rechaza con
       * su código. Conceder cambia también el plan de la cuenta de la demo, que
       * es lo que hace que las puertas se abran al momento.
       */
      resolverAgencia: (aprobada: boolean, motivo?: MotivoRechazo, plan?: PlanId) => {
        escribir((s) => {
          const sig: Persistido = {
            ...s,
            solicitudAgencia: aprobada ? "aprobada" : "rechazada",
            perfil: aprobada ? "agencia" : s.perfil,
            motivoRechazo: aprobada ? undefined : motivo,
            planAsignado: aprobada ? (plan ?? s.planAsignado) : s.planAsignado,
          }
          if (!sig.motivoRechazo) delete sig.motivoRechazo
          if (!sig.planAsignado) delete sig.planAsignado
          return sig
        })
        if (aprobada && plan) cambiarPlan(plan)
        eventoSolicitud(leer().datosSolicitud, aprobada ? "aprobada" : "rechazada")
      },
      /** Pedir el alta de una cuenta en el Content ID de la agencia (Operaciones › Derechos). */
      pedirListaBlanca: (s: SolicitudListaBlanca) =>
        escribir((p) => ({
          ...p,
          solicitudesListaBlanca: [...p.solicitudesListaBlanca, s],
        })),
      /** La agencia decide. Rechazar lleva su motivo, que verá el clipero. */
      resolverListaBlanca: (id: string, aprobada: boolean, motivo?: string) =>
        escribir((p) => ({
          ...p,
          solicitudesListaBlanca: p.solicitudesListaBlanca.map((s) =>
            s.id === id ? resolverLB(s, aprobada, AHORA_DEMO, motivo) : s
          ),
        })),
      /** Solo para la demostración: cambiar de perfil sin pasar por el admin. */
      cambiarPerfil: (perfil: Persistido["perfil"]) =>
        escribir((s) => ({ ...s, perfil })),
      desbloquear: (id: string) =>
        escribir((s) => ({
          ...s,
          desbloqueadas: s.desbloqueadas.includes(id)
            ? s.desbloqueadas
            : [...s.desbloqueadas, id],
        })),
      /* --- Participación: quién entra en una campaña y con qué compromiso --- */

      /** El clipero pide entrar. Lo que la agencia verá de él es `perfilParaAgencia`. */
      solicitarParticipacion: (datos: {
        campanaId: string
        userId: string
        clipero: string
        nota?: string
      }) =>
        escribir((s) => ({
          ...s,
          participaciones: [
            ...s.participaciones,
            // El «hoy» de la demo: con el reloj real la solicitud nacía
            // después del hoy contra el que se pinta la cuenta atrás, y el
            // plazo prometido («7 días») salía inflado en la tarjeta
            solicitar({ id: nuevoId("par"), ...datos, en: HOY_CAMPANAS }),
          ],
        })),

      /**
       * La agencia decide. Aceptar arranca el plazo de entrega (y nunca pasa del
       * fin de la campaña); rechazar guarda el motivo como código.
       */
      decidirSolicitud: (
        p: Participacion,
        campana: Campana,
        decision: "aceptar" | "rechazar",
        motivo?: MotivoDecision
      ) => {
        const en = HOY_CAMPANAS
        const sig =
          decision === "aceptar"
            ? aceptar(p, campana, en)
            : rechazar(p, motivo ?? "otro", en)
        escribir((s) => ({
          ...s,
          cambiosParticipacion: { ...s.cambiosParticipacion, [p.id]: sig },
        }))
      },

      /** El clipero se baja antes de entregar: libera la plaza, sin penalización. */
      retirarse: (p: Participacion) =>
        escribir((s) => ({
          ...s,
          cambiosParticipacion: {
            ...s.cambiosParticipacion,
            [p.id]: retirar(p, HOY_CAMPANAS),
          },
        })),

      /** Deja de admitir gente nueva y termina con la que ya está dentro. */
      cerrarInscripciones: (campanaId: string, abiertas = false) =>
        escribir((s) => ({
          ...s,
          cambios: {
            ...s.cambios,
            [campanaId]: { ...s.cambios[campanaId], inscripcionesAbiertas: abiertas },
          },
        })),

      /**
       * Cierra la campaña. Quien llama comprueba antes con `puedeFinalizar` que
       * no queda trabajo pendiente: esto solo escribe la decisión.
       */
      finalizarCampana: (campanaId: string) =>
        escribir((s) => ({
          ...s,
          cambios: {
            ...s.cambios,
            [campanaId]: { ...s.cambios[campanaId], estado: "finalizada" },
          },
        })),

      /** Reclama quien tiene algo que perder; a partir de aquí decide el admin. */
      abrirDisputa: (datos: {
        participacion: Participacion
        abrePor: "clipero" | "agencia"
        motivo: MotivoDisputa
        detalle?: string
      }) => {
        const { disputa, participacion } = abrirDisputaDominio({
          id: nuevoId("dis"),
          // El «hoy» de la demo, como el resto de las campañas: con el reloj
          // real la disputa nacía después del hoy de la cola y la antigüedad
          // (el criterio con el que el admin ordena) salía siempre en cero
          en: HOY_CAMPANAS,
          ...datos,
        })
        escribir((s) => ({
          ...s,
          disputas: [...s.disputas, disputa],
          cambiosParticipacion: {
            ...s.cambiosParticipacion,
            [participacion.id]: participacion,
          },
        }))
      },

      /** El laudo del admin: lo único que desbloquea una participación en disputa. */
      resolverDisputa: (
        d: Disputa,
        p: Participacion,
        laudo: Laudo,
        datos: { notaAdmin?: string; prorrogaDias?: number } = {}
      ) => {
        const r = resolverDisputaDominio(d, p, laudo, {
          ...datos,
          // El «hoy» de la demo, como `abrirDisputa`: con el reloj real el
          // laudo se fechaba después del hoy de la cola
          en: HOY_CAMPANAS,
        })
        escribir((s) => ({
          ...s,
          disputas: s.disputas.some((x) => x.id === d.id)
            ? s.disputas.map((x) => (x.id === d.id ? r.disputa : x))
            : [...s.disputas, r.disputa],
          cambiosParticipacion: {
            ...s.cambiosParticipacion,
            [p.id]: r.participacion,
          },
          // Y el clip, que es lo único que liquida: sin esto, «Pagar al
          // clipero» dejaba el compromiso cumplido y el dinero quieto
          cambiosEnvio: r.envio
            ? {
                ...s.cambiosEnvio,
                [r.envio.id]: {
                  ...s.cambiosEnvio[r.envio.id],
                  estado: r.envio.estado,
                },
              }
            : s.cambiosEnvio,
        }))
      },

      /**
       * «Reiniciar demo»: campañas, envíos y retiros, la cuenta, el plan y el
       * catálogo de Formación. Todo lo que este navegador haya tocado.
       */
      /**
       * Los cinco almacenes que SOLO se usan aquí se piden al pulsar. Traerlos
       * de forma estática metía el calendario, los avisos, el catálogo de
       * micropreguntas, las publicaciones y el de Formación —con sus semillas—
       * en todas las rutas de la app y del backoffice, por un botón de
       * demostración. Los otros cuatro se quedan: la carcasa ya los carga.
       */
      reiniciar: async () => {
        escribir(() => VACIO)
        reiniciarCuenta()
        reiniciarPlan()
        reiniciarCuentas()
        reiniciarFeedback()
        reiniciarCatalogoPlanes()
        const [agenda, avisos, micro, publicacion, formacion] = await Promise.all([
          import("@/hooks/use-agenda"),
          import("@/hooks/use-avisos"),
          import("@/hooks/use-catalogo-micro"),
          import("@/hooks/use-publicacion"),
          import("@/hooks/use-catalogo-formacion"),
        ])
        // «Todo lo que este navegador haya tocado» tiene que ser todo, o
        // reiniciar deja media demo con el estado de la sesión anterior
        agenda.reiniciarAgenda()
        avisos.reiniciarAvisos()
        micro.reiniciarCatalogoMicro()
        publicacion.reiniciarPublicacion()
        formacion.reiniciarCatalogo()
      },
    }),
    []
  )

  return {
    campanas,
    envios,
    participaciones,
    disputas,
    retiros,
    perfil: p.perfil,
    solicitudAgencia: p.solicitudAgencia,
    entrevista: p.entrevista,
    planAsignado: p.planAsignado,
    datosSolicitud: p.datosSolicitud,
    motivoRechazo: p.motivoRechazo,
    desbloqueadas: p.desbloqueadas,
    solicitudesListaBlanca: p.solicitudesListaBlanca,
    cuenta,
    ...acciones,
  }
}
