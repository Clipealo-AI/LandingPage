import {
  HOY_CAMPANAS,
  aceptaEnvios,
  estadoVisible,
  liquidar,
  type Campana,
  type Envio,
} from "@/lib/campanas"
import {
  ZONA_POR_DEFECTO,
  desdeDia,
  diaDe,
  diasDeLaSemana,
  horasDelDia,
  instanteDe,
  minutosDelDia,
  type Dia,
  type Zona,
} from "@/lib/fechas"
import { publicaciones, type Publicacion } from "@/lib/analytics"
import {
  DUENOS_CUENTA,
  SOCIAL_IDS,
  SOCIAL_NETWORKS,
  cuentaActiva,
  cuentaPorId,
  type DuenoCuenta,
  type SocialAccount,
  type SocialId,
} from "@/lib/social"
import type { CopiaPublicacion } from "@/lib/publicacion"
import type { AspectRatioKey, Clip } from "@/lib/types"

/**
 * El dominio de las publicaciones: lo que va a salir y lo que ya salió.
 *
 * **Clipealo publica en las cuentas conectadas que la persona elija**, ahora o
 * a la hora que marque (decisión del director, 20 de septiembre de 2026; antes
 * era al revés y está anotado en `docs/costuras-backend.md`). Una entrada dice
 * qué clip, en qué CUENTA, con qué texto y cuándo; quién la lleva hasta la red
 * es una capa aparte —`ProveedorPublicacion`—, y el que publica solo es
 * `clipealo`. El camino manual no desaparece: lo subido fuera de Clipealo se
 * marca con su enlace, que es el mismo que Analíticas sabe seguir.
 *
 * Por eso hay **cinco estados guardados**: `planificada` mientras espera su
 * hora, `publicando` mientras el envío está en marcha, `publicada` con su
 * enlace, `fallida` con el motivo, y `cancelada`. Lo demás se DERIVA de
 * `(entrada, cuentas, instante)`, igual que `estadoVisible` deriva «vencida»
 * en las campañas: una planificada cuya cuenta ya no está es `sin-cuenta`, y
 * una que pasó su hora es `publicando` si la lleva Clipealo o `toca-publicar`
 * si la publica la persona.
 *
 * El envío de verdad no vive aquí: lo hace `lib/api/publicaciones.ts`, que es
 * la frontera con el servidor. Este archivo no sabe de red ni de tokens.
 *
 * El «ahora» se pasa siempre desde fuera (`AHORA_AGENDA` por defecto): nunca
 * `Date.now()` al pintar, o el servidor y el navegador dibujan cosas distintas.
 */

/* ---------------------------------------------------------------------------
   El «ahora» y la capa de proveedor
   --------------------------------------------------------------------------- */

/**
 * El instante contra el que se derivan los estados. Es el mismo «hoy» del resto
 * del producto (`HOY_CAMPANAS` === `INDEXADO_EN`): no se inventa un cuarto.
 */
export const AHORA_AGENDA = HOY_CAMPANAS

/** Quién lleva el clip hasta la red. */
export const PROVEEDORES = ["clipealo", "manual"] as const
export type Proveedor = (typeof PROVEEDORES)[number]

export interface ProveedorPublicacion {
  id: Proveedor
  /**
   * ¿Envía él solo, sin que la persona abra la red? De esto depende lo que la
   * interfaz puede prometer y qué estado deriva una entrada vencida: con
   * `true` la publicación sale sola; con `false` hay que recordarla.
   */
  publicaSolo: boolean
  /** Redes que sabe enviar. */
  redes: readonly SocialId[]
}

/** Clipealo publica: es el proveedor de todo lo que se programa desde aquí. */
export const PROVEEDOR_CLIPEALO: ProveedorPublicacion = {
  id: "clipealo",
  publicaSolo: true,
  redes: SOCIAL_IDS,
}

/**
 * Lo que publica la persona por su cuenta. Sigue existiendo porque sigue
 * pasando: un clip subido a mano desde el móvil se marca con su enlace y entra
 * en Analíticas igual. También es lo que son las publicaciones de antes.
 */
export const PROVEEDOR_MANUAL: ProveedorPublicacion = {
  id: "manual",
  publicaSolo: false,
  redes: SOCIAL_IDS,
}

export const PROVEEDORES_DISPONIBLES: Record<Proveedor, ProveedorPublicacion> = {
  clipealo: PROVEEDOR_CLIPEALO,
  manual: PROVEEDOR_MANUAL,
}

/**
 * El proveedor de una entrada. Sin él, el manual: lo guardado antes de que
 * Clipealo publicara lo publicó la persona, y darlo por nuestro haría que una
 * entrada vieja y vencida dijera «saliendo» de algo que nadie va a enviar.
 */
export const proveedorDe = (e: Pick<EntradaAgenda, "proveedor">): ProveedorPublicacion =>
  PROVEEDORES_DISPONIBLES[e.proveedor ?? "manual"] ?? PROVEEDOR_MANUAL

/** ¿Esta entrada la envía Clipealo solo? */
export const publicaSolo = (e: Pick<EntradaAgenda, "proveedor">) =>
  proveedorDe(e).publicaSolo

/* ---------------------------------------------------------------------------
   Por qué no salió
   --------------------------------------------------------------------------- */

/**
 * Los motivos de fallo, como códigos y no como la frase que devuelva la
 * plataforma: el texto se traduce (`calendario.fallo.*`) y la decisión de qué
 * ofrecer depende del motivo. `cuentaCaducada` y `permisoDenegado` se arreglan
 * reconectando; `rechazoRed` y `limiteApi`, reintentando.
 */
export const FALLOS_PUBLICACION = [
  "cuentaCaducada",
  "permisoDenegado",
  "rechazoRed",
  "limiteApi",
  "sinRed",
] as const
export type FalloPublicacion = (typeof FALLOS_PUBLICACION)[number]

/** Los que no se arreglan reintentando: hay que volver a conectar la cuenta. */
export const PIDE_RECONECTAR: readonly FalloPublicacion[] = [
  "cuentaCaducada",
  "permisoDenegado",
]

export const seArreglaReconectando = (f: FalloPublicacion | undefined) =>
  f !== undefined && PIDE_RECONECTAR.includes(f)

/* ---------------------------------------------------------------------------
   La entrada
   --------------------------------------------------------------------------- */

/**
 * Los cinco estados que se GUARDAN, en el orden del ciclo. Etiquetas en
 * `calendario.estado.*`. `publicando` y `fallida` son de envío y existen desde
 * que Clipealo publica: antes habrían sido decorado.
 */
export const ESTADOS_AGENDA = [
  "planificada",
  "publicando",
  "publicada",
  "fallida",
  "cancelada",
] as const
export type EstadoAgenda = (typeof ESTADOS_AGENDA)[number]

/** Ya no va a salir por sí sola: o salió, o se canceló. */
export const ESTADOS_CERRADOS: readonly EstadoAgenda[] = ["publicada", "cancelada"]

/** Las dos caras del producto. Coincide con `DuenoCuenta` de `lib/social.ts`. */
export const DUENOS_AGENDA = DUENOS_CUENTA
export type DuenoAgenda = DuenoCuenta

export interface EntradaAgenda {
  id: string
  /** Opcional, como `Publicacion.clipId`: lo publicado puede no tener clip vivo. */
  clipId?: string
  /** Denormalizado: filtrar por proyecto sin cruzar la biblioteca de clips. */
  proyectoId?: string
  /** Contenido de usuario: NO se traduce. */
  titulo: string
  red: SocialId
  cuentaId?: string
  /**
   * INSTANTE UTC. El único dato de tiempo que se guarda: la zona es pintura,
   * cambiarla repinta el calendario pero no mueve nada.
   */
  programadaPara: string
  /** En qué zona se eligió, solo para avisar si la activa es otra. */
  zonaOrigen: Zona
  /** Propuesto desde `clip.hook`. Uno por entrada, no uno por red. */
  texto: string
  /**
   * El texto con el que sale, resuelto al programar (`lib/publicacion.ts`):
   * lo propio del clip o la plantilla de su proyecto. Se guarda con la entrada
   * porque es lo que DE VERDAD se envió, y cambiar la plantilla después no
   * puede reescribir la historia.
   */
  copia?: CopiaPublicacion
  estado: EstadoAgenda
  /** Solo con estado `publicada`. */
  url?: string
  /** Lo que devuelve la plataforma: con él se leen las métricas más tarde. */
  postId?: string
  publicadaEn?: string
  /** Solo con estado `fallida`. Código, nunca la frase de la plataforma. */
  fallo?: FalloPublicacion
  /** Cuántas veces se intentó. Sin valor, ninguna todavía. */
  intentos?: number
  campanaId?: string
  /** El mismo clip a varias redes sale de una acción y se agrupa. */
  loteId?: string
  dueno: DuenoAgenda
  /** Sin valor, `manual`. Ver `ProveedorPublicacion`. */
  proveedor?: Proveedor
  creadaEn: string
}

/** Una entrada antes de tener id: los ids se crean en un manejador, no al pintar. */
export type NuevaEntrada = Omit<EntradaAgenda, "id" | "creadaEn">

/* ---------------------------------------------------------------------------
   Estado derivado
   --------------------------------------------------------------------------- */

/**
 * Lo que se PINTA. Los cinco guardados más dos que se derivan:
 *
 * - `sin-cuenta`: la cuenta a la que iba ya no está conectada. Es un hecho, no
 *   un fallo de envío: la persona la desconectó en Ajustes y lo sabemos. Manda
 *   sobre todo lo demás, porque nada va a salir de ahí.
 * - `toca-publicar`: pasó su hora y sigue planificada, pero la publica la
 *   persona. Es el recordatorio de lo que Clipealo no lleva.
 *
 * Una planificada vencida que SÍ lleva Clipealo deriva `publicando`: está en
 * la cola, y decir «toca publicar» de algo que sale solo sería mentir.
 */
export const ESTADOS_VISTOS_AGENDA = [
  "planificada",
  "toca-publicar",
  "publicando",
  "publicada",
  "fallida",
  "cancelada",
  "sin-cuenta",
] as const
export type EstadoVistoAgenda = (typeof ESTADOS_VISTOS_AGENDA)[number]

/** ¿La cuenta a la que apunta la entrada sigue viva? */
export const cuentaViva = (cuentaId: string | undefined, cuentas: SocialAccount[]) => {
  const c = cuentaPorId(cuentaId, cuentas)
  return Boolean(c && cuentaActiva(c))
}

/**
 * Estado que se enseña. Función pura de `(entrada, cuentas, instante)`.
 *
 * `sin-cuenta` manda sobre `toca-publicar`: de nada sirve recordarle que suba
 * algo a una cuenta que ya no tiene. Una entrada sin `cuentaId` no es
 * `sin-cuenta` —nunca se eligió cuenta—; eso lo dice `validarEntrada`.
 */
export function estadoVistoAgenda(
  e: EntradaAgenda,
  cuentas: SocialAccount[],
  instante: string = AHORA_AGENDA
): EstadoVistoAgenda {
  // Lo cerrado no depende de la cuenta: ya salió, o ya no va a salir
  if (ESTADOS_CERRADOS.includes(e.estado)) return e.estado
  if (e.cuentaId && !cuentaViva(e.cuentaId, cuentas)) return "sin-cuenta"
  if (e.estado !== "planificada") return e.estado
  if (Date.parse(e.programadaPara) <= Date.parse(instante))
    return publicaSolo(e) ? "publicando" : "toca-publicar"
  return "planificada"
}

/** Las que esperan a que la persona las suba: las que no lleva Clipealo. */
export const tocaPublicar = (
  entradas: EntradaAgenda[],
  cuentas: SocialAccount[],
  instante: string = AHORA_AGENDA
) =>
  entradas
    .filter((e) => estadoVistoAgenda(e, cuentas, instante) === "toca-publicar")
    .sort((a, b) => a.programadaPara.localeCompare(b.programadaPara))

/** Los estados que piden algo de la persona. Es la bandeja de arriba. */
export const ESTADOS_QUE_PIDEN_ALGO: readonly EstadoVistoAgenda[] = [
  "fallida",
  "sin-cuenta",
  "toca-publicar",
]

/**
 * Lo que no salió y necesita una mano: falló el envío, la cuenta ya no está, o
 * la publica la persona y se le pasó la hora. Sustituye a la bandeja de
 * recordatorios: con Clipealo publicando, lo normal es que no haya nada aquí.
 */
export const necesitanAtencion = (
  entradas: EntradaAgenda[],
  cuentas: SocialAccount[],
  instante: string = AHORA_AGENDA
) =>
  entradas
    .filter((e) =>
      ESTADOS_QUE_PIDEN_ALGO.includes(estadoVistoAgenda(e, cuentas, instante))
    )
    .sort((a, b) => a.programadaPara.localeCompare(b.programadaPara))

/* ---------------------------------------------------------------------------
   Mover una publicación: qué se puede coger y dónde se puede soltar
   --------------------------------------------------------------------------- */

/** Paso del imantado. Con Mayús salta una hora entera; con Alt, afina. */
export const PASO_MOVER_MIN = 15
export const PASO_MOVER_FINO_MIN = 5
export const PASO_MOVER_GRANDE_MIN = 60

export const MOTIVOS_NO_MOVER = [
  "publicada",
  "publicando",
  "cancelada",
  "sinCuenta",
  "noEncaja",
] as const
export type MotivoNoMover = (typeof MOTIVOS_NO_MOVER)[number]

/**
 * Los códigos que dependen de CUÁNDO. Los demás —que el formato no encaje, que
 * el clip dure de más— no se arreglan cambiando la hora, así que enseñarlos
 * mientras se arrastra sería teñir de rojo todos los destinos por algo que el
 * gesto no puede resolver.
 */
const POR_EL_INSTANTE: readonly CodigoAgenda[] = [
  "enPasado",
  "duplicadaEnCuenta",
  "fueraDeVentanaCampana",
  "muyPegadaAOtra",
  "demasiadasHoy",
]

export const avisosDeMover = (avisos: AvisoAgenda[]): AvisoAgenda[] =>
  avisos.filter((a) => POR_EL_INSTANTE.includes(a.code))

/**
 * Por qué esta publicación no se puede mover, o `null` si sí se puede. Se
 * pregunta ANTES de ofrecer el gesto: un arrastre que no puede terminar en
 * ningún sitio es peor que no poder arrastrar.
 */
export function motivoNoMover(
  e: EntradaAgenda,
  cuentas: SocialAccount[],
  clip?: ClipDeAgenda
): MotivoNoMover | null {
  if (e.estado === "publicada") return "publicada"
  // En marcha no se mueve; fallida sí: reprogramarla es volver a intentarlo
  if (e.estado === "publicando") return "publicando"
  if (e.estado === "cancelada") return "cancelada"
  // `validarEntrada` bloquea también sin `cuentaId`, no solo con la cuenta
  // muerta: las dos cosas dejan el gesto sin ningún destino válido
  if (!e.cuentaId || !cuentaViva(e.cuentaId, cuentas)) return "sinCuenta"
  if (clip) {
    const red = SOCIAL_NETWORKS[e.red]
    if (!red.aspects.includes(clip.aspect)) return "noEncaja"
    if (duracionClip(clip) > red.maxSeconds) return "noEncaja"
  }
  return null
}

/**
 * El minuto del día donde cae el destino: imantado al paso y encerrado en la
 * franja que se está pintando. Lo usan los dos caminos —el ratón y el teclado—
 * para que el mismo movimiento no se valide distinto según por dónde se haga.
 *
 * El margen de abajo es el alto de una tarjeta: soltar a las 23:45 la dejaría
 * saliéndose media hora por debajo de la rejilla.
 */
export function encerrarDestino(
  minutos: number,
  franja: Franja,
  paso: number = PASO_MOVER_MIN
): { minutos: number; tope: boolean } {
  const suelo = franja.desde * 60
  const techo = Math.max(suelo, franja.hasta * 60 - DURACION_TARJETA_MIN)
  const imantado = Math.round(minutos / paso) * paso
  const dentro = Math.min(Math.max(imantado, suelo), techo)
  return { minutos: dentro, tope: dentro !== imantado }
}

/** El instante de un día y un minuto del día, en la zona de la cuenta. */
export const instanteDestino = (dia: Dia, minutos: number, zona: Zona) =>
  instanteDe(
    { ...desdeDia(dia), hora: Math.floor(minutos / 60), minuto: minutos % 60 },
    zona
  )

/* ---------------------------------------------------------------------------
   El filtro: qué parte de la agenda se está mirando
   --------------------------------------------------------------------------- */

/**
 * Las entradas que se quedaron sin cuenta no se pueden filtrar por id —la cuenta
 * ya no está en la lista y no hay handle que enseñar—, así que tienen su propio
 * valor. No choca con ningún id real: los ids de cuenta son `cta_*`.
 */
export const CUENTA_HUERFANA = "sin-cuenta"

/** Lo que se está mirando. No es estado guardado: vive en la URL. */
export interface FiltroAgenda {
  /** Vacío = todas. */
  redes: SocialId[]
  /** Id de cuenta, `CUENTA_HUERFANA`, o nada = todas. */
  cuenta?: string
}

/** Un filtro vacío no es un filtro: decide qué se enseña y qué no. */
export const hayFiltro = (f: FiltroAgenda) => f.redes.length > 0 || f.cuenta !== undefined

/**
 * En el orden de `SOCIAL_IDS` y sin repetidos, para que el MISMO filtro escriba
 * siempre el MISMO enlace: si el orden fuera el de los clics, dos personas con
 * la misma vista compartirían dos URLs distintas.
 */
export const normalizarRedes = (redes: readonly string[]): SocialId[] =>
  SOCIAL_IDS.filter((r) => redes.includes(r))

/**
 * Filtra por red y por cuenta. Las dos condiciones se SUMAN: un enlace imposible
 * (`?red=youtube&cuenta=cta_tk_ana`) devuelve vacío y la pantalla lo dice; no se
 * corrige a escondidas, porque entonces lo que se ve no sería lo que pone en la
 * barra de direcciones.
 */
export function filtrarAgenda(
  entradas: EntradaAgenda[],
  filtro: FiltroAgenda,
  cuentas: SocialAccount[]
): EntradaAgenda[] {
  if (!hayFiltro(filtro)) return entradas
  return entradas.filter((e) => {
    if (filtro.redes.length > 0 && !filtro.redes.includes(e.red)) return false
    if (filtro.cuenta === undefined) return true
    if (filtro.cuenta === CUENTA_HUERFANA)
      // Una entrada sin `cuentaId` nunca eligió cuenta: no está huérfana
      return Boolean(e.cuentaId) && !cuentaViva(e.cuentaId, cuentas)
    // A propósito NO se comprueba que siga viva: filtrar por la cuenta que
    // acabas de desconectar tiene que seguir enseñando sus planes huérfanos
    return e.cuentaId === filtro.cuenta
  })
}

/** Redes que tiene sentido ofrecer: donde hay cuenta viva o donde ya hay algo. */
export const redesFiltrables = (entradas: EntradaAgenda[], cuentas: SocialAccount[]) =>
  SOCIAL_IDS.filter(
    (r) =>
      cuentas.some((c) => c.network === r && cuentaActiva(c)) ||
      entradas.some((e) => e.red === r)
  )

/** ¿Hay planes apuntando a una cuenta que ya no está? Entonces se pueden aislar. */
export const hayHuerfanas = (entradas: EntradaAgenda[], cuentas: SocialAccount[]) =>
  entradas.some((e) => Boolean(e.cuentaId) && !cuentaViva(e.cuentaId, cuentas))

/* ---------------------------------------------------------------------------
   Validación: códigos, nunca frases
   --------------------------------------------------------------------------- */

/** Minutos que deben separar dos publicaciones de la misma cuenta. */
export const SEPARACION_MINIMA_MIN = 45

/** Publicaciones al día por cuenta a partir de las cuales se avisa. */
export const MAX_POR_CUENTA_DIA = 4

/** Qué falla. El texto vive en `calendar.compose.errors.<codigo>`. */
export const CODIGOS_AGENDA = [
  "sinClip",
  "sinCuenta",
  /** Día u hora a medio escribir: no es lo mismo que haber pasado. */
  "faltaFecha",
  "enPasado",
  "formatoNoAdmitido",
  "duracionExcedida",
  "duplicadaEnCuenta",
  "fueraDeVentanaCampana",
  "muyPegadaAOtra",
  "demasiadasHoy",
  "fueraDeDuracionIdeal",
] as const
export type CodigoAgenda = (typeof CODIGOS_AGENDA)[number]

/**
 * Cuáles impiden guardar. La ventana de campaña BLOQUEA (decisión del
 * director): programar dentro de una campaña para un día en que ya no acepta
 * clips es trabajo tirado, y el producto lo sabe antes de que ocurra.
 *
 * Los tres que no bloquean son consejos: el ritmo de la cuenta y el `sweetSpot`
 * —que es DURACIÓN, no franja horaria— no son reglas de la red.
 */
export const BLOQUEA: Record<CodigoAgenda, boolean> = {
  sinClip: true,
  sinCuenta: true,
  faltaFecha: true,
  enPasado: true,
  formatoNoAdmitido: true,
  duracionExcedida: true,
  duplicadaEnCuenta: true,
  fueraDeVentanaCampana: true,
  muyPegadaAOtra: false,
  demasiadasHoy: false,
  fueraDeDuracionIdeal: false,
}

/** Datos sin formato para el texto ICU. La interfaz los pinta en su idioma. */
export interface ValoresAviso {
  red?: SocialId
  aspecto?: AspectRatioKey
  /** Duración del clip, en segundos. */
  segundos?: number
  /** Extremos de un rango: máximo de la red, o el `sweetSpot`. */
  min?: number
  max?: number
  /** Minutos hasta la publicación vecina. */
  minutos?: number
  /** Cuántas hay ya (ese día, en esa cuenta). */
  n?: number
}

export interface AvisoAgenda {
  code: CodigoAgenda
  bloquea: boolean
  values?: ValoresAviso
}

const aviso = (code: CodigoAgenda, values?: ValoresAviso): AvisoAgenda => ({
  code,
  bloquea: BLOQUEA[code],
  values,
})

/** ¿Hay algún aviso que impida guardar? */
export const bloquean = (avisos: AvisoAgenda[]) => avisos.some((a) => a.bloquea)

/** Duración del clip en segundos, que es lo que miden las redes. */
export const duracionClip = (c: Pick<Clip, "range">) => c.range.end - c.range.start

/** Lo mínimo que hay que saber de un clip para validar y repartir. */
export type ClipDeAgenda = Pick<Clip, "id" | "sourceId" | "title" | "hook"> &
  Pick<Clip, "aspect" | "range">

/** Lo que se está a punto de guardar. */
export interface BorradorEntrada {
  /** Solo al editar una entrada que ya existe: no compite consigo misma. */
  id?: string
  clipId?: string
  red: SocialId
  cuentaId?: string
  programadaPara: string
  campanaId?: string
  /**
   * «Ahora» sale en cuanto se confirma, así que su instante es el de ahora y
   * no puede caer en `enPasado` por los milisegundos que tarde el clic.
   */
  modo?: "ahora" | "programada"
}

export interface ContextoAgenda {
  /** El clip del borrador. Sin él sale `sinClip`. */
  clip?: ClipDeAgenda
  cuentas: SocialAccount[]
  /** Todo lo que ya está en la agenda, para el ritmo y los duplicados. */
  entradas: EntradaAgenda[]
  /** La campaña elegida, si la hay. */
  campana?: Campana
  /** Envíos de esa campaña: hacen falta para saber si le queda presupuesto. */
  envios?: Envio[]
  /** Zona activa: decide qué es «el mismo día». */
  zona?: Zona
  instante?: string
}

const MINUTO = 60_000

/** Las entradas que compiten por el ritmo de una cuenta: ni canceladas ni ella. */
const vecinasDeCuenta = (
  entradas: EntradaAgenda[],
  cuentaId: string | undefined,
  excluir: string | undefined
) =>
  cuentaId
    ? entradas.filter(
        (e) => e.cuentaId === cuentaId && e.estado !== "cancelada" && e.id !== excluir
      )
    : []

/**
 * Todo lo que se puede decir de un borrador, en orden: primero lo que bloquea,
 * después los consejos. Nunca lanza; una lista vacía es «adelante».
 */
export function validarEntrada(b: BorradorEntrada, ctx: ContextoAgenda): AvisoAgenda[] {
  const zona = ctx.zona ?? ZONA_POR_DEFECTO
  const instante = ctx.instante ?? AHORA_AGENDA
  const red = SOCIAL_NETWORKS[b.red]
  const avisos: AvisoAgenda[] = []

  if (!b.clipId || !ctx.clip) avisos.push(aviso("sinClip"))

  if (!b.cuentaId || !cuentaViva(b.cuentaId, ctx.cuentas))
    avisos.push(aviso("sinCuenta", { red: b.red }))

  const cuando = Date.parse(b.programadaPara)
  if (!Number.isFinite(cuando) || (b.modo !== "ahora" && cuando < Date.parse(instante)))
    avisos.push(aviso("enPasado"))

  if (ctx.clip) {
    const segundos = duracionClip(ctx.clip)
    if (!red.aspects.includes(ctx.clip.aspect))
      avisos.push(aviso("formatoNoAdmitido", { red: b.red, aspecto: ctx.clip.aspect }))
    if (segundos > red.maxSeconds)
      avisos.push(aviso("duracionExcedida", { segundos, max: red.maxSeconds }))
  }

  const vecinas = vecinasDeCuenta(ctx.entradas, b.cuentaId, b.id)

  if (
    b.clipId &&
    vecinas.some((e) => e.clipId === b.clipId && e.programadaPara === b.programadaPara)
  )
    avisos.push(aviso("duplicadaEnCuenta", { red: b.red }))

  if (ctx.campana) {
    const l = liquidar(ctx.campana, ctx.envios ?? [])
    const dentro =
      cuando >= Date.parse(ctx.campana.inicio) && cuando <= Date.parse(ctx.campana.fin)
    // La campaña puede estar viva hoy y no aceptar clips el día planificado, y
    // al revés: se mira su estado y su ventana contra la fecha de la entrada
    // `yaDentro`: si esto se está planificando es porque hay un compromiso
    // aceptado, y una campaña con las inscripciones cerradas sigue esperando su
    // clip. La misma regla que usa la ficha de la campaña
    if (
      !dentro ||
      !aceptaEnvios(estadoVisible(ctx.campana, l, instante), { yaDentro: true })
    )
      avisos.push(aviso("fueraDeVentanaCampana"))
  }

  /* Consejos: no bloquean */

  let separacion = Infinity
  for (const e of vecinas) {
    const d = Math.abs(Date.parse(e.programadaPara) - cuando) / MINUTO
    if (d < separacion) separacion = d
  }
  if (separacion < SEPARACION_MINIMA_MIN)
    avisos.push(
      aviso("muyPegadaAOtra", {
        minutos: Math.round(separacion),
        min: SEPARACION_MINIMA_MIN,
      })
    )

  if (Number.isFinite(cuando)) {
    const dia = diaDe(b.programadaPara, zona)
    const yaHoy = vecinas.filter((e) => diaDe(e.programadaPara, zona) === dia).length
    if (yaHoy + 1 > MAX_POR_CUENTA_DIA)
      avisos.push(aviso("demasiadasHoy", { n: yaHoy + 1, max: MAX_POR_CUENTA_DIA }))
  }

  if (ctx.clip) {
    const segundos = duracionClip(ctx.clip)
    const [min, max] = red.sweetSpot
    // `sweetSpot` es DURACIÓN, no una franja horaria: no existen «mejores horas
    // para publicar» en este producto, e inventarlas sería mentir
    if (segundos < min || segundos > max)
      avisos.push(aviso("fueraDeDuracionIdeal", { segundos, min, max, red: b.red }))
  }

  return avisos
}

/* ---------------------------------------------------------------------------
   Colocación y consulta. Todo puro sobre (entradas, zona, instante)
   --------------------------------------------------------------------------- */

const porHora = (a: EntradaAgenda, b: EntradaAgenda) =>
  a.programadaPara.localeCompare(b.programadaPara) || a.id.localeCompare(b.id)

/**
 * Lo mismo para borradores, que TODAVÍA NO TIENEN id: a igual hora desempata la
 * red. Dos redes distintas sí pueden publicar a la vez, así que el empate es
 * normal y no puede reventar.
 */
const porHoraNueva = (a: NuevaEntrada, b: NuevaEntrada) =>
  a.programadaPara.localeCompare(b.programadaPara) || a.red.localeCompare(b.red)

/** Las entradas dentro de un intervalo de instantes, `[desde, hasta)`. */
export function enRango(
  entradas: EntradaAgenda[],
  desde: string,
  hasta: string
): EntradaAgenda[] {
  const a = Date.parse(desde)
  const b = Date.parse(hasta)
  return entradas
    .filter((e) => {
      const t = Date.parse(e.programadaPara)
      return t >= a && t < b
    })
    .sort(porHora)
}

/**
 * Las entradas agrupadas por día civil, en orden. La clave es una etiqueta
 * («2026-09-13»), no un instante: el mismo momento cae en días distintos según
 * la zona, y de eso vive esta función.
 */
export function porDia(
  entradas: EntradaAgenda[],
  zona: Zona = ZONA_POR_DEFECTO
): Map<Dia, EntradaAgenda[]> {
  const mapa = new Map<Dia, EntradaAgenda[]>()
  for (const e of [...entradas].sort(porHora)) {
    const dia = diaDe(e.programadaPara, zona)
    const lista = mapa.get(dia)
    if (lista) lista.push(e)
    else mapa.set(dia, [e])
  }
  return mapa
}

/** Alto de una tarjeta en la rejilla, en minutos. No es la duración del clip. */
export const DURACION_TARJETA_MIN = 30

export interface Colocada {
  entrada: EntradaAgenda
  /** Minutos desde la medianoche de su día, en la zona activa. */
  inicioMin: number
  finMin: number
  /** Columna dentro del solape, de 0 en adelante. */
  carril: number
  /** Cuántas columnas tiene su grupo de solapes: el ancho es `1 / carriles`. */
  carriles: number
}

/**
 * Reparte en columnas las entradas que se pisan, como hace cualquier agenda.
 * Puro: no sabe de píxeles, solo de minutos y de columnas.
 */
export function carriles(
  entradas: EntradaAgenda[],
  zona: Zona = ZONA_POR_DEFECTO,
  duracionMin: number = DURACION_TARJETA_MIN
): Colocada[] {
  const orden = [...entradas].sort(porHora)
  const salida: Colocada[] = []
  // Un «grupo» es una cadena de solapes: mientras algo siga abierto, se acumula
  let grupo: Colocada[] = []
  let finGrupo = -Infinity

  const cerrar = () => {
    const ancho = grupo.reduce((n, c) => Math.max(n, c.carril + 1), 0)
    for (const c of grupo) c.carriles = ancho
    salida.push(...grupo)
    grupo = []
    finGrupo = -Infinity
  }

  for (const entrada of orden) {
    const inicioMin = minutosDelDia(entrada.programadaPara, zona)
    const finMin = inicioMin + duracionMin
    if (inicioMin >= finGrupo) cerrar()
    const ocupados = new Set(
      grupo.filter((c) => c.finMin > inicioMin).map((c) => c.carril)
    )
    let carril = 0
    while (ocupados.has(carril)) carril += 1
    grupo.push({ entrada, inicioMin, finMin, carril, carriles: 1 })
    finGrupo = Math.max(finGrupo, finMin)
  }
  cerrar()
  return salida
}

/** Franja de horas que se pinta. Con suelo, para no enseñar filas vacías. */
export const FRANJA_MINIMA: [desde: number, hasta: number] = [7, 23]

export interface Franja {
  /** Primera hora que se pinta, 0–23. */
  desde: number
  /** Última hora que se pinta, exclusiva: 24 (o 23/25 al cambiar la hora). */
  hasta: number
  /** Horas reales de ese día en esa zona: 23, 24 o 25. */
  horas: number
  /** `true` si hay algo fuera de la franja mínima: el botón «ver el día entero». */
  recortada: boolean
}

/**
 * La franja de una vista que no pinta horas. Mes no tiene eje de tiempo dentro
 * de la celda: ni canal de horas, ni línea de ahora, ni nada que medir. Con
 * `desde === hasta` ningún instante cae «dentro», así que la línea de ahora ni
 * se llega a construir, sin necesidad de una regla CSS que la esconda.
 */
export const SIN_FRANJA: Franja = { desde: 0, hasta: 0, horas: 0, recortada: false }

/**
 * Publicaciones que se ven en una celda de mes antes del «+N más». Dos: con
 * tres, la celda deja de ser una celda y el mes deja de leerse de un vistazo.
 *
 * ESTE NÚMERO ESTÁ ESCRITO DOS VECES: aquí y en `app/motion/calendario.css`
 * (`:nth-child(n + 3)`). Si uno cambia sin el otro, el «+N» miente, y por eso
 * hay una prueba que fija los dos.
 */
export const VISIBLES_EN_MES = 2

/**
 * Las que no caben en una celda. Nunca negativo: 0 cuando cabe todo. Cuenta
 * también las canceladas, igual que `porDia` y que el recuento del día: lo que
 * se resume es lo que hay, no lo que sigue en pie.
 */
export const ocultasEnMes = (total: number) => Math.max(0, total - VISIBLES_EN_MES)

/**
 * La franja útil de unos días: el suelo 07:00–23:00, ensanchado hasta cubrir lo
 * que haya programado, o el día entero si se pide.
 */
export function horasUtiles(
  entradas: EntradaAgenda[],
  dias: Dia[],
  zona: Zona = ZONA_POR_DEFECTO,
  diaEntero = false
): Franja {
  const horas = dias.length ? Math.max(...dias.map((d) => horasDelDia(d, zona))) : 24
  if (diaEntero) return { desde: 0, hasta: horas, horas, recortada: false }

  let desde = FRANJA_MINIMA[0]
  let hasta = FRANJA_MINIMA[1]
  let recortada = false
  const enLosDias = new Set(dias)
  for (const e of entradas) {
    if (enLosDias.size && !enLosDias.has(diaDe(e.programadaPara, zona))) continue
    const h = Math.floor(minutosDelDia(e.programadaPara, zona) / 60)
    if (h < desde) {
      desde = h
      recortada = true
    }
    if (h + 1 > hasta) {
      hasta = Math.min(h + 1, horas)
      recortada = true
    }
  }
  return { desde, hasta: Math.min(Math.max(hasta, desde + 1), horas), horas, recortada }
}

export interface Ritmo {
  cuentaId: string
  dia: Dia
  /** Publicaciones vivas de esa cuenta ese día. */
  total: number
  /** Minutos con la vecina más cercana del día; `Infinity` si va sola. */
  separacionMinima: number
  demasiadas: boolean
  muyPegadas: boolean
}

/**
 * El ritmo de una cuenta en un día: lo que la vista Lista agrupa por cuenta y lo
 * que el compositor avisa antes de confirmar.
 */
export function ritmo(
  entradas: EntradaAgenda[],
  cuentaId: string,
  dia: Dia,
  zona: Zona = ZONA_POR_DEFECTO
): Ritmo {
  const delDia = entradas
    .filter(
      (e) =>
        e.cuentaId === cuentaId &&
        e.estado !== "cancelada" &&
        diaDe(e.programadaPara, zona) === dia
    )
    .sort(porHora)
  let separacionMinima = Infinity
  for (let i = 1; i < delDia.length; i += 1) {
    const d =
      (Date.parse(delDia[i].programadaPara) - Date.parse(delDia[i - 1].programadaPara)) /
      MINUTO
    if (d < separacionMinima) separacionMinima = d
  }
  return {
    cuentaId,
    dia,
    total: delDia.length,
    separacionMinima,
    demasiadas: delDia.length > MAX_POR_CUENTA_DIA,
    muyPegadas: separacionMinima < SEPARACION_MINIMA_MIN,
  }
}

/** Todo lo que se ha planificado o publicado de un clip, en orden. */
export const entradasDeClip = (entradas: EntradaAgenda[], clipId: string) =>
  entradas.filter((e) => e.clipId === clipId).sort(porHora)

/** Las hermanas de una entrada: el mismo clip mandado a varias redes de una vez. */
export const loteDe = (entradas: EntradaAgenda[], loteId: string | undefined) =>
  loteId ? entradas.filter((e) => e.loteId === loteId).sort(porHora) : []

export interface OpcionesReparto {
  zona?: Zona
  dueno?: DuenoAgenda
  campanaId?: string
  /**
   * Id base del lote, creado en el manejador con `nuevoId("lot")`. Cada clip que
   * vaya a más de una red recibe `${loteId}_${i}`; con una sola red no hay lote.
   */
  loteId?: string
  /** Cuenta elegida por red. Sin ella, la primera cuenta viva de esa red. */
  cuentaPorRed?: Partial<Record<SocialId, string>>
  /** Texto propuesto. Por defecto, el `hook` del clip. */
  texto?: (clip: ClipDeAgenda, red: SocialId) => string
  /** La copia con la que sale, resuelta por quien programa. */
  copia?: (clip: ClipDeAgenda, red: SocialId) => CopiaPublicacion | undefined
  /** Quién la lleva. Por defecto Clipealo: es lo que hace el producto. */
  proveedor?: Proveedor
}

/**
 * Reparte N clips × M redes a partir de un instante, separándolos `cada`
 * minutos dentro de la MISMA cuenta: dos redes distintas pueden ir a la vez
 * porque son dos sitios distintos; dos publicaciones seguidas en la misma
 * cuenta, no.
 *
 * Devuelve borradores sin id: los ids se crean en el manejador que guarda.
 */
export function repartir(
  clips: ClipDeAgenda[],
  redes: SocialId[],
  cuentas: SocialAccount[],
  inicio: string,
  cada: number = SEPARACION_MINIMA_MIN,
  opciones: OpcionesReparto = {}
): NuevaEntrada[] {
  // Una cuenta por red: la elegida, o la primera viva de esa red
  const destinos: DestinoPublicacion[] = redes.map((red) => ({
    red,
    cuentaId:
      opciones.cuentaPorRed?.[red] ??
      cuentas.find((c) => c.network === red && cuentaActiva(c))?.id,
  }))
  return repartirEnDestinos(clips, destinos, inicio, cada, opciones)
}

/** Dónde va una publicación: una cuenta concreta de una red. */
export interface DestinoPublicacion {
  red: SocialId
  /** Sin cuenta la entrada se puede guardar, pero `validarEntrada` la bloquea. */
  cuentaId?: string
}

/** Las cuentas elegidas, como destinos. Dos de la misma red son dos destinos. */
export const destinosDeCuentas = (
  elegidas: readonly SocialAccount[]
): DestinoPublicacion[] => elegidas.map((c) => ({ red: c.network, cuentaId: c.id }))

/**
 * Reparte N clips en M CUENTAS a partir de un instante, separándolos `cada`
 * minutos dentro de la MISMA cuenta: dos cuentas distintas pueden recibir a la
 * vez porque son dos sitios distintos; dos publicaciones seguidas en la misma
 * cuenta, no.
 *
 * Es la forma general, y la que usa el diálogo de publicar: elegir dos cuentas
 * de TikTok tiene que dar dos publicaciones, no una.
 *
 * Devuelve borradores sin id: los ids se crean en el manejador que guarda.
 */
export function repartirEnDestinos(
  clips: ClipDeAgenda[],
  destinos: DestinoPublicacion[],
  inicio: string,
  cada: number = SEPARACION_MINIMA_MIN,
  opciones: OpcionesReparto = {}
): NuevaEntrada[] {
  const zona = opciones.zona ?? ZONA_POR_DEFECTO
  const dueno = opciones.dueno ?? "clipero"
  const proveedor = opciones.proveedor ?? "clipealo"
  const base = Date.parse(inicio)
  const nuevas: NuevaEntrada[] = []
  // Cuántas lleva ya cada cuenta: es lo que separa, no el orden global
  const usos = new Map<string, number>()

  clips.forEach((clip, i) => {
    for (const { red, cuentaId } of destinos) {
      const clave = cuentaId ?? `sin-cuenta:${red}`
      const n = usos.get(clave) ?? 0
      usos.set(clave, n + 1)
      const copia = opciones.copia?.(clip, red)
      nuevas.push({
        clipId: clip.id,
        proyectoId: clip.sourceId,
        titulo: clip.title,
        red,
        cuentaId,
        programadaPara: new Date(base + n * cada * MINUTO).toISOString(),
        zonaOrigen: zona,
        texto: opciones.texto?.(clip, red) ?? clip.hook,
        copia,
        estado: "planificada",
        campanaId: opciones.campanaId,
        loteId:
          destinos.length > 1 && opciones.loteId ? `${opciones.loteId}_${i}` : undefined,
        dueno,
        proveedor,
      })
    }
  })
  return nuevas.sort(porHoraNueva)
}

/* ---------------------------------------------------------------------------
   De dónde sale la agenda de la demo
   --------------------------------------------------------------------------- */

/** La cuenta de la demo en esa red, si la hay: solo para colgar lo ya publicado. */
const cuentaDeRed = (red: SocialId, cuentas: SocialAccount[]) =>
  cuentas.find((c) => c.network === red && cuentaActiva(c))?.id

/**
 * La mitad pasada del calendario NO se inventa: es lo que Analíticas ya tiene
 * indexado. Mismo título, misma red, mismo enlace y la misma hora real de
 * publicación, con un id determinista para que recargar no duplique nada.
 */
export function entradasDePublicaciones(
  pubs: Publicacion[] = publicaciones,
  cuentas: SocialAccount[] = [],
  zona: Zona = ZONA_POR_DEFECTO
): EntradaAgenda[] {
  return pubs.map((p) => ({
    id: `age_${p.id}`,
    clipId: p.clipId,
    titulo: p.titulo,
    red: p.red,
    cuentaId: cuentaDeRed(p.red, cuentas),
    programadaPara: p.publicadoEn,
    zonaOrigen: zona,
    texto: "",
    estado: "publicada" as const,
    url: p.url,
    publicadaEn: p.publicadoEn,
    dueno: "clipero" as const,
    // Lo de antes lo subió la persona: no se le puede atribuir a Clipealo
    proveedor: "manual" as const,
    creadaEn: p.publicadoEn,
  }))
}

/**
 * Lo planificado de la demo. Literales fijos, nunca `Math.random()` ni
 * `Date.now()`: un dato que cambie entre el servidor y el navegador rompe la
 * hidratación. Las horas están escritas en UTC y comentadas en hora de Lima
 * (GMT-5 todo el año), que es la zona de la cuenta de demo.
 *
 * El «hoy» es `AHORA_AGENDA`: domingo 13 de septiembre, 07:20 en Lima.
 */
interface Semilla {
  id: string
  clipId: string
  titulo: string
  texto: string
  red: SocialId
  cuentaId: string
  programadaPara: string
  loteId?: string
  /** Sin valor, `planificada`. */
  estado?: EstadoAgenda
  fallo?: FalloPublicacion
  url?: string
}

const SEMILLAS: Semilla[] = [
  {
    id: "age_s1",
    clipId: "clip_04",
    titulo: "Nadie se va por el sueldo",
    texto: "«Nadie se va por el sueldo. Se va por el jefe, y el sueldo le da la excusa.»",
    red: "tiktok",
    cuentaId: "cta_tk_clipealo",
    // sábado 12, 19:00 en Lima: salió a su hora y la red la rechazó. Es lo
    // único que la bandeja tiene que enseñar cuando Clipealo publica bien
    programadaPara: "2026-09-13T00:00:00.000Z",
    estado: "fallida",
    fallo: "rechazoRed",
  },
  {
    id: "age_s2",
    clipId: "clip_06",
    titulo: "El coste real de una mala primera semana",
    texto: "«Una mala primera semana se paga durante seis meses.»",
    red: "youtube",
    cuentaId: "cta_yt_clipealo",
    // domingo 13, 13:00 en Lima: hoy, debajo de la línea de ahora
    programadaPara: "2026-09-13T18:00:00.000Z",
    loteId: "lot_s2",
  },
  {
    id: "age_s3",
    clipId: "clip_06",
    titulo: "El coste real de una mala primera semana",
    texto: "«Una mala primera semana se paga durante seis meses.»",
    red: "tiktok",
    cuentaId: "cta_tk_ana",
    // domingo 13, 14:00 en Lima: el mismo clip en otra red y otra cuenta
    programadaPara: "2026-09-13T19:00:00.000Z",
    loteId: "lot_s2",
  },
  {
    id: "age_s4",
    clipId: "clip_04",
    titulo: "Nadie se va por el sueldo",
    texto: "«Nadie se va por el sueldo. Se va por el jefe, y el sueldo le da la excusa.»",
    red: "youtube",
    cuentaId: "cta_yt_clipealo",
    // domingo 13, 21:00 en Lima: tercera de hoy (14 en UTC, 13 en Lima)
    programadaPara: "2026-09-14T02:00:00.000Z",
  },
  {
    id: "age_s5",
    clipId: "clip_05",
    titulo: "Onboarding en 48 horas",
    texto: "«Si en dos días no ha entregado algo a producción, el onboarding falló.»",
    red: "tiktok",
    cuentaId: "cta_tk_clipealo",
    // martes 15, 19:00 en Lima: el clip es 4:5, así que enseña «formatoNoAdmitido»
    programadaPara: "2026-09-16T00:00:00.000Z",
  },
  {
    id: "age_s6",
    clipId: "clip_04",
    titulo: "Nadie se va por el sueldo",
    texto: "«Nadie se va por el sueldo. Se va por el jefe, y el sueldo le da la excusa.»",
    red: "youtube",
    cuentaId: "cta_yt_clipealo",
    // jueves 17, 18:00 en Lima: otra semana; 54 s, al filo de los 60 de Shorts
    programadaPara: "2026-09-17T23:00:00.000Z",
  },
  {
    id: "age_s7",
    clipId: "clip_06",
    titulo: "El coste real de una mala primera semana",
    texto: "«Una mala primera semana se paga durante seis meses.»",
    red: "instagram",
    // Esta cuenta no está conectada: la tarjeta deriva «sin-cuenta»
    cuentaId: "cta_ig_ana",
    // viernes 18, 12:00 en Lima
    programadaPara: "2026-09-18T17:00:00.000Z",
  },
  {
    id: "age_s8",
    clipId: "clip_02",
    titulo: "La regla de las tres reuniones",
    texto:
      "«Si algo necesita tres reuniones, el problema no es la agenda: es la decisión.»",
    red: "tiktok",
    cuentaId: "cta_tk_ana",
    // sábado 12, 15:00 en Lima: salió sola y guardó su enlace
    programadaPara: "2026-09-12T20:00:00.000Z",
    estado: "publicada",
    url: "https://www.tiktok.com/@cortes.ana/video/7409112233445566",
  },
]

export const entradasSemilla: EntradaAgenda[] = SEMILLAS.map((s) => ({
  id: s.id,
  clipId: s.clipId,
  proyectoId: "src_01",
  titulo: s.titulo,
  red: s.red,
  cuentaId: s.cuentaId,
  programadaPara: s.programadaPara,
  zonaOrigen: ZONA_POR_DEFECTO,
  texto: s.texto,
  estado: s.estado ?? "planificada",
  url: s.url,
  publicadaEn: s.estado === "publicada" ? s.programadaPara : undefined,
  fallo: s.fallo,
  intentos: s.estado === "fallida" ? 1 : undefined,
  loteId: s.loteId,
  dueno: "clipero" as const,
  // Todo lo que se programa desde Clipealo lo publica Clipealo
  proveedor: "clipealo" as const,
  creadaEn: "2026-09-11T15:00:00.000Z",
}))

/** La agenda completa de la demo: lo ya publicado más lo planificado. */
export const agendaSemilla = (cuentas: SocialAccount[] = []): EntradaAgenda[] => [
  ...entradasDePublicaciones(publicaciones, cuentas),
  ...entradasSemilla,
]

/* ---------------------------------------------------------------------------
   Migración de lo guardado
   --------------------------------------------------------------------------- */

const esEstado = (v: unknown): v is EstadoAgenda =>
  ESTADOS_AGENDA.includes(v as EstadoAgenda)

/**
 * Limpia un registro guardado por una versión anterior: sin `zonaOrigen`, sin
 * `proveedor`, sin `dueno`, o con un estado que ya no existe. Devuelve la misma
 * referencia si no hace falta tocar nada, para no repintar de balde.
 */
export function migrarEntrada(guardada: EntradaAgenda): EntradaAgenda {
  const zonaOrigen = guardada.zonaOrigen || ZONA_POR_DEFECTO
  const dueno: DuenoAgenda = DUENOS_AGENDA.includes(guardada.dueno)
    ? guardada.dueno
    : "clipero"
  const proveedor: Proveedor = PROVEEDORES.includes(guardada.proveedor as Proveedor)
    ? (guardada.proveedor as Proveedor)
    : "manual"
  // Un estado desconocido vuelve a ser un plan. `publicando` y `fallida` YA NO
  // son desconocidos: devolverlos a «planificada» reprogramaría un envío que
  // quizá salió, y el mismo clip saldría dos veces
  const estado: EstadoAgenda = esEstado(guardada.estado) ? guardada.estado : "planificada"
  const texto = guardada.texto ?? ""
  if (
    zonaOrigen === guardada.zonaOrigen &&
    dueno === guardada.dueno &&
    proveedor === guardada.proveedor &&
    estado === guardada.estado &&
    texto === guardada.texto
  )
    return guardada
  return { ...guardada, zonaOrigen, dueno, proveedor, estado, texto }
}

/** Migra la lista entera. Devuelve la misma si ninguna entrada cambia. */
export function migrarEntradas(guardadas: EntradaAgenda[]): EntradaAgenda[] {
  const limpias = guardadas.map(migrarEntrada)
  return limpias.every((e, i) => e === guardadas[i]) ? guardadas : limpias
}

/** Los días de la semana a la que pertenece un día, para la vista Semana. */
export const semanaDe = (dia: Dia) => diasDeLaSemana(dia)
