import { IDIOMAS_AUDIENCIA, type IdiomaAudiencia } from "@/lib/ajustes"
import { COUNTRY_CODES, type CountryCode } from "@/lib/countries"
import type { CreadorId } from "@/lib/creadores"
import { LIMITES_LICENCIA, licenciaValida, type Licencia } from "@/lib/derechos"
import type { ModoParticipacion } from "@/lib/participacion"
import { seededNoise } from "@/lib/mock-data"
import { SOCIAL_IDS, type SocialId } from "@/lib/social"
import {
  ETIQUETAS_SEGURIDAD,
  SECTORES,
  SECTOR_REGULADO,
  VERTICALES,
  esId,
  idsValidos,
  type EtiquetaSeguridad,
  type Sector,
  type Vertical,
} from "@/lib/taxonomia"
import { AHORA_DEMO } from "@/lib/fechas"

/**
 * Campañas de clipping.
 *
 * Un anunciante pone un PRESUPUESTO y paga a los creadores por las vistas de sus
 * clips: tanto por cada mil vistas (CPM). Para que un solo video viral no se
 * lleve todo el presupuesto, cada video cobra como mucho un PORCENTAJE del
 * presupuesto (el tope por video). Así el dinero se reparte entre muchos clips
 * y la campaña dura: ese es el juego.
 *
 *   pago de un video = mín( vistas ÷ 1.000 × CPM ,  tope % × presupuesto ,  lo que quede )
 *
 * y nada si no llega al mínimo de vistas.
 *
 * Perfiles:
 * - USUARIO: es clipero. No crea campañas: se une a las que hay, envía clips y
 *   cobra en su wallet. Si representa a una marca, pide el perfil de agencia.
 * - AGENCIA: todo lo del usuario y, además, crea campañas; se publican al momento.
 * - ADMIN (Clipealo): crea campañas, las destaca y las modera desde /admin.
 *
 * Las campañas PRIVADAS no salen en Explorar: se entra con su código de acceso.
 */

export const PERFILES = ["usuario", "agencia", "admin"] as const
/** Etiquetas en `campaigns.profile` de los mensajes. */
export type Perfil = (typeof PERFILES)[number]

/** Los usuarios son cliperos: solo las agencias y el admin crean campañas. */
export const puedeCrearCampanas = (perfil: Perfil) => perfil !== "usuario"

export const ESTADOS_CAMPANA = ["activa", "pausada", "agotada", "finalizada"] as const
/** Etiquetas en `campaigns.status`. */
export type EstadoCampana = (typeof ESTADOS_CAMPANA)[number]

/** Las de la app de referencia, en su orden. Etiquetas en `campaigns.category`. */
export const CATEGORIAS = ["influencers", "musica", "marcas", "infoproductores"] as const
export type Categoria = (typeof CATEGORIAS)[number]

/**
 * Cómo se escribía cada categoría antes de guardar ids: con su etiqueta en
 * español. Así sigue en el `?categoria=` de Explorar (los enlaces no cambian) y
 * en las campañas creadas que guardó el localStorage de la demo.
 */
export const CATEGORIA_ANTERIOR: Record<Categoria, string> = {
  influencers: "Influencers",
  musica: "Música",
  marcas: "Marcas",
  infoproductores: "Infoproductores",
}

/** Categoría a partir de su id o de su valor anterior («Música»). */
export function categoriaDesde(valor: string): Categoria | null {
  return CATEGORIAS.find((c) => c === valor || CATEGORIA_ANTERIOR[c] === valor) ?? null
}

export interface Campana {
  id: string
  titulo: string
  /** Quién paga y firma: la marca, el artista o el creador del contenido. */
  marca: string
  /** Serie a la que pertenece, si es una tanda de episodios del mismo creador. */
  serie?: string
  descripcion: string
  categoria: Categoria
  creadaPor: { perfil: Perfil; nombre: string; userId?: string }
  estado: EstadoCampana
  /** Solo la destaca el admin: sale primero en Explorar. */
  destacada: boolean
  /** Privada: no se lista; se entra con `codigo`. */
  privada: boolean
  codigo?: string
  /** US$ que pone el anunciante. */
  presupuesto: number
  /** US$ por cada 1.000 vistas. */
  cpm: number
  /** Porcentaje del presupuesto que puede cobrar un solo video. */
  topePorVideoPct: number
  /** Vistas mínimas para cobrar. */
  minimoVistas: number
  redes: SocialId[]
  /** Material de donde se sacan los clips. */
  material: string
  requisitos: string[]
  inicio: string
  fin: string
  creadaEn: string

  /* Segmentación (onboarding, septiembre de 2026). Todo opcional: las campañas
     guardadas antes no los tienen y `migrarCampana` los limpia al leer. */

  /** Tema principal del contenido (`lib/taxonomia.ts`). */
  vertical?: Vertical
  verticalesSecundarias?: Vertical[]
  /** Sector del producto que se promociona. */
  sector?: Sector
  /** Revisión del admin y solo cliperos verificados. Sin él, lo decide el sector. */
  regulado?: boolean
  /** Sin países: global. */
  paisesObjetivo?: CountryCode[]
  /** Sin idiomas: cualquiera. */
  idiomas?: IdiomaAudiencia[]
  /** Creador del catálogo (`lib/creadores.ts`) cuyo contenido se clipea. */
  creadorId?: CreadorId
  /** Seguridad de marca: el clipero solo la ve si las tolera. */
  etiquetas?: EtiquetaSeguridad[]
  soloVerificados?: boolean
  fanPageDedicada?: boolean

  /* Participación (docs/campanas-ciclo-2026-09.md). Opcionales: las campañas
     guardadas antes no los tienen y valen los valores por defecto. */

  /** Cómo se entra: con solicitud (por defecto) o abierta a cualquiera. */
  modoParticipacion?: ModoParticipacion
  /** Días para entregar desde que la agencia acepta. Por defecto 7. */
  plazoEntregaDias?: number
  /** Cupo de cliperos dentro a la vez. Sin él, sin límite. */
  plazas?: number
  /** `false` deja de admitir gente nueva y termina con la que ya está dentro. */
  inscripcionesAbiertas?: boolean

  /**
   * Lo que la agencia concede con la campaña (`lib/derechos.ts`). Sin ella
   * vale `LICENCIA_POR_DEFECTO`: dentro de la campaña y sin lista blanca.
   */
  licencia?: Licencia
}

/** Regulada: marcada a mano o por su sector (`SECTOR_REGULADO`). */
export const esRegulada = (c: Pick<Campana, "regulado" | "sector">) =>
  c.regulado ?? (c.sector ? SECTOR_REGULADO[c.sector] : false)

/** Solo para cliperos con la edad y la identidad verificadas. */
export const pideVerificacion = (
  c: Pick<Campana, "regulado" | "sector" | "soloVerificados">
) => !!c.soloVerificados || esRegulada(c)

export const ESTADOS_ENVIO = ["en-revision", "aprobado", "rechazado"] as const
/** Etiquetas en `campaigns.submission.status`. */
export type EstadoEnvio = (typeof ESTADOS_ENVIO)[number]

export interface Envio {
  id: string
  campanaId: string
  /** Nombre visible del creador. */
  creador: string
  userId?: string
  titulo: string
  red: SocialId
  url: string
  /**
   * De qué publicación salió, cuando salió desde Clipealo. Es lo que permite
   * volver a leer las vistas: sin él solo hay una URL, y una URL ajena no la
   * lee nadie. Todos opcionales: los envíos guardados antes no los traen.
   */
  publicacionId?: string
  cuentaId?: string
  clipId?: string
  proyectoId?: string
  /**
   * Vistas medidas del clip.
   *
   * `undefined` cuando NO se han medido: o porque llegó por un enlace ajeno que
   * nadie lee, o porque se acaba de publicar y todavía no hubo primera lectura.
   * Escribir `0` ahí sería afirmar que se midió y salió cero —que es lo que
   * hacía que la tabla dijera «cobras US$ 0,00 · bajo el mínimo» a quien no
   * tenía medición ninguna—. Para calcular se usa `vistasDe`, que sin medición
   * cuenta cero sin decir que la hubo.
   */
  vistas?: number
  /** Cuándo se leyeron. Sin él, nunca se han leído. */
  vistasEn?: string
  estado: EstadoEnvio
  enviadoEn: string
  motivoRechazo?: string
}

/* ---------------------------------------------------------------------------
   Reglas del juego
   --------------------------------------------------------------------------- */

export const LIMITES = {
  presupuestoMin: 100,
  presupuestoMax: 100_000,
  cpmMin: 0.1,
  cpmMax: 20,
  topeMin: 1,
  /** Un video nunca puede llevarse más de la mitad: la campaña dejaría de repartir. */
  topeMax: 50,
  minimoVistasMax: 100_000,
} as const

export type LimitePago = "cpm" | "tope" | "presupuesto" | "minimo"

export interface Pago {
  /** Lo que valdrían las vistas sin topes. */
  bruto: number
  /** Máximo por video. */
  tope: number
  /** Lo que se cobra de verdad. */
  pago: number
  /** Qué regla decide el pago. */
  limitadoPor: LimitePago
}

export const redondear = (n: number) => Math.round(n * 100) / 100

/**
 * Identificador para lo que se crea en el cliente («cmp_…», «env_…», «ret_…»).
 * Fuera de los componentes a propósito: la hora solo se lee al crear, nunca al pintar.
 */
export const nuevoId = (prefijo: string) =>
  `${prefijo}_${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`

export const topePorVideo = (c: Pick<Campana, "presupuesto" | "topePorVideoPct">) =>
  redondear((c.presupuesto * c.topePorVideoPct) / 100)

/** Vistas con las que un video llega al tope y deja de sumar. */
export const vistasHastaTope = (
  c: Pick<Campana, "presupuesto" | "topePorVideoPct" | "cpm">
) => Math.ceil((topePorVideo(c) / c.cpm) * 1000)

/** Cuántos videos al tope caben en el presupuesto: los que, como poco, cobran. */
export const videosAlTope = (c: Pick<Campana, "topePorVideoPct">) =>
  Math.floor(100 / c.topePorVideoPct)

/** Lo que se cuenta hoy de un envío. Sin medición, cero: no se inventa nada. */
export const vistasDe = (e: Pick<Envio, "vistas">) => e.vistas ?? 0

/** `true` si todavía no hay ninguna cifra que contar. */
export const sinMedir = (e: Pick<Envio, "vistas">) => e.vistas === undefined

/**
 * `true` si HAY de dónde leer las vistas. Es distinto de `sinMedir`: un clip
 * publicado desde Clipealo es medible desde el primer segundo aunque su primera
 * lectura todavía no haya llegado, y la tabla tiene que decir «pendiente de
 * lectura» y no «no se puede medir».
 */
export const medible = (e: Pick<Envio, "publicacionId">) => e.publicacionId !== undefined

/** De dónde salió el clip: de Clipealo, o de un enlace que pegó la persona. */
export const origenEnvio = (e: Pick<Envio, "publicacionId">): "clipealo" | "enlace" =>
  medible(e) ? "clipealo" : "enlace"

/**
 * ¿Se siguen releyendo sus vistas? Mientras la campaña esté viva, sí; cuando
 * deja de aceptar clips, la última lectura es la que cuenta y el reparto deja
 * de moverse. Sin esta regla, un refresco tardío podía dejar sin presupuesto a
 * quien ya había cobrado.
 */
export const vistasCongeladas = (estado: EstadoVisto) =>
  estado === "finalizada" || estado === "vencida" || estado === "agotada"

/** Vistas que compra el presupuesto entero al CPM. */
export const vistasCompradas = (c: Pick<Campana, "presupuesto" | "cpm">) =>
  Math.floor((c.presupuesto / c.cpm) * 1000)

export function pagoPorVideo(
  c: Pick<Campana, "presupuesto" | "cpm" | "topePorVideoPct" | "minimoVistas">,
  vistas: number,
  restante: number = c.presupuesto
): Pago {
  const bruto = redondear((vistas / 1000) * c.cpm)
  const tope = topePorVideo(c)
  if (vistas < c.minimoVistas) return { bruto, tope, pago: 0, limitadoPor: "minimo" }
  const candidatos: [number, LimitePago][] = [
    [bruto, "cpm"],
    [tope, "tope"],
    [Math.max(0, redondear(restante)), "presupuesto"],
  ]
  // A igualdad manda la regla más explicable: primero el CPM, luego el tope
  const [pago, limitadoPor] = candidatos.reduce((min, x) => (x[0] < min[0] ? x : min))
  return { bruto, tope, pago, limitadoPor }
}

export interface Liquidacion {
  pagos: Map<string, Pago>
  gastado: number
  restante: number
  /** 0–100. */
  consumidoPct: number
  aprobados: number
  vistasPagadas: number
}

/**
 * Reparte el presupuesto entre los envíos aprobados, por orden de llegada: el
 * que llega cuando ya no queda presupuesto cobra lo que reste, y después nada.
 */
export function liquidar(c: Campana, envios: Envio[]): Liquidacion {
  const pagos = new Map<string, Pago>()
  let restante = c.presupuesto
  let aprobados = 0
  let vistasPagadas = 0
  for (const e of envios
    .filter((x) => x.campanaId === c.id && x.estado === "aprobado")
    .sort((a, b) => a.enviadoEn.localeCompare(b.enviadoEn))) {
    const p = pagoPorVideo(c, vistasDe(e), restante)
    pagos.set(e.id, p)
    restante = redondear(restante - p.pago)
    aprobados += 1
    if (p.pago > 0) vistasPagadas += vistasDe(e)
  }
  const gastado = redondear(c.presupuesto - restante)
  return {
    pagos,
    gastado,
    restante,
    consumidoPct: (gastado / c.presupuesto) * 100,
    aprobados,
    vistasPagadas,
  }
}

/**
 * Lo que se enseña de una campaña: los estados guardados más los dos que se
 * derivan y que antes no se veían por ningún lado
 * (docs/campanas-ciclo-2026-09.md):
 *
 * - `vencida`: pasó su fecha de fin. Hasta ahora `inicio` y `fin` no producían
 *   ningún efecto y una campaña acabada seguía en verde aceptando clips.
 * - `cerrada`: la agencia cerró las inscripciones y termina con quien ya está
 *   dentro.
 *
 * Etiquetas en `campaigns.status`.
 */
export const ESTADOS_VISTOS = [...ESTADOS_CAMPANA, "vencida", "cerrada"] as const
export type EstadoVisto = (typeof ESTADOS_VISTOS)[number]

/**
 * Estado que se enseña. Por orden: lo que la agencia decidió a mano manda; una
 * activa sin presupuesto para el mínimo está agotada; pasada su fecha de fin,
 * vencida; y con las inscripciones cerradas, cerrada.
 *
 * `ahora` se pasa siempre desde fuera (por defecto el «hoy» de la demo) para que
 * el servidor y el navegador pinten lo mismo.
 */
export function estadoVisible(
  c: Campana,
  l: Pick<Liquidacion, "restante">,
  ahora: string = HOY_CAMPANAS
): EstadoVisto {
  if (c.estado !== "activa") return c.estado
  if (l.restante < 0.01) return "agotada"
  if (Date.parse(c.fin) < Date.parse(ahora)) return "vencida"
  if (c.inscripcionesAbiertas === false) return "cerrada"
  return "activa"
}

/**
 * Admite clips de quien todavía no está dentro. Quien ya fue aceptado entrega
 * con `puedeEntregar` (lib/participacion.ts) aunque las inscripciones estén
 * cerradas: para eso se cierran, para terminar con los que hay.
 */
/**
 * ¿Admite clips?
 *
 * Con `yaDentro`, quien tiene un compromiso aceptado: cerrar las inscripciones
 * es dejar de admitir a gente nueva, no cortarle la entrega a quien ya estaba
 * —para eso se cierran—. Pausada, agotada, vencida o finalizada no admiten
 * clips de nadie, y esa es la mitad de la regla que el calendario ya aplicaba
 * y la ficha de la campaña no: ofrecía «Subir clip» para algo que el compositor
 * marcaba después como fuera de ventana.
 */
export const aceptaEnvios = (estado: EstadoVisto, { yaDentro = false } = {}) =>
  estado === "activa" || (yaDentro && estado === "cerrada")

/**
 * Los estados en los que no entra un clip ni de quien ya estaba dentro. Es la
 * otra cara de `aceptaEnvios`, escrita como guarda de tipo para que quien
 * bloquea pueda nombrar el estado sin repetir la regla.
 */
export type EstadoSinEnvios = Exclude<EstadoVisto, "activa" | "cerrada">
export const noAdmiteClips = (estado: EstadoVisto): estado is EstadoSinEnvios =>
  !aceptaEnvios(estado, { yaDentro: true })

/**
 * Vistas con las que abre la calculadora de ejemplo (resultado del onboarding):
 * `clamp(máx(mínimo × 4, 20.000), mínimo, vistasHastaTope)`.
 */
export const vistasEjemplo = (
  c: Pick<Campana, "presupuesto" | "topePorVideoPct" | "cpm" | "minimoVistas">
) =>
  Math.min(
    Math.max(c.minimoVistas * 4, 20_000),
    Math.max(vistasHastaTope(c), c.minimoVistas)
  )

/* ---------------------------------------------------------------------------
   Códigos de acceso
   --------------------------------------------------------------------------- */

/** Sin 0/O ni 1/I: se dictan por teléfono sin equivocarse. */
const ALFABETO_CODIGO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

export function generarCodigo(aleatorio: () => number = Math.random) {
  const trozo = () =>
    Array.from(
      { length: 4 },
      () => ALFABETO_CODIGO[Math.floor(aleatorio() * ALFABETO_CODIGO.length)]
    ).join("")
  return `${trozo()}-${trozo()}`
}

/** Normaliza lo que escribe la gente: mayúsculas, sin espacios y guion en su sitio. */
export function normalizarCodigo(texto: string) {
  const limpio = texto.toUpperCase().replace(/[^A-Z0-9]/g, "")
  return limpio.length === 8 ? `${limpio.slice(0, 4)}-${limpio.slice(4)}` : limpio
}

export function buscarPorCodigo(campanas: Campana[], texto: string) {
  const codigo = normalizarCodigo(texto)
  return campanas.find((c) => c.privada && c.codigo === codigo) ?? null
}

/* ---------------------------------------------------------------------------
   Explorar: búsqueda, filtros y orden
   --------------------------------------------------------------------------- */

/**
 * «para-ti» ordena por la puntuación de `recomendarCampanas`
 * (`lib/recomendacion.ts`), que se pasa a `ordenar` como `puntos`.
 */
export const ORDENES = [
  "presupuesto",
  "cpm",
  "recientes",
  "por-agotarse",
  "para-ti",
] as const
/** Etiquetas en `campaigns.sort`. */
export type Orden = (typeof ORDENES)[number]

const sinTildes = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()

export function coincideBusqueda(c: Campana, q: string) {
  const t = sinTildes(q.trim())
  if (!t) return true
  return [c.titulo, c.marca, c.serie ?? "", c.creadaPor.nombre].some((x) =>
    sinTildes(x).includes(t)
  )
}

/**
 * Ordena una copia. Con «para-ti», más `puntos` primero (id de campaña →
 * puntuación; las que no están cuentan 0) y, a igualdad, más presupuesto restante.
 */
export function ordenar<T extends { campana: Campana; liquidacion: Liquidacion }>(
  items: T[],
  orden: Orden,
  puntos?: ReadonlyMap<string, number>
) {
  const copia = [...items]
  const por = {
    presupuesto: (a: T, b: T) => b.campana.presupuesto - a.campana.presupuesto,
    cpm: (a: T, b: T) => b.campana.cpm - a.campana.cpm,
    recientes: (a: T, b: T) => b.campana.creadaEn.localeCompare(a.campana.creadaEn),
    "por-agotarse": (a: T, b: T) =>
      b.liquidacion.consumidoPct - a.liquidacion.consumidoPct,
    "para-ti": (a: T, b: T) =>
      (puntos?.get(b.campana.id) ?? 0) - (puntos?.get(a.campana.id) ?? 0) ||
      b.liquidacion.restante - a.liquidacion.restante,
  }[orden]
  return copia.sort(
    (a, b) => por(a, b) || a.campana.titulo.localeCompare(b.campana.titulo)
  )
}

/* ---------------------------------------------------------------------------
   Formulario
   --------------------------------------------------------------------------- */

export interface BorradorCampana {
  marca: string
  titulo: string
  serie: string
  descripcion: string
  categoria: Categoria
  material: string
  redes: SocialId[]
  requisitos: string
  presupuesto: number
  cpm: number
  topePorVideoPct: number
  minimoVistas: number
  inicio: string
  fin: string
  privada: boolean
  destacada: boolean
  /* Derechos: lo que se concede con la campaña. */
  licencia: Licencia
  /* Segmentación opcional: la precarga el borrador de la agencia (onboarding). */
  vertical?: Vertical
  sector?: Sector
  paisesObjetivo?: CountryCode[]
  idiomas?: IdiomaAudiencia[]
  creadorId?: CreadorId
}

/** Qué falla en un campo. El texto está en `campaigns.form.errors.<code>`. */
export type CodigoErrorBorrador =
  | "brandRequired"
  | "titleShort"
  | "descriptionShort"
  | "materialUrl"
  | "networksRequired"
  | "budgetRange"
  | "cpmRange"
  | "capRange"
  | "minViewsRange"
  | "minViewsAboveCap"
  | "startRequired"
  | "endRequired"
  | "endBeforeStart"
  | "attributionLong"
  | "conditionsLong"

export interface ErrorBorrador {
  code: CodigoErrorBorrador
  /** Límites de un rango, sin formato: el formulario los pinta en el idioma. */
  values?: { min: number; max: number }
}

export type ErroresBorrador = Partial<Record<keyof BorradorCampana, ErrorBorrador>>

export function validarBorrador(b: BorradorCampana): ErroresBorrador {
  const e: ErroresBorrador = {}
  if (b.marca.trim().length < 2) e.marca = { code: "brandRequired" }
  if (b.titulo.trim().length < 6) e.titulo = { code: "titleShort" }
  if (b.descripcion.trim().length < 20) e.descripcion = { code: "descriptionShort" }
  if (!/^https?:\/\/\S+\.\S+/.test(b.material.trim()))
    e.material = { code: "materialUrl" }
  if (b.redes.length === 0) e.redes = { code: "networksRequired" }
  if ((b.licencia.atribucion ?? "").length > LIMITES_LICENCIA.atribucionMax)
    e.licencia = {
      code: "attributionLong",
      values: { min: 0, max: LIMITES_LICENCIA.atribucionMax },
    }
  else if ((b.licencia.notas ?? "").length > LIMITES_LICENCIA.notasMax)
    e.licencia = {
      code: "conditionsLong",
      values: { min: 0, max: LIMITES_LICENCIA.notasMax },
    }
  if (!(
    b.presupuesto >= LIMITES.presupuestoMin && b.presupuesto <= LIMITES.presupuestoMax
  ))
    e.presupuesto = {
      code: "budgetRange",
      values: { min: LIMITES.presupuestoMin, max: LIMITES.presupuestoMax },
    }
  if (!(b.cpm >= LIMITES.cpmMin && b.cpm <= LIMITES.cpmMax))
    e.cpm = { code: "cpmRange", values: { min: LIMITES.cpmMin, max: LIMITES.cpmMax } }
  if (!(b.topePorVideoPct >= LIMITES.topeMin && b.topePorVideoPct <= LIMITES.topeMax))
    e.topePorVideoPct = {
      code: "capRange",
      values: { min: LIMITES.topeMin, max: LIMITES.topeMax },
    }
  if (!(b.minimoVistas >= 0 && b.minimoVistas <= LIMITES.minimoVistasMax))
    e.minimoVistas = {
      code: "minViewsRange",
      values: { min: 0, max: LIMITES.minimoVistasMax },
    }
  else if (
    !e.presupuesto &&
    !e.cpm &&
    !e.topePorVideoPct &&
    b.minimoVistas > vistasHastaTope(b)
  )
    e.minimoVistas = { code: "minViewsAboveCap" }
  if (!b.inicio) e.inicio = { code: "startRequired" }
  if (!b.fin) e.fin = { code: "endRequired" }
  else if (b.inicio && b.fin <= b.inicio) e.fin = { code: "endBeforeStart" }
  return e
}

export function borradorACampana(
  b: BorradorCampana,
  autor: { perfil: Perfil; nombre: string; userId?: string },
  ahora: Date,
  id: string,
  codigo?: string
): Campana {
  if (!puedeCrearCampanas(autor.perfil))
    throw new Error("Solo las agencias y el admin crean campañas.")
  return {
    id,
    titulo: b.titulo.trim(),
    marca: b.marca.trim(),
    serie: b.serie.trim() || undefined,
    descripcion: b.descripcion.trim(),
    categoria: b.categoria,
    creadaPor: autor,
    estado: "activa",
    // Destacar es cosa del admin
    destacada: autor.perfil === "admin" && b.destacada,
    privada: b.privada,
    codigo: b.privada ? codigo : undefined,
    presupuesto: redondear(b.presupuesto),
    cpm: redondear(b.cpm),
    topePorVideoPct: b.topePorVideoPct,
    minimoVistas: Math.round(b.minimoVistas),
    redes: b.redes,
    material: b.material.trim(),
    requisitos: b.requisitos
      .split("\n")
      .map((r) => r.replace(/^[-•*]\s*/, "").trim())
      .filter(Boolean),
    inicio: new Date(`${b.inicio}T00:00:00`).toISOString(),
    fin: new Date(`${b.fin}T23:59:00`).toISOString(),
    creadaEn: ahora.toISOString(),
    licencia: licenciaValida(b.licencia),
    ...segmentacionValida(b),
    ...(b.sector && SECTOR_REGULADO[b.sector]
      ? { regulado: true, soloVerificados: true }
      : {}),
  }
}

/* ---------------------------------------------------------------------------
   Campañas guardadas: validación y migración
   --------------------------------------------------------------------------- */

/** Solo los campos de segmentación con ids válidos; los vacíos no se escriben. */
function segmentacionValida(c: {
  vertical?: unknown
  verticalesSecundarias?: unknown
  sector?: unknown
  paisesObjetivo?: unknown
  idiomas?: unknown
  creadorId?: unknown
  etiquetas?: unknown
}): Partial<Campana> {
  const s: Partial<Campana> = {}
  if (esId(VERTICALES, c.vertical)) s.vertical = c.vertical
  const secundarias = idsValidos(VERTICALES, c.verticalesSecundarias).filter(
    (v) => v !== s.vertical
  )
  if (secundarias.length) s.verticalesSecundarias = secundarias
  if (esId(SECTORES, c.sector)) s.sector = c.sector
  const paises = idsValidos(COUNTRY_CODES, c.paisesObjetivo)
  if (paises.length) s.paisesObjetivo = paises
  const idiomas = idsValidos(IDIOMAS_AUDIENCIA, c.idiomas)
  if (idiomas.length) s.idiomas = idiomas
  if (typeof c.creadorId === "string" && /^cre_[a-z0-9_]+$/.test(c.creadorId))
    s.creadorId = c.creadorId as CreadorId
  const etiquetas = idsValidos(ETIQUETAS_SEGURIDAD, c.etiquetas)
  if (etiquetas.length) s.etiquetas = etiquetas
  return s
}

/**
 * Limpia una campaña leída del localStorage de la demo: la categoría desde su
 * etiqueta antigua («Música»), las redes y los campos de segmentación con ids
 * válidos (se quitan los desconocidos o de una taxonomía anterior) y los
 * booleanos en su sitio. Si no hay nada que cambiar devuelve la misma referencia.
 */
export function migrarCampana(c: Campana): Campana {
  const {
    vertical,
    verticalesSecundarias,
    sector,
    paisesObjetivo,
    idiomas,
    creadorId,
    etiquetas,
    regulado,
    soloVerificados,
    fanPageDedicada,
    licencia,
    ...resto
  } = c
  const banderas: Partial<Campana> = {}
  const licenciaLimpia = licenciaValida(licencia)
  if (licenciaLimpia) banderas.licencia = licenciaLimpia
  if (typeof regulado === "boolean") banderas.regulado = regulado
  if (typeof soloVerificados === "boolean") banderas.soloVerificados = soloVerificados
  if (typeof fanPageDedicada === "boolean") banderas.fanPageDedicada = fanPageDedicada
  const migrada: Campana = {
    ...resto,
    categoria: categoriaDesde(c.categoria) ?? CATEGORIAS[0],
    redes: idsValidos(SOCIAL_IDS, c.redes),
    ...segmentacionValida({
      vertical,
      verticalesSecundarias,
      sector,
      paisesObjetivo,
      idiomas,
      creadorId,
      etiquetas,
    }),
    ...banderas,
  }
  return mismosDatos(migrada, c) ? c : migrada
}

/** Igualdad de datos planos, sin importar el orden de las claves. */
function mismosDatos(a: object, b: object): boolean {
  const ordenado = (x: object) =>
    JSON.stringify(x, (_, v) =>
      v && typeof v === "object" && !Array.isArray(v)
        ? Object.fromEntries(Object.entries(v).sort(([k1], [k2]) => k1.localeCompare(k2)))
        : v
    )
  return ordenado(a) === ordenado(b)
}

/** `migrarCampana` sobre una lista; devuelve la misma lista si ninguna cambia. */
export function migrarCampanas(lista: Campana[]): Campana[] {
  const migradas = lista.map(migrarCampana)
  return migradas.every((c, i) => c === lista[i]) ? lista : migradas
}

/* ---------------------------------------------------------------------------
   Datos de demo
   --------------------------------------------------------------------------- */

/** El «hoy» del producto. Uno solo, en `lib/fechas.ts`. */
export const HOY_CAMPANAS = AHORA_DEMO

/** La cuenta con la que se navega la app. */
export const CUENTA_DEMO = { userId: "u_ana", nombre: "Ana Ruiz" }

type Semilla = Omit<Campana, "destacada" | "privada" | "serie" | "codigo"> &
  Partial<Pick<Campana, "destacada" | "privada" | "serie" | "codigo">>

const semillas: Semilla[] = [
  {
    id: "cmp_liga",
    titulo: "Liga de las Estrellas: temporada de otoño",
    marca: "Liga de las Estrellas",
    descripcion:
      "Las mejores jugadas, goles y reacciones de la temporada. Clips verticales de un solo momento, con el marcador visible.",
    categoria: "marcas",
    creadaPor: { perfil: "admin", nombre: "Clipealo" },
    estado: "activa",
    destacada: true,
    presupuesto: 3600,
    cpm: 0.72,
    topePorVideoPct: 4,
    minimoVistas: 5000,
    redes: ["youtube", "tiktok", "instagram"],
    material: "https://youtube.com/@ligadelasestrellas",
    requisitos: [
      "Un momento por clip, de 15 a 45 segundos",
      "El marcador tiene que verse",
      "Etiqueta a @ligaestrellas",
    ],
    inicio: "2026-09-01T00:00:00.000Z",
    fin: "2026-11-30T23:59:00.000Z",
    creadaEn: "2026-08-30T15:00:00.000Z",
    vertical: "deportes",
    sector: "deportes",
    creadorId: "cre_liga_estrellas",
    licencia: {
      alcance: "campana",
      listaBlanca: true,
      atribucion: "@ligaestrellas",
      notas: "Sin música ajena encima; el marcador tiene que verse.",
    },
  },
  {
    id: "cmp_bingo",
    titulo: "Serie Bingo Monstruos",
    marca: "Diosesmonstruo",
    serie: "Bingo Monstruos",
    descripcion:
      "Cada episodio del bingo tiene tres o cuatro momentos que funcionan solos. Queremos esos momentos, con la carta a la vista.",
    categoria: "influencers",
    creadaPor: { perfil: "agencia", nombre: "Agencia Nébula", userId: "u_nebula" },
    estado: "activa",
    destacada: true,
    presupuesto: 1600,
    cpm: 0.4,
    topePorVideoPct: 5,
    minimoVistas: 3000,
    redes: ["youtube", "tiktok", "instagram"],
    material: "https://youtube.com/playlist?list=bingo-monstruos",
    requisitos: ["Un episodio por clip", "Pon «Bingo Monstruos» en el título"],
    inicio: "2026-08-20T00:00:00.000Z",
    fin: "2026-10-20T23:59:00.000Z",
    creadaEn: "2026-08-19T10:00:00.000Z",
    vertical: "directos-irl",
    verticalesSecundarias: ["humor"],
    sector: "entretenimiento-creadores",
    creadorId: "cre_diosesmonstruo",
  },
  {
    id: "cmp_casi",
    titulo: "Casi Casi: el estribillo en todas partes",
    marca: "Joaquín Mar",
    descripcion:
      "Usa el estribillo de «Casi Casi» en tus clips: reacciones, bailes o momentos que encajen con la letra.",
    categoria: "musica",
    creadaPor: { perfil: "admin", nombre: "Clipealo" },
    estado: "activa",
    destacada: true,
    presupuesto: 800,
    cpm: 0.36,
    topePorVideoPct: 3,
    minimoVistas: 1000,
    redes: ["tiktok"],
    material: "https://open.spotify.com/track/casi-casi",
    requisitos: ["El audio oficial desde el segundo 0", "Nada de versiones aceleradas"],
    inicio: "2026-08-01T00:00:00.000Z",
    fin: "2026-09-30T23:59:00.000Z",
    creadaEn: "2026-07-30T18:00:00.000Z",
    vertical: "musica",
    sector: "musica",
    creadorId: "cre_joaquin_mar",
  },
  {
    id: "cmp_fer",
    titulo: "Fernanda Millares: solo Instagram",
    marca: "Fernanda Millares",
    descripcion:
      "Clips de los directos de Fernanda sobre negocio online. Consejo concreto, sin rodeos, con subtítulos.",
    categoria: "infoproductores",
    creadaPor: { perfil: "agencia", nombre: "Agencia Nébula", userId: "u_nebula" },
    estado: "activa",
    presupuesto: 1200,
    cpm: 0.64,
    topePorVideoPct: 8,
    minimoVistas: 2000,
    redes: ["instagram"],
    material: "https://instagram.com/fernandamillares",
    requisitos: ["Solo Reels de Instagram", "Subtítulos quemados"],
    inicio: "2026-09-02T00:00:00.000Z",
    fin: "2026-10-02T23:59:00.000Z",
    creadaEn: "2026-09-01T12:00:00.000Z",
    vertical: "negocios",
    sector: "educacion-infoproductos",
    creadorId: "cre_fernanda_millares",
  },
  {
    id: "cmp_alex",
    titulo: "Álex Prado y el método Enfoque",
    marca: "Álex Prado",
    descripcion:
      "Fragmentos del curso gratuito de productividad: un hábito, una explicación, un antes y después.",
    categoria: "infoproductores",
    creadaPor: { perfil: "admin", nombre: "Clipealo" },
    estado: "activa",
    presupuesto: 900,
    cpm: 1.1,
    topePorVideoPct: 10,
    minimoVistas: 2000,
    redes: ["youtube", "tiktok", "instagram"],
    material: "https://youtube.com/@alexprado",
    requisitos: ["Menciona el curso gratuito en la descripción"],
    inicio: "2026-09-05T00:00:00.000Z",
    fin: "2026-10-15T23:59:00.000Z",
    creadaEn: "2026-09-04T09:00:00.000Z",
    vertical: "educacion",
    sector: "educacion-infoproductos",
    creadorId: "cre_alex_prado",
    // De volumen: aquí no se elige a nadie, se publica y se revisa el clip
    modoParticipacion: "abierta",
  },
  {
    id: "cmp_anmi",
    titulo: "Ámbar: Tra Tra Tra",
    marca: "Ámbar",
    descripcion:
      "El baile de «Tra Tra Tra» en tu versión. Cuanto más original, más lejos llega.",
    categoria: "musica",
    // La única de la cuenta demo: con ella se ve la cara de la agencia
    // (solicitudes, plazas y cierre) al cambiar de perfil desde el menú
    creadaPor: {
      perfil: "agencia",
      nombre: CUENTA_DEMO.nombre,
      userId: CUENTA_DEMO.userId,
    },
    plazas: 4,
    estado: "activa",
    presupuesto: 500,
    cpm: 0.5,
    topePorVideoPct: 5,
    minimoVistas: 1000,
    redes: ["tiktok"],
    material: "https://open.spotify.com/track/tra-tra-tra",
    requisitos: ["Audio oficial", "Hashtag #TraTraTra"],
    inicio: "2026-09-08T00:00:00.000Z",
    fin: "2026-10-08T23:59:00.000Z",
    creadaEn: "2026-09-07T20:00:00.000Z",
    vertical: "musica",
    sector: "musica",
    creadorId: "cre_ambar",
  },
  {
    id: "cmp_vip",
    titulo: "Lanzamiento privado de Lumen",
    marca: "Lumen App",
    descripcion:
      "Solo para los creadores invitados por la agencia: clips del evento de lanzamiento antes de que se haga público.",
    categoria: "marcas",
    creadaPor: { perfil: "agencia", nombre: "Agencia Nébula", userId: "u_nebula" },
    estado: "activa",
    privada: true,
    codigo: "LUMN-2026",
    presupuesto: 2500,
    cpm: 2.5,
    topePorVideoPct: 10,
    minimoVistas: 5000,
    redes: ["tiktok", "instagram", "linkedin"],
    material: "https://drive.google.com/drive/folders/lumen-privado",
    requisitos: [
      "No publicar antes del 15 de septiembre",
      "El logo de Lumen en los primeros 3 segundos",
    ],
    inicio: "2026-09-10T00:00:00.000Z",
    fin: "2026-10-10T23:59:00.000Z",
    creadaEn: "2026-09-09T11:00:00.000Z",
    vertical: "tecnologia",
    sector: "apps-software-ia",
  },
  {
    id: "cmp_fit",
    titulo: "Rutina de 10 minutos con Ruta Fit",
    marca: "Ruta Fit",
    descripcion:
      "Clips de los entrenamientos cortos del canal: un ejercicio, una explicación, un resultado.",
    categoria: "influencers",
    creadaPor: { perfil: "admin", nombre: "Clipealo" },
    estado: "finalizada",
    presupuesto: 700,
    cpm: 2,
    topePorVideoPct: 25,
    minimoVistas: 3000,
    redes: ["instagram", "tiktok"],
    material: "https://youtube.com/@rutafit",
    requisitos: ["Muestra el ejercicio completo al menos una vez"],
    inicio: "2026-07-01T00:00:00.000Z",
    fin: "2026-08-31T23:59:00.000Z",
    creadaEn: "2026-06-29T12:00:00.000Z",
    vertical: "salud-fitness",
    sector: "entretenimiento-creadores",
    creadorId: "cre_ruta_fit",
    // Abierta: es donde la cuenta demo ya tiene clips aprobados de antes
    modoParticipacion: "abierta",
  },
  // Tres semillas nuevas, no destacadas y fuera de Música (decisión 6 del director)
  {
    id: "cmp_arena",
    titulo: "Arena Nova · temporada de clips",
    marca: "Arena Nova",
    descripcion:
      "Las mejores jugadas y reacciones de los torneos de Arena Nova en Kick. Un momento por clip, con el marcador o la partida a la vista.",
    categoria: "marcas",
    creadaPor: { perfil: "admin", nombre: "Clipealo" },
    estado: "activa",
    presupuesto: 2000,
    cpm: 0.9,
    topePorVideoPct: 5,
    minimoVistas: 3000,
    redes: ["tiktok", "youtube"],
    material: "https://kick.com/arenanova",
    requisitos: [
      "Una jugada o reacción por clip, de 20 a 60 segundos",
      "Pon «Arena Nova» en el título",
      "Nada de apuestas ni códigos de casino en pantalla",
    ],
    inicio: "2026-09-08T00:00:00.000Z",
    fin: "2026-11-08T23:59:00.000Z",
    creadaEn: "2026-09-07T16:00:00.000Z",
    vertical: "gaming",
    verticalesSecundarias: ["directos-irl"],
    sector: "gaming-esports",
    creadorId: "cre_arena_nova",
  },
  {
    id: "cmp_rodrigo",
    titulo: "Rodrigo Salas · lo mejor de la semana",
    marca: "Rodrigo Salas",
    descripcion:
      "Los sketches de la semana de Rodrigo en formato corto. Que el remate llegue entero: sin cortar el final.",
    categoria: "influencers",
    creadaPor: { perfil: "admin", nombre: "Clipealo" },
    estado: "activa",
    presupuesto: 1000,
    cpm: 0.5,
    topePorVideoPct: 5,
    minimoVistas: 2000,
    redes: ["tiktok", "instagram", "youtube"],
    material: "https://www.tiktok.com/@rodrigosalas",
    requisitos: [
      "Un sketch por clip, con el remate completo",
      "Etiqueta a @rodrigosalas",
    ],
    inicio: "2026-09-06T00:00:00.000Z",
    fin: "2026-10-31T23:59:00.000Z",
    creadaEn: "2026-09-05T14:00:00.000Z",
    vertical: "humor",
    // Paga el propio creador para crecer
    sector: "entretenimiento-creadores",
    creadorId: "cre_rodrigo_salas",
  },
  {
    id: "cmp_dani",
    titulo: "Dani Brasa · recetas en 60 s",
    marca: "Dani Brasa",
    descripcion:
      "Recetas de Dani de principio a fin en menos de un minuto: ingredientes, fuego y el primer bocado.",
    categoria: "influencers",
    creadaPor: { perfil: "admin", nombre: "Clipealo" },
    estado: "activa",
    presupuesto: 600,
    cpm: 0.8,
    topePorVideoPct: 8,
    minimoVistas: 1500,
    redes: ["tiktok", "instagram", "youtube"],
    material: "https://youtube.com/@danibrasa",
    requisitos: [
      "Una receta por clip, en menos de 60 segundos",
      "Los ingredientes tienen que verse en pantalla",
    ],
    inicio: "2026-09-10T00:00:00.000Z",
    fin: "2026-10-25T23:59:00.000Z",
    creadaEn: "2026-09-09T19:00:00.000Z",
    vertical: "comida",
    // Corrección de la §10: si paga el propio creador para crecer, su sector es este
    sector: "entretenimiento-creadores",
    creadorId: "cre_dani_brasa",
  },
]

export const campanasSemilla: Campana[] = semillas.map((s) => ({
  destacada: false,
  privada: false,
  ...s,
}))

const CREADORES = [
  "Valeria Q.",
  "Mateo F.",
  "Camila H.",
  "Joaquín T.",
  "Renata V.",
  "Piero C.",
  "Ximena S.",
  "Bruno R.",
  "Lucía P.",
  "Gonzalo M.",
]

/**
 * Envíos de otros creadores, deterministas. Vistas en cola larga: la mayoría
 * modestos y alguno viral, que es justo el caso que el tope está para contener.
 */
function enviosDe(id: string, n: number, semilla: number, escala: number): Envio[] {
  const c = campanasSemilla.find((x) => x.id === id)!
  const rnd = seededNoise(semilla)
  const inicio = new Date(c.inicio).getTime()
  const fin = Math.min(new Date(c.fin).getTime(), new Date(HOY_CAMPANAS).getTime())
  return Array.from({ length: n }, (_, i) => {
    const r = rnd()
    const vistas = Math.round((r < 0.1 ? 8 + rnd() * 25 : 0.15 + rnd() * 2.2) * escala)
    return {
      id: `env_${id.slice(4)}_${String(i + 1).padStart(3, "0")}`,
      campanaId: id,
      creador: CREADORES[Math.floor(rnd() * CREADORES.length)],
      titulo: `Clip ${i + 1} · ${c.marca}`,
      red: c.redes[Math.floor(rnd() * c.redes.length)],
      url: `https://clipealo.app/c/${id}/${i + 1}`,
      vistas,
      estado: rnd() < 0.07 ? "rechazado" : "aprobado",
      enviadoEn: new Date(inicio + ((fin - inicio) * (i + 0.5)) / n).toISOString(),
    }
  })
}

/** Los envíos de la cuenta demo: los que ve en «Participando». */
const enviosCuenta: Envio[] = [
  {
    id: "env_ana_00a",
    campanaId: "cmp_fit",
    creador: CUENTA_DEMO.nombre,
    userId: CUENTA_DEMO.userId,
    titulo: "Plancha de 60 segundos sin trampas",
    red: "instagram",
    url: "https://www.instagram.com/reel/7290",
    vistas: 61_300,
    estado: "aprobado",
    enviadoEn: "2026-07-09T18:00:00.000Z",
  },
  {
    id: "env_ana_00b",
    campanaId: "cmp_fit",
    creador: CUENTA_DEMO.nombre,
    userId: CUENTA_DEMO.userId,
    titulo: "El error que arruina tus sentadillas",
    red: "tiktok",
    url: "https://www.tiktok.com/@clipealo/video/7291",
    vistas: 24_800,
    estado: "aprobado",
    enviadoEn: "2026-08-03T18:00:00.000Z",
  },
  {
    id: "env_ana_00c",
    campanaId: "cmp_casi",
    creador: CUENTA_DEMO.nombre,
    userId: CUENTA_DEMO.userId,
    titulo: "Reacción de mi abuela a «Casi Casi»",
    red: "tiktok",
    url: "https://www.tiktok.com/@clipealo/video/7295",
    vistas: 91_200,
    estado: "aprobado",
    enviadoEn: "2026-08-12T20:00:00.000Z",
  },
  {
    id: "env_ana_00d",
    campanaId: "cmp_alex",
    creador: CUENTA_DEMO.nombre,
    userId: CUENTA_DEMO.userId,
    titulo: "El hábito de los dos minutos",
    red: "youtube",
    url: "https://youtube.com/shorts/7298",
    vistas: 54_700,
    estado: "aprobado",
    enviadoEn: "2026-09-07T15:00:00.000Z",
  },
  {
    id: "env_ana_01",
    campanaId: "cmp_bingo",
    creador: CUENTA_DEMO.nombre,
    userId: CUENTA_DEMO.userId,
    titulo: "El cartón que nadie esperaba",
    red: "tiktok",
    url: "https://www.tiktok.com/@clipealo/video/7301",
    // Salió desde Clipealo: sus vistas se releen y la fila enlaza a su clip
    publicacionId: "pub_01_tiktok",
    cuentaId: "cta_tk_clipealo",
    clipId: "clip_01",
    proyectoId: "src_01",
    vistas: 412_400,
    vistasEn: "2026-09-13T12:20:00.000Z",
    estado: "aprobado",
    // Dentro del plazo de su compromiso (par_dem_02): antes contaba una entrega
    // siete días anterior a la aceptación
    enviadoEn: "2026-09-08T17:00:00.000Z",
  },
  {
    id: "env_ana_02",
    campanaId: "cmp_liga",
    creador: CUENTA_DEMO.nombre,
    userId: CUENTA_DEMO.userId,
    titulo: "El gol de chilena del minuto 89",
    red: "instagram",
    url: "https://www.instagram.com/reel/7302",
    publicacionId: "pub_02_instagram",
    cuentaId: "cta_ig_nebula",
    clipId: "clip_02",
    proyectoId: "src_01",
    vistas: 38_900,
    vistasEn: "2026-09-13T12:20:00.000Z",
    estado: "aprobado",
    enviadoEn: "2026-09-04T16:00:00.000Z",
  },
  {
    id: "env_ana_03",
    campanaId: "cmp_fer",
    creador: CUENTA_DEMO.nombre,
    userId: CUENTA_DEMO.userId,
    titulo: "Por qué tu primer producto tiene que ser feo",
    red: "instagram",
    url: "https://www.instagram.com/reel/7303",
    vistas: 8_400,
    estado: "en-revision",
    enviadoEn: "2026-09-12T21:00:00.000Z",
  },
  {
    // Recién publicado desde Clipealo: medible, pero sin primera lectura. Es el
    // tercer caso de la columna de vistas, y sin él la demo no lo enseña
    id: "env_ana_04",
    campanaId: "cmp_liga",
    creador: CUENTA_DEMO.nombre,
    userId: CUENTA_DEMO.userId,
    titulo: "La regla de las tres reuniones",
    red: "tiktok",
    url: "https://www.tiktok.com/@cortes.ana/video/7409112233445566",
    publicacionId: "age_s8",
    cuentaId: "cta_tk_ana",
    clipId: "clip_02",
    proyectoId: "src_01",
    estado: "en-revision",
    enviadoEn: "2026-09-13T01:00:00.000Z",
  },
]

/**
 * El clip que Nora entregó en «Ámbar» y nadie ha revisado: es lo que impide
 * cerrar esa campaña mientras la agencia no decida (participación `par_dem_06`).
 */
const envioEntregado: Envio = {
  id: "env_nora_01",
  campanaId: "cmp_anmi",
  creador: "Nora Vidal",
  userId: "u_nora",
  titulo: "El paso del Tra Tra Tra, pero en cámara lenta",
  red: "tiktok",
  url: "https://www.tiktok.com/@noravidal/video/7311",
  vistas: 22_600,
  estado: "en-revision",
  enviadoEn: "2026-09-12T13:00:00.000Z",
}

export const enviosSemilla: Envio[] = [
  ...enviosDe("cmp_liga", 40, 11, 7_000),
  ...enviosDe("cmp_bingo", 70, 12, 6_000),
  ...enviosDe("cmp_casi", 160, 13, 9_000),
  ...enviosDe("cmp_fer", 18, 14, 12_000),
  ...enviosDe("cmp_alex", 14, 15, 20_000),
  ...enviosDe("cmp_anmi", 9, 16, 15_000),
  ...enviosDe("cmp_vip", 6, 17, 30_000),
  ...enviosDe("cmp_fit", 16, 18, 25_000),
  ...enviosDe("cmp_arena", 12, 19, 9_000),
  ...enviosDe("cmp_rodrigo", 20, 20, 8_000),
  ...enviosDe("cmp_dani", 6, 21, 6_000),
  ...enviosCuenta,
  envioEntregado,
]
