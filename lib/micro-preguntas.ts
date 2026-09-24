import {
  esRender,
  pasosDe,
  ramaDe,
  validarToma,
  type CampoId,
  type Cuenta,
  type CuentaPublicacion,
  type MicroPreguntas,
  type PasoId,
  type RespuestasToma,
} from "@/lib/onboarding"
import { AUN_NO_SE, type Vertical } from "@/lib/taxonomia"
// Solo el tipo: `lib/micro-catalogo.ts` importa de aquí, y traerse un valor
// cerraría el ciclo. Sin catálogo mandan las constantes de este módulo, que son
// justo las que el catálogo usa de semilla
import type { CatalogoMicro, PreguntaCatalogo } from "@/lib/micro-catalogo"

/**
 * Perfilado progresivo (§6.5-§6.7 de `docs/onboarding-2026-09.md`): lo que no
 * se pregunta en el alta se pregunta cuando sirve, de una en una.
 *
 * Todo es puro: la fecha (`ahora`) la pone quien llama, dentro de un efecto o
 * un manejador. El estado vive en `Cuenta.microPreguntas` (`hooks/use-cuenta.ts`)
 * y los componentes están en `components/onboarding/micro-question.tsx`,
 * `profile-progress-card.tsx` y `onboarding-nudge.tsx`.
 *
 * Reglas de §6.6:
 * 1. Como mucho una por sesión y una cada 3 días. Nunca en mitad de una tarea,
 *    salvo que sea requisito de esa tarea (los datos que faltan para enviar un
 *    clip no esperan: `requisitosQueFaltan`).
 * 2. Siempre con «Ahora no» (vuelve a los 7 días) y «No volver a preguntar».
 * 3. Cada una lleva su «Para qué» y la etiqueta de datos.
 * 4. No suenan ni celebran.
 * 5. Lo que se puede medir no se pregunta.
 */

const DIA_MS = 86_400_000

/** Micropreguntas, en orden de prioridad dentro de su lugar. */
export const MICRO_IDS = [
  "experiencia",
  "ligas",
  "generos",
  "formatos",
  "disponibilidad",
  "motivo-pausa",
  "motivaciones",
  "herramientas",
  "sigues-clipeando",
] as const
export type MicroId = (typeof MICRO_IDS)[number]

/** `true` si el id es una de las nueve tipadas; si no, la escribió el admin. */
export const esMicroId = (v: string): v is MicroId =>
  (MICRO_IDS as readonly string[]).includes(v)

/** Dónde sale cada una: una línea dentro de «Enviar clip» o una tarjeta en el panel. */
export const LUGARES_MICRO = ["panel", "enviar"] as const
export type LugarMicro = (typeof LUGARES_MICRO)[number]

export const LUGAR_MICRO: Record<MicroId, LugarMicro> = {
  experiencia: "enviar",
  ligas: "panel",
  generos: "panel",
  formatos: "panel",
  disponibilidad: "panel",
  "motivo-pausa": "panel",
  motivaciones: "panel",
  herramientas: "panel",
  "sigues-clipeando": "panel",
}

/** Campo de la cuenta que responde cada micropregunta. */
export const CAMPO_MICRO: Record<MicroId, CampoId> = {
  experiencia: "clipero.experiencia",
  ligas: "clipero.subverticales",
  generos: "clipero.subverticales",
  formatos: "clipero.subverticales",
  disponibilidad: "clipero.disponibilidad",
  "motivo-pausa": "clipero.motivoPausa",
  motivaciones: "clipero.motivaciones",
  herramientas: "clipero.herramientas",
  "sigues-clipeando": "clipero.verticales",
}

export const REGLAS_MICRO = {
  /** Una cada 3 días como mucho. */
  diasEntre: 3,
  /** «Ahora no» (lo aplica `use-cuenta`: `DIAS_MICRO_POSPUESTA`). */
  diasPospuesta: 7,
  /** Día 7 desde el alta: motivaciones. */
  diasMotivaciones: 7,
  /** Día 14 desde el alta: herramientas. */
  diasHerramientas: 14,
  /** 7 días sin enviar clips tras el último envío: qué le frena. */
  diasSinEnvios: 7,
  /** 180 días desde que eligió sus temas: ¿sigue clipeándolos? */
  diasRevalidar: 180,
  /** Tercer envío: disponibilidad. */
  enviosDisponibilidad: 3,
  /** Ligas, géneros o formatos que se pueden marcar. */
  maxSubverticales: 3,
} as const

/** Primer aprobado en estas verticales → la subvertical que se pregunta. */
export const SUBVERTICAL_MICRO = {
  deportes: "ligas",
  musica: "generos",
  "directos-irl": "formatos",
} as const satisfies Partial<Record<Vertical, MicroId>>
type VerticalConSub = keyof typeof SUBVERTICAL_MICRO

/** Lo que hace falta de un envío (vale un `Envio` de `lib/campanas.ts`). */
export interface EnvioMicro {
  campanaId: string
  estado: string
  enviadoEn: string
}

export type CuentaMicro = Pick<
  Cuenta,
  | "tipo"
  | "creadaEn"
  | "clipero"
  | "meta"
  | "onboarding"
  | "microPreguntas"
  | "respuestasLibres"
>

export interface DatosMicro {
  cuenta: CuentaMicro
  /**
   * Qué se pregunta hoy y cuándo. Sin él manda el de fábrica, que es lo que
   * pasa en los tests del dominio y en el render de servidor.
   */
  catalogo?: CatalogoMicro
  /** Solo los envíos de esta cuenta. */
  envios: readonly EnvioMicro[]
  /** Vertical de una campaña (`Campana.vertical`). */
  verticalDe: (campanaId: string) => Vertical | undefined
  /** ISO, leído en el efecto o el manejador. */
  ahora: string
}

/**
 * Una micropregunta que toca hacer, con el dato que la dispara.
 *
 * El id ya no es solo uno de los nueve: el admin puede escribir preguntas
 * nuevas desde el backoffice y las suyas llegan aquí con su propio id
 * (`micro_…`). Quien la pinta distingue las dos por el catálogo, no por el id.
 */
export interface MicroCandidata {
  id: MicroId | string
  /** Campaña del primer aprobado (ligas, géneros, formatos). */
  campanaId?: string
  /** Días que la disparan (sin enviar, desde que eligió temas). */
  dias?: number
}

/**
 * Envíos de esta cuenta. En la demo todas las cuentas del navegador comparten
 * `userId` (el de «Ana Ruiz», dueño de los envíos semilla): el nombre con el
 * que se firmó el envío separa a quien se acaba de registrar de la cuenta demo.
 * Con la API real basta con el `userId`.
 */
export function enviosDeCuenta<
  T extends EnvioMicro & { userId?: string; creador: string },
>(envios: readonly T[], cuenta: { userId: string; nombre: string }): T[] {
  return envios.filter((e) => e.userId === cuenta.userId && e.creador === cuenta.nombre)
}

/** Días completos entre dos fechas ISO; `null` si alguna no es válida. */
export function diasEntre(
  desde: string | null | undefined,
  hasta: string
): number | null {
  const d = desde ? Date.parse(desde) : NaN
  const h = Date.parse(hasta)
  if (!Number.isFinite(d) || !Number.isFinite(h)) return null
  return Math.floor((h - d) / DIA_MS)
}

const tieneLista = (x: readonly unknown[] | undefined) => !!x && x.length > 0

/** Subvertical ya respondida para esa micropregunta. */
function subverticalRespondida(c: CuentaMicro, id: "ligas" | "generos" | "formatos") {
  return tieneLista(c.clipero.subverticales?.[id])
}

/**
 * Micropreguntas que tocan en un lugar, en orden de prioridad, sin mirar aún
 * los límites de frecuencia ni lo pospuesto (eso es `elegirMicro`).
 *
 * - Solo cliperos. En el panel, solo con el onboarding completado: mientras
 *   no lo esté, lo que se pide es terminarlo (tarjeta «Termina tu perfil»).
 * - Enviar clip: la experiencia, la primera vez que no está respondida.
 * - Panel: subverticales tras el primer aprobado en deportes, música o
 *   directos (por fecha de aprobación), disponibilidad al tercer envío, qué le
 *   frena tras 7 días sin enviar, motivaciones el día 7, herramientas el 14 y
 *   «¿Sigues clipeando…?» a los 180 días de elegir temas.
 */
export function candidatasMicro(d: DatosMicro, lugar: LugarMicro): MicroCandidata[] {
  const c = d.cuenta
  if (c.tipo !== "clipero") return []
  const cl = c.clipero
  const reglas = d.catalogo?.reglas ?? REGLAS_MICRO

  /** Apagada desde el backoffice: deja de preguntarse, sin borrar lo respondido. */
  const activa = (id: string) =>
    !d.catalogo || d.catalogo.preguntas.some((p) => p.id === id && p.activa)
  /** Dónde sale hoy: el admin puede haberla movido de sitio. */
  const enEsteLugar = (id: MicroId) =>
    activa(id) &&
    (d.catalogo?.preguntas.find((p) => p.id === id)?.lugar ?? LUGAR_MICRO[id]) === lugar

  if (lugar === "enviar" && !enEsteLugar("experiencia") && !hayCreadas(d, lugar))
    return []
  if (lugar === "enviar" && enEsteLugar("experiencia") && !cl.experiencia)
    return ordenar(d, [{ id: "experiencia" }, ...creadasPendientes(d, lugar)])
  if (lugar === "enviar") return ordenar(d, creadasPendientes(d, lugar))
  if (c.onboarding.estado !== "completado") return []

  const out: MicroCandidata[] = []
  const porFecha = [...d.envios].sort(
    (a, b) => Date.parse(a.enviadoEn) - Date.parse(b.enviadoEn)
  )

  // 1. Primer aprobado en deportes, música o directos, por orden de llegada
  const vistas = new Set<VerticalConSub>()
  for (const envio of porFecha) {
    if (envio.estado !== "aprobado") continue
    const vertical = d.verticalDe(envio.campanaId)
    if (!vertical || !(vertical in SUBVERTICAL_MICRO)) continue
    const v = vertical as VerticalConSub
    if (vistas.has(v)) continue
    vistas.add(v)
    const id = SUBVERTICAL_MICRO[v]
    if (enEsteLugar(id) && !subverticalRespondida(c, id))
      out.push({ id, campanaId: envio.campanaId })
  }

  // 2. Tercer envío
  if (
    enEsteLugar("disponibilidad") &&
    d.envios.length >= reglas.enviosDisponibilidad &&
    !cl.disponibilidad
  )
    out.push({ id: "disponibilidad" })

  // 3. Siete días sin enviar tras el último envío (y sin responder desde entonces)
  const ultimo = porFecha.at(-1)?.enviadoEn
  const sinEnviar = diasEntre(ultimo, d.ahora)
  if (
    enEsteLugar("motivo-pausa") &&
    ultimo &&
    sinEnviar !== null &&
    sinEnviar >= reglas.diasSinEnvios
  ) {
    const respondida = c.meta["clipero.motivoPausa"]?.en
    const vigente =
      !!cl.motivoPausa && !!respondida && Date.parse(respondida) >= Date.parse(ultimo)
    if (!vigente) out.push({ id: "motivo-pausa", dias: sinEnviar })
  }

  // 4. Días desde el alta
  const desdeAlta = diasEntre(c.creadaEn, d.ahora)
  if (
    enEsteLugar("motivaciones") &&
    desdeAlta !== null &&
    desdeAlta >= reglas.diasMotivaciones &&
    !tieneLista(cl.motivaciones)
  )
    out.push({ id: "motivaciones" })
  if (
    enEsteLugar("herramientas") &&
    desdeAlta !== null &&
    desdeAlta >= reglas.diasHerramientas &&
    !tieneLista(cl.herramientas)
  )
    out.push({ id: "herramientas" })

  // 5. Temas elegidos hace 180 días
  if (Array.isArray(cl.verticales) && cl.verticales.length) {
    const desdeTemas = diasEntre(c.meta["clipero.verticales"]?.en, d.ahora)
    if (
      enEsteLugar("sigues-clipeando") &&
      desdeTemas !== null &&
      desdeTemas >= reglas.diasRevalidar
    )
      out.push({ id: "sigues-clipeando", dias: desdeTemas })
  }

  // Y las que escribió el admin, con la única regla que pueden tener
  out.push(...creadasPendientes(d, lugar))
  return ordenar(d, out)
}

/** Las preguntas del admin de ese lugar que todavía no se han respondido. */
function creadasPendientes(d: DatosMicro, lugar: LugarMicro): MicroCandidata[] {
  if (!d.catalogo) return []
  const desdeAlta = diasEntre(d.cuenta.creadaEn, d.ahora)
  return d.catalogo.preguntas
    .filter(
      (p): p is PreguntaCatalogo =>
        p.origen === "creada" &&
        p.activa &&
        p.lugar === lugar &&
        // Sin alta todavía no hay días que contar: se pregunta igual
        (desdeAlta === null || desdeAlta >= (p.desdeAltaDias ?? 0)) &&
        !(d.cuenta.respuestasLibres?.[p.id]?.length > 0)
    )
    .map((p) => ({ id: p.id }))
}

const hayCreadas = (d: DatosMicro, lugar: LugarMicro) =>
  creadasPendientes(d, lugar).length > 0

/** En el orden que el admin puso. Sin catálogo, en el de siempre. */
function ordenar(d: DatosMicro, lista: MicroCandidata[]): MicroCandidata[] {
  if (!d.catalogo) return lista
  const orden = new Map(d.catalogo.preguntas.map((p) => [p.id, p.orden]))
  return [...lista].sort((a, b) => (orden.get(a.id) ?? 999) - (orden.get(b.id) ?? 999))
}

/** Ni descartada ni pospuesta hasta después de `ahora`. */
export function microDisponible(
  micro: MicroPreguntas,
  id: MicroId | string,
  ahora: string
): boolean {
  if (micro.descartadas.includes(id)) return false
  const hasta = micro.pospuestas[id]
  return !hasta || Date.parse(hasta) <= Date.parse(ahora)
}

/** Han pasado 3 días desde la última micropregunta (o no ha habido ninguna). */
export function puedePreguntar(
  micro: MicroPreguntas,
  ahora: string,
  diasEntre: number = REGLAS_MICRO.diasEntre
): boolean {
  if (!micro.ultimaEn) return true
  const desde = Date.parse(micro.ultimaEn)
  if (!Number.isFinite(desde)) return true
  return Date.parse(ahora) - desde >= diasEntre * DIA_MS
}

/**
 * La micropregunta de un lugar, con las reglas de frecuencia de §6.6.
 *
 * - `idSesion`: la que ya salió en esta sesión. Si sigue pendiente en este
 *   lugar, vuelve a salir la misma (`nueva: false`, no cuenta otra vez); si no
 *   (respondida, pospuesta o de otro lugar), no sale ninguna: una por sesión.
 * - Sin sesión: solo si han pasado 3 días desde la última. `nueva: true`
 *   significa que hay que marcarla como vista (`verMicro`) y guardarla en la sesión.
 */
export function elegirMicro(
  d: DatosMicro,
  lugar: LugarMicro,
  idSesion: string | null
): { candidata: MicroCandidata; nueva: boolean } | null {
  const disponibles = candidatasMicro(d, lugar).filter((x) =>
    microDisponible(d.cuenta.microPreguntas, x.id, d.ahora)
  )
  if (idSesion) {
    const misma = disponibles.find((x) => x.id === idSesion)
    return misma ? { candidata: misma, nueva: false } : null
  }
  if (
    !puedePreguntar(
      d.cuenta.microPreguntas,
      d.ahora,
      d.catalogo?.reglas.diasEntre ?? REGLAS_MICRO.diasEntre
    )
  )
    return null
  return disponibles[0] ? { candidata: disponibles[0], nueva: true } : null
}

/* ---------------------------------------------------------------------------
   Requisitos para enviar un clip (M2): no son micropreguntas, son obligatorios
   --------------------------------------------------------------------------- */

export const REQUISITOS_CAMPANA = ["redes", "pais", "idiomas"] as const
export type RequisitoCampana = (typeof REQUISITOS_CAMPANA)[number]

/**
 * Lo que falta para unirse a una campaña (§6.5, primera fila): redes, país e
 * idiomas, con la misma validación que las tomas `redes` y `basicos`.
 */
export function requisitosQueFaltan(r: RespuestasToma): RequisitoCampana[] {
  const errores = [...validarToma("redes", r), ...validarToma("basicos", r)].filter(
    (e) => e.bloquea
  )
  return REQUISITOS_CAMPANA.filter((campo) => errores.some((e) => e.campo === campo))
}

/* ---------------------------------------------------------------------------
   «Termina tu perfil» y primera misión
   --------------------------------------------------------------------------- */

type CuentaPerfil = Pick<
  Cuenta,
  "tipo" | "mayorDeEdad" | "consentimientos" | "clipero" | "onboarding"
>

/** Clipero de campañas (o de las dos cosas) sin temas: su feed es genérico. */
export function faltanNichos(c: Pick<Cuenta, "tipo" | "clipero">): boolean {
  if (c.tipo !== "clipero" || ramaDe(c) !== "clipero") return false
  const v = c.clipero.verticales
  return v !== AUN_NO_SE && !(Array.isArray(v) && v.length > 0)
}

/**
 * ¿Sale la tarjeta «Termina tu perfil» (y el punto de la barra lateral)? Con
 * el onboarding sin completar, o completado sin temas (§2.9).
 */
export function perfilPendiente(c: CuentaPerfil): boolean {
  return c.onboarding.estado !== "completado" || faltanNichos(c)
}

/** Toma a la que lleva «Termina tu perfil»: donde lo dejó o, si ya completó, sus temas. */
export function pasoParaRetomar(c: CuentaPerfil): PasoId | null {
  const o = c.onboarding
  if (o.estado === "completado") return faltanNichos(c) ? "nichos" : null
  return o.pasoAbandono ?? o.pasoActual ?? null
}

/** Tomas que quedan por responder o saltar (sin contar el render). */
export function tomasPendientes(c: CuentaPerfil): PasoId[] {
  const o = c.onboarding
  if (o.estado === "completado") return faltanNichos(c) ? ["nichos"] : []
  return pasosDe(o.flujo ?? c.tipo, c.clipero.objetivo, o.modo, c).filter(
    (p) => !esRender(p) && !o.pasosRespondidos.includes(p) && !o.pasosSaltados.includes(p)
  )
}

export const MISIONES = ["proyecto", "unirse", "conectar", "enviar"] as const
export type MisionId = (typeof MISIONES)[number]

/**
 * Primera misión del clipero (§6.1 y §2.6): «Únete a una campaña» → «Conecta
 * tu {red}» → «Envía tu primer clip». En «las dos cosas», además, el primer
 * proyecto. Quien solo recorta sus videos no tiene misión de campañas.
 *
 * - Unirse: ya ha enviado a alguna campaña o ha desbloqueado una privada.
 * - Conectar: una cuenta viva en el almacén de redes, o una declarada con
 *   seguidores medidos. Las dos, porque conectar de verdad se hace en Ajustes
 *   y eso no escribe en `clipero.cuentas`: mirar solo ahí daba por pendiente
 *   una misión ya cumplida, igual que pasaba con la completitud del perfil.
 *
 * Y nada de mandar deberes que el plan no deja hacer: con un plan que no
 * participa en campañas —Prueba— no se pide unirse a ninguna ni enviar un
 * clip, porque el candado salta tres pantallas después. Lo que sí se puede
 * hacer siempre es conectar una red, aunque el plan solo permita una.
 */
export function misionesDe(
  c: Pick<Cuenta, "tipo" | "clipero">,
  datos: { envios: number; desbloqueadas: number; proyectos: number },
  conectadas: readonly CuentaPublicacion[] = [],
  plan: { participaEnCampanas: boolean } = { participaEnCampanas: true }
): { id: MisionId; hecha: boolean }[] {
  if (c.tipo !== "clipero" || c.clipero.objetivo === "mis-videos") return []
  const conectada =
    conectadas.length > 0 ||
    (c.clipero.cuentas ?? []).some((x) => x.seguidoresMedidos != null)
  const campanas: { id: MisionId; hecha: boolean }[] = [
    ...(plan.participaEnCampanas
      ? [{ id: "unirse" as const, hecha: datos.envios > 0 || datos.desbloqueadas > 0 }]
      : []),
    { id: "conectar", hecha: conectada },
    ...(plan.participaEnCampanas
      ? [{ id: "enviar" as const, hecha: datos.envios > 0 }]
      : []),
  ]
  return c.clipero.objetivo === "ambos"
    ? [{ id: "proyecto", hecha: datos.proyectos > 0 }, ...campanas]
    : campanas
}
