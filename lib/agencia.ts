import {
  IDIOMAS_AUDIENCIA,
  type IdiomaAudiencia,
  type PlataformaDirecto,
} from "@/lib/ajustes"
import {
  LIMITES,
  type BorradorCampana,
  type Campana,
  type Categoria,
} from "@/lib/campanas"
import { COUNTRY_CODES, type CountryCode } from "@/lib/countries"
import {
  SIMULADOR_AGENCIA,
  simularBorrador,
  validarToma,
  type Cuenta,
  type PasoAgencia,
  type RespuestasAgencia,
  type RespuestasToma,
  type SolicitudAgenciaDatos,
} from "@/lib/onboarding"
import { SOCIAL_IDS, type SocialId } from "@/lib/social"
import {
  CPM_REFERENCIA,
  SECTORES,
  SECTOR_VERTICALES,
  TIPO_A_CATEGORIA,
  VERTICALES,
  esId,
  idsValidos,
  type Sector,
  type Vertical,
} from "@/lib/taxonomia"

/**
 * Rama agencia del onboarding (§2.8, §3.4, §6.3): reglas puras de la solicitud
 * del perfil de agencia, del borrador de campaña que deja el simulador y del
 * estado que enseña `AgencyGate`.
 *
 * Nada de aquí lee la hora ni el navegador: las fechas llegan de los
 * manejadores. Las cifras de pago salen siempre de `lib/campanas.ts` (a través
 * de `simularBorrador`).
 */

/** Las cuatro tomas de la agencia, sin el render. */
export const TOMAS_AGENCIA = [
  "tipo-org",
  "org",
  "promocion",
  "alcance",
] as const satisfies readonly PasoAgencia[]
export type TomaAgencia = (typeof TOMAS_AGENCIA)[number]

/** Promesa a las agencias (decisión 4): «menos de 2 días hábiles». */
export const PLAZO_REVISION_DIAS_HABILES = 2

/* ---------------------------------------------------------------------------
   Progreso de la solicitud
   --------------------------------------------------------------------------- */

/** Tomas de la agencia que aún no se pueden dar por buenas, en orden. */
export function tomasPendientesAgencia(r: RespuestasToma): TomaAgencia[] {
  return TOMAS_AGENCIA.filter((p) => validarToma(p, r).some((e) => e.bloquea))
}

/** Dónde retomar la solicitud: la primera toma pendiente o, si no queda ninguna, el render. */
export function pasoRetomarAgencia(r: RespuestasToma): TomaAgencia | "render-agencia" {
  return tomasPendientesAgencia(r)[0] ?? "render-agencia"
}

/** Ha empezado la solicitud: abrió el flujo de agencia o respondió algo de él. */
export const agenciaEmpezada = (c: Pick<Cuenta, "agencia" | "onboarding">) =>
  c.onboarding.flujo === "agencia" ||
  Object.entries(c.agencia).some(
    ([campo, valor]) => campo !== "solicitudEnviadaEn" && valor !== undefined
  )

export type EstadoSolicitudAgencia = "ninguna" | "pendiente" | "aprobada" | "rechazada"

/**
 * Qué enseña `AgencyGate` a un usuario sin perfil de agencia:
 * - `solicitar`: aún no ha empezado; lleva a la bienvenida de agencia.
 * - `terminar`: empezó y no la envió («Termina tu solicitud ({n} tomas)»).
 * - `revision`: enviada, con el borrador en solo lectura.
 * - `rechazada`: con su motivo y la opción de revisarla y reenviarla.
 */
export type EstadoGate = "solicitar" | "terminar" | "revision" | "rechazada"

export function estadoGate(
  solicitud: EstadoSolicitudAgencia,
  cuenta: Pick<Cuenta, "agencia" | "onboarding">
): EstadoGate {
  if (solicitud === "pendiente") return "revision"
  if (solicitud === "rechazada") return "rechazada"
  return agenciaEmpezada(cuenta) ? "terminar" : "solicitar"
}

/**
 * Lo que enseña el render de agencia según la solicitud: el simulador con
 * «Enviar solicitud» (`borrador`, también tras un rechazo), la revisión con el
 * borrador en solo lectura o la aprobación.
 */
export function vistaRenderAgencia(
  solicitud: EstadoSolicitudAgencia
): "borrador" | "enviada" | "rechazada" | "aprobada" {
  if (solicitud === "pendiente") return "enviada"
  if (solicitud === "aprobada") return "aprobada"
  if (solicitud === "rechazada") return "rechazada"
  return "borrador"
}

/**
 * Fecha límite de la decisión: `dias` hábiles (lunes a viernes, en UTC) después
 * del envío. «Menos de 2 días hábiles» → antes de que acabe el segundo.
 */
export function decisionAntesDe(
  enviadaEn: string,
  dias: number = PLAZO_REVISION_DIAS_HABILES
): string {
  const fecha = new Date(enviadaEn)
  if (Number.isNaN(fecha.getTime())) return enviadaEn
  let quedan = dias
  while (quedan > 0) {
    fecha.setUTCDate(fecha.getUTCDate() + 1)
    const dia = fecha.getUTCDay()
    if (dia !== 0 && dia !== 6) quedan -= 1
  }
  return fecha.toISOString()
}

/* ---------------------------------------------------------------------------
   Simulador del render (§6.3)
   --------------------------------------------------------------------------- */

/** Paradas del deslizador de presupuesto (US$): pasos cómodos de 100 a 50.000. */
export const PRESUPUESTOS_SIMULADOR = [
  100, 200, 300, 500, 750, 1000, 1500, 2000, 3000, 5000, 7500, 10_000, 15_000, 20_000,
  30_000, 50_000,
] as const

/** Parada más cercana a un presupuesto (para el deslizador). */
export function indicePresupuesto(usd: number): number {
  let mejor = 0
  PRESUPUESTOS_SIMULADOR.forEach((p, i) => {
    if (Math.abs(p - usd) < Math.abs(PRESUPUESTOS_SIMULADOR[mejor] - usd)) mejor = i
  })
  return mejor
}

/** Mínimos de vistas que ofrece el simulador. El del borrador es 1.000 (§6.3). */
export const MINIMOS_SIMULADOR = [0, 500, 1000, 2000, 5000, 10_000] as const

/** Sin CPM de referencia (política y causas): el rango habitual del formulario. */
export const RANGO_CPM_SIN_REFERENCIA = { min: 0.3, max: 3 } as const

/** Rango del deslizador de CPM: el de referencia del sector, dentro de los límites. */
export function rangoCpmSimulador(sector: Sector | null | undefined): {
  min: number
  max: number
  referencia: boolean
} {
  const r = (sector && CPM_REFERENCIA[sector]) || null
  const base = r ?? RANGO_CPM_SIN_REFERENCIA
  return {
    min: Math.max(base.min, LIMITES.cpmMin),
    max: Math.min(base.max, LIMITES.cpmMax),
    referencia: !!r,
  }
}

export interface AjustesSimulador {
  presupuesto: number
  cpm?: number
  minimoVistas?: number
}

/**
 * El simulador con lo que se ha tocado: el CPM se queda dentro del rango del
 * sector (si se cambió el sector después, se recoloca) y el mínimo de vistas,
 * por debajo de las vistas con las que un video ya llega al tope.
 */
export function simulacionAgencia(
  sector: Sector | null | undefined,
  ajustes: AjustesSimulador
) {
  const rango = rangoCpmSimulador(sector)
  const base = simularBorrador(sector, ajustes.presupuesto)
  const cpm = Math.min(Math.max(ajustes.cpm ?? base.cpm, rango.min), rango.max)
  const conCpm = simularBorrador(sector, ajustes.presupuesto, { cpm })
  const minimosPermitidos = MINIMOS_SIMULADOR.filter((m) => m <= conCpm.vistasHastaTope)
  const pedido = ajustes.minimoVistas ?? SIMULADOR_AGENCIA.minimoVistas
  const minimoVistas = minimosPermitidos.includes(
    pedido as (typeof MINIMOS_SIMULADOR)[number]
  )
    ? pedido
    : Math.max(0, ...minimosPermitidos.filter((m) => m <= pedido))
  return {
    ...simularBorrador(sector, ajustes.presupuesto, { cpm, minimoVistas }),
    rango,
    minimosPermitidos,
  }
}

/* ---------------------------------------------------------------------------
   Borrador de campaña y datos de la solicitud
   --------------------------------------------------------------------------- */

const URL_CANAL: Record<PlataformaDirecto, (handle: string) => string> = {
  twitch: (h) => `https://twitch.tv/${h}`,
  kick: (h) => `https://kick.com/${h}`,
  youtube: (h) => `https://youtube.com/@${h}`,
  tiktok: (h) => `https://tiktok.com/@${h}`,
  facebook: (h) => `https://facebook.com/${h}`,
}

/** Dirección canónica de un canal (`agencia.canal`). */
export const urlCanal = (canal: { plataforma: PlataformaDirecto; handle: string }) =>
  URL_CANAL[canal.plataforma](canal.handle)

/**
 * Borrador de la primera campaña con lo respondido y lo simulado: marca,
 * categoría derivada del tipo de organización, redes, reglas de pago y la
 * segmentación. En la variante streamer, el canal es el material. Lo que no se
 * sabe (nombre, brief, fechas) lo completa al crear la campaña.
 */
export function borradorDeSolicitud(
  a: Partial<RespuestasAgencia>,
  sim: Pick<
    ReturnType<typeof simularBorrador>,
    "presupuesto" | "cpm" | "topePorVideoPct" | "minimoVistas"
  >
): Partial<BorradorCampana> {
  const b: Partial<BorradorCampana> = {
    presupuesto: sim.presupuesto,
    cpm: sim.cpm,
    topePorVideoPct: sim.topePorVideoPct,
    minimoVistas: sim.minimoVistas,
  }
  if (a.organizacion?.trim()) b.marca = a.organizacion.trim()
  if (a.tipoOrganizacion) b.categoria = TIPO_A_CATEGORIA[a.tipoOrganizacion]
  if (a.redesObjetivo?.length) b.redes = [...a.redesObjetivo]
  if (a.canal) b.material = urlCanal(a.canal)
  if (a.verticalesMaterial?.length) b.vertical = a.verticalesMaterial[0]
  if (a.sector) b.sector = a.sector
  if (a.paisesObjetivo?.length) b.paisesObjetivo = [...a.paisesObjetivo]
  if (a.idiomasObjetivo?.length) b.idiomas = [...a.idiomasObjetivo]
  if (a.creadorId) b.creadorId = a.creadorId
  return b
}

/**
 * Lo que viaja a la cola del admin (`useCampanas().solicitarAgencia`). `null`
 * si falta algo obligatorio de las cuatro tomas.
 */
export function datosSolicitudDe(
  c: Pick<Cuenta, "nombre" | "correo" | "agencia">,
  presupuesto: number,
  enviadaEn: string
): SolicitudAgenciaDatos | null {
  const a = c.agencia
  if (
    !a.tipoOrganizacion ||
    !a.organizacion?.trim() ||
    !a.web?.trim() ||
    !a.pais ||
    !a.sector ||
    !a.verticalesMaterial?.length ||
    !a.redesObjetivo?.length ||
    !a.paisesObjetivo?.length ||
    !a.idiomasObjetivo?.length
  )
    return null
  const datos: SolicitudAgenciaDatos = {
    tipoOrganizacion: a.tipoOrganizacion,
    organizacion: a.organizacion.trim(),
    web: a.web.trim(),
    dominioCoincide: a.dominioCoincide ?? false,
    // Opcional en la toma, así que no bloquea; cuando está, viaja
    rol: a.rol,
    pais: a.pais,
    sector: a.sector,
    verticalesMaterial: [...a.verticalesMaterial],
    redesObjetivo: [...a.redesObjetivo],
    paisesObjetivo: [...a.paisesObjetivo],
    idiomasObjetivo: [...a.idiomasObjetivo],
    nombre: c.nombre,
    correo: c.correo,
    tramoPresupuesto: simularBorrador(a.sector, presupuesto).tramo,
    enviadaEn,
  }
  if (a.creadorId) datos.creadorId = a.creadorId
  return datos
}

/**
 * Campaña de muestra para pintar el borrador con `CampaignCard` (vista previa
 * y solo lectura). No se guarda: `id` fijo y fechas vacías.
 */
export function campanaDeBorrador(
  b: Partial<BorradorCampana>,
  textos: { titulo: string; marca: string }
): Campana {
  const categoria: Categoria = b.categoria ?? "marcas"
  return {
    id: "borrador",
    titulo: b.titulo?.trim() || textos.titulo,
    marca: b.marca?.trim() || textos.marca,
    descripcion: b.descripcion ?? "",
    categoria,
    creadaPor: { perfil: "agencia", nombre: "" },
    estado: "activa",
    destacada: false,
    privada: false,
    presupuesto: b.presupuesto ?? SIMULADOR_AGENCIA.presupuesto,
    cpm: b.cpm ?? SIMULADOR_AGENCIA.cpmSinReferencia,
    topePorVideoPct: b.topePorVideoPct ?? SIMULADOR_AGENCIA.topePorVideoPct,
    minimoVistas: b.minimoVistas ?? SIMULADOR_AGENCIA.minimoVistas,
    redes: idsValidos(SOCIAL_IDS, b.redes),
    material: b.material ?? "",
    requisitos: [],
    inicio: "",
    fin: "",
    creadaEn: "",
    ...(b.sector ? { sector: b.sector } : {}),
    ...(b.vertical ? { vertical: b.vertical } : {}),
  }
}

/**
 * Formulario de campaña con el borrador de la solicitud encima: solo los campos
 * conocidos y con valor (un `undefined` no pisa lo inicial) y con ids válidos.
 */
export function borradorInicial(
  base: BorradorCampana,
  guardado: Partial<BorradorCampana> | null | undefined
): BorradorCampana {
  if (!guardado) return base
  const b: BorradorCampana = { ...base }
  const numero = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v)
  const texto = (v: unknown): v is string => typeof v === "string" && v.trim() !== ""
  if (texto(guardado.marca)) b.marca = guardado.marca
  if (texto(guardado.titulo)) b.titulo = guardado.titulo
  if (texto(guardado.descripcion)) b.descripcion = guardado.descripcion
  if (texto(guardado.material)) b.material = guardado.material
  if (guardado.categoria) b.categoria = guardado.categoria
  const redes = idsValidos(SOCIAL_IDS, guardado.redes)
  if (redes.length) b.redes = redes
  if (numero(guardado.presupuesto)) b.presupuesto = guardado.presupuesto
  if (numero(guardado.cpm)) b.cpm = guardado.cpm
  if (numero(guardado.topePorVideoPct)) b.topePorVideoPct = guardado.topePorVideoPct
  if (numero(guardado.minimoVistas)) b.minimoVistas = guardado.minimoVistas
  if (esId(VERTICALES, guardado.vertical)) b.vertical = guardado.vertical
  if (esId(SECTORES, guardado.sector)) b.sector = guardado.sector
  const paises = idsValidos(COUNTRY_CODES, guardado.paisesObjetivo)
  if (paises.length) b.paisesObjetivo = paises
  const idiomas = idsValidos(IDIOMAS_AUDIENCIA, guardado.idiomas)
  if (idiomas.length) b.idiomas = idiomas
  if (guardado.creadorId) b.creadorId = guardado.creadorId
  return b
}

/* ---------------------------------------------------------------------------
   Oferta estimada (demo) para la reacción de `alcance` y el mercado del render
   --------------------------------------------------------------------------- */

/**
 * Cliperos activos simulados por país. Datos de demo (§7.8), deterministas:
 * sirven a la agencia hasta que `lib/mercado.ts` (`oferta`) lea datos reales.
 */
export const CLIPEROS_DEMO_POR_PAIS: Record<CountryCode, number> = {
  PE: 1240,
  MX: 1860,
  CO: 1120,
  CL: 430,
  AR: 870,
  ES: 690,
  EC: 260,
  BR: 540,
  US: 180,
}

/** Proporción simulada de cliperos que clipea cada vertical (suman más de 1: varias por clipero). */
export const CUOTA_VERTICAL_DEMO: Record<Vertical, number> = {
  gaming: 0.34,
  "directos-irl": 0.28,
  podcast: 0.18,
  deportes: 0.2,
  musica: 0.22,
  humor: 0.3,
  educacion: 0.1,
  negocios: 0.12,
  finanzas: 0.08,
  tecnologia: 0.1,
  estilo: 0.12,
  comida: 0.09,
  "salud-fitness": 0.07,
  "anime-vtubers": 0.08,
  actualidad: 0.05,
}

/** Proporción simulada de cliperos que publica en cada red. */
export const CUOTA_RED_DEMO: Record<SocialId, number> = {
  tiktok: 0.82,
  instagram: 0.58,
  youtube: 0.49,
  x: 0.09,
  linkedin: 0.04,
  facebook: 0.24,
}

const IDIOMA_PRINCIPAL: Record<CountryCode, IdiomaAudiencia> = {
  PE: "es",
  MX: "es",
  CO: "es",
  CL: "es",
  AR: "es",
  ES: "es",
  EC: "es",
  BR: "pt",
  US: "en",
}

function cuotaIdioma(pais: CountryCode, idioma: IdiomaAudiencia): number {
  if (IDIOMA_PRINCIPAL[pais] === idioma) return 0.96
  if (pais === "US" && idioma === "es") return 0.45
  if (idioma === "en") return 0.14
  if (pais === "ES" && (idioma === "ca" || idioma === "eu" || idioma === "gl"))
    return 0.12
  return 0.03
}

/** Probabilidad de cumplir al menos una (independencia supuesta). */
const alguna = (cuotas: readonly number[]) =>
  cuotas.length ? 1 - cuotas.reduce((p, c) => p * (1 - c), 1) : 0

/**
 * Cliperos simulados que cubren una combinación de la agencia: por país,
 * los que clipean alguna de sus verticales, publican en alguna de sus redes y
 * en alguno de sus idiomas. Sin verticales usa las del sector (§4.6). Se
 * enseña siempre con `umbralPublicoValor` (grupos de 50 o más, redondeado).
 */
export function ofertaEstimada({
  verticales,
  sector,
  paises,
  idiomas,
  redes,
}: {
  verticales?: readonly Vertical[]
  sector?: Sector | null
  paises: readonly CountryCode[]
  idiomas: readonly IdiomaAudiencia[]
  redes: readonly SocialId[]
}): number {
  const vs = verticales?.length
    ? verticales
    : sector
      ? [
          ...SECTOR_VERTICALES[sector].principales,
          ...SECTOR_VERTICALES[sector].secundarias,
        ]
      : []
  const pVertical = alguna(vs.map((v) => CUOTA_VERTICAL_DEMO[v]))
  const pRed = alguna(redes.map((r) => CUOTA_RED_DEMO[r]))
  return Math.round(
    paises.reduce(
      (total, pais) =>
        total +
        CLIPEROS_DEMO_POR_PAIS[pais] *
          pVertical *
          pRed *
          alguna(idiomas.map((i) => cuotaIdioma(pais, i))),
      0
    )
  )
}
