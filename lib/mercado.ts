import type { IdiomaAudiencia } from "@/lib/ajustes"
import {
  estadoVisible,
  liquidar,
  sinMedir,
  vistasDe,
  type Campana,
  type EstadoVisto,
  type Envio,
} from "@/lib/campanas"
import { COUNTRY_CODES, type CountryCode } from "@/lib/countries"
import type { Creador, CreadorId } from "@/lib/creadores"
import { normalizarWeb, type SolicitudAgenciaDatos } from "@/lib/onboarding"
import { UMBRAL_ADMIN } from "@/lib/privacidad"
import type { SocialId } from "@/lib/social"
import {
  CPM_REFERENCIA,
  SECTOR_REGULADO,
  SECTOR_VERTICALES,
  VERTICALES,
  type Sector,
  type TramoPresupuesto,
  type Vertical,
} from "@/lib/taxonomia"

/**
 * Mercado por sector (§7.3 y §7.5 de `docs/onboarding-2026-09.md`).
 *
 * Funciones puras: la oferta sale de lo que declaran (o se mide o deduce de) los
 * cliperos y la demanda del presupuesto que les queda a las campañas activas.
 * Nada de aquí lee la hora: «hoy» llega como `ref` (en el backoffice,
 * `snap.updatedAt`). Devuelven códigos y números; la interfaz traduce.
 *
 * Privacidad dentro del admin (§4.6 y §7.7): quien se opuso a las estadísticas
 * (N2) no cuenta en ningún agregado, los creadores no sugeribles no entran en
 * ninguna lista, y una celda con menos de 10 personas no enseña su cifra.
 * Nada de aquí devuelve personas: solo recuentos.
 */

/** Umbrales calibrables (§7.3). Cambiarlos aquí cambia paneles, prioridad y tests. */
export const UMBRALES_MERCADO = {
  /** Ventana de oferta y demanda. */
  ventanaDias: 28,
  /** Escasez: cobertura por debajo de esto… */
  escasezR: 2,
  /** …con al menos este presupuesto activo en la celda (US$). */
  escasezDemandaMin: 500,
  /** Equilibrio hasta esta cobertura; por encima, excedente. */
  equilibrioMax: 20,
  /** Sin demanda, excedente desde esta oferta ponderada. */
  excedenteSinDemanda: 20,
  /** Muestra baja: oferta ponderada por debajo de esto… */
  muestraBajaOferta: 10,
  /** …o menos campañas que esto. */
  muestraBajaCampanas: 3,
  /** Aviso temprano: envíos en las primeras horas… */
  avisoTempranoHoras: 72,
  /** …por cada US$ 1.000 de presupuesto; por debajo, «en riesgo». */
  avisoTempranoMin: 3,
  /** CPM que llena: campañas empezadas en esta ventana. */
  cpmVentanaDias: 90,
  /** Llena si gastó este % antes de terminar… */
  cpmLlenaGastoPct: 80,
  /** …o si tuvo tantos aprobados en su primera semana. */
  cpmLlenaAprobados: 10,
  cpmLlenaDias: 7,
  /** Con menos campañas que llenan, se usa la base siguiente. */
  cpmMuestraMin: 8,
  /** Oportunidad por creador: fans activos sin campaña. */
  fansOportunidad: 25,
  /** Adyacencia: solo con al menos tantos cliperos activos en A. */
  adyacenciaMinA: 30,
  /** Aviso a adyacentes desde esta probabilidad. */
  adyacenciaAviso: 0.3,
  /** Actividad: envío en estos días = 1… */
  actividadEnvioDias: 30,
  /** …onboarding completado en estos días sin envío = 0,5. */
  actividadOnboardingDias: 14,
} as const

const DIA_MS = 86_400_000
const ms = (iso: string) => new Date(iso).getTime()

/* ---------------------------------------------------------------------------
   Celdas
   --------------------------------------------------------------------------- */

export const ESTADOS_CELDA = [
  "sin-oferta",
  "escasez",
  "equilibrio",
  "excedente",
  "sin-datos",
] as const
/** Etiquetas en `admin.mercado.estado.<id>`. */
export type EstadoCelda = (typeof ESTADOS_CELDA)[number]

/** Columna de las campañas sin países objetivo. */
export const GLOBAL = "global" as const
export type PaisCelda = CountryCode | typeof GLOBAL
export const PAISES_CELDA: readonly PaisCelda[] = [...COUNTRY_CODES, GLOBAL]

/** Una campaña sin idiomas acepta cualquiera. */
export const CUALQUIER_IDIOMA = "*" as const

/**
 * Filtro de una celda. `pais: null` agrega todos los países (nivel «vertical»);
 * `idioma` y `red` a `null` no filtran. En la columna `global` la oferta es la
 * de todos los países (cualquiera puede servir una campaña global) y la
 * demanda, la de las campañas sin países.
 */
export interface FiltroCelda {
  vertical: Vertical
  pais: PaisCelda | null
  idioma?: IdiomaAudiencia | null
  red?: SocialId | null
}

/** Clave estable de una celda: `vertical|pais|idioma|red` con `*` donde no filtra. */
export const claveCelda = (f: FiltroCelda) =>
  `${f.vertical}|${f.pais ?? "*"}|${f.idioma ?? "*"}|${f.red ?? "*"}`

/* ---------------------------------------------------------------------------
   Oferta
   --------------------------------------------------------------------------- */

/** Lo que el mercado necesita de un clipero. Sin nombre ni correo: no hace falta. */
export interface CliperoMercado {
  id: string
  /** `null` si declaró «otro país». */
  pais: CountryCode | null
  idiomas: readonly IdiomaAudiencia[]
  redes: readonly SocialId[]
  /** Declaradas en el onboarding. */
  verticales: readonly Vertical[]
  /** Dos o más envíos aprobados en esa vertical. */
  verticalesInferidas: readonly Vertical[]
  /** Tiene una cuenta conectada: sus datos son medidos. */
  conectado: boolean
  confianzaBaja: boolean
  /** Último envío (ISO). */
  ultimoEnvioEn?: string | null
  completadoEn?: string | null
  /** Se opuso a las estadísticas de plataforma (N2): fuera de todo agregado. */
  opuestoEstadisticas: boolean
  /** Solo ids del catálogo: los pendientes no entran en agregados. */
  creadoresFan: readonly CreadorId[]
}

/**
 * Peso de un clipero en una vertical (§4.6): 1 si es inferida (envíos aprobados)
 * o si el dato es medido (cuenta conectada); 0,5 si solo lo declaró; 0,25 si lo
 * declaró con baja confianza (todo marcado, o 1m+ sin conectar); 0 si no la tiene.
 */
export function pesoFuente(c: CliperoMercado, vertical: Vertical): 0 | 0.25 | 0.5 | 1 {
  if (c.verticalesInferidas.includes(vertical)) return 1
  if (!c.verticales.includes(vertical)) return 0
  if (c.confianzaBaja) return 0.25
  return c.conectado ? 1 : 0.5
}

/**
 * Actividad (§4.6): envío en los últimos 30 días = 1; onboarding completado en
 * los últimos 14 días sin ningún envío = 0,5; el resto, 0.
 */
export function actividad(c: CliperoMercado, ref: string): 0 | 0.5 | 1 {
  const t = ms(ref)
  if (c.ultimoEnvioEn) {
    const d = (t - ms(c.ultimoEnvioEn)) / DIA_MS
    if (d >= 0 && d <= UMBRALES_MERCADO.actividadEnvioDias) return 1
    return 0
  }
  if (c.completadoEn) {
    const d = (t - ms(c.completadoEn)) / DIA_MS
    if (d >= 0 && d <= UMBRALES_MERCADO.actividadOnboardingDias) return 0.5
  }
  return 0
}

/** Cuenta en los agregados: no se opuso a N2. */
export const cuentaEnAgregados = (c: Pick<CliperoMercado, "opuestoEstadisticas">) =>
  !c.opuestoEstadisticas

export interface MedidaOferta {
  /** Σ peso × actividad. */
  O: number
  /** Personas que suman (peso × actividad > 0): el umbral de privacidad se mide aquí. */
  n: number
}

/** Oferta `O(c)` de una celda (§7.3). */
export function oferta(
  cliperos: readonly CliperoMercado[],
  f: FiltroCelda,
  ref: string
): MedidaOferta {
  let O = 0
  let n = 0
  for (const c of cliperos) {
    if (!cuentaEnAgregados(c)) continue
    if (f.pais && f.pais !== GLOBAL && c.pais !== f.pais) continue
    if (f.idioma && !c.idiomas.includes(f.idioma)) continue
    if (f.red && !c.redes.includes(f.red)) continue
    const w = pesoFuente(c, f.vertical) * actividad(c, ref)
    if (w <= 0) continue
    O += w
    n += 1
  }
  return { O: redondear(O), n }
}

/* ---------------------------------------------------------------------------
   Demanda
   --------------------------------------------------------------------------- */

/** Campaña con lo que le queda y su estado visible. */
export interface CampanaMercado {
  campana: Campana
  restante: number
  estado: EstadoVisto
}

/** Liquida cada campaña con sus envíos (hasta `ref` si se pasa). */
export function campanasMercado(
  campanas: readonly Campana[],
  envios: readonly Envio[],
  ref?: string
): CampanaMercado[] {
  const hasta = ref ? ms(ref) : Infinity
  const porCampana = agrupar(
    envios.filter((e) => ms(e.enviadoEn) < hasta),
    (e) => e.campanaId
  )
  return campanas.map((campana) => {
    const l = liquidar(campana, porCampana.get(campana.id) ?? [])
    return { campana, restante: l.restante, estado: estadoVisible(campana, l) }
  })
}

export interface CeldaCampana {
  vertical: Vertical
  pais: PaisCelda
  idioma: IdiomaAudiencia | typeof CUALQUIER_IDIOMA
  red: SocialId
}

const cacheCeldas = new WeakMap<Campana, CeldaCampana[]>()

/** Celdas que cubre una campaña: verticales × países × idiomas × redes. */
export function celdasDe(c: Campana): CeldaCampana[] {
  const guardadas = cacheCeldas.get(c)
  if (guardadas) return guardadas
  const verticales = [
    ...new Set([...(c.vertical ? [c.vertical] : []), ...(c.verticalesSecundarias ?? [])]),
  ]
  const paises: PaisCelda[] = c.paisesObjetivo?.length ? c.paisesObjetivo : [GLOBAL]
  const idiomas: CeldaCampana["idioma"][] = c.idiomas?.length
    ? c.idiomas
    : [CUALQUIER_IDIOMA]
  const salida: CeldaCampana[] = []
  for (const vertical of verticales)
    for (const pais of paises)
      for (const idioma of idiomas)
        for (const red of c.redes) salida.push({ vertical, pais, idioma, red })
  cacheCeldas.set(c, salida)
  return salida
}

const coincide = (celda: CeldaCampana, f: FiltroCelda) =>
  celda.vertical === f.vertical &&
  (f.pais === null || celda.pais === f.pais) &&
  (!f.idioma || celda.idioma === CUALQUIER_IDIOMA || celda.idioma === f.idioma) &&
  (!f.red || celda.red === f.red)

export interface MedidaDemanda {
  /** US$ activos que caen en la celda. */
  D: number
  /** Campañas con alguna celda dentro. */
  campanas: number
}

/**
 * Demanda `D(c)` (§7.3): presupuesto restante de las campañas activas,
 * repartido a partes iguales entre sus `k` celdas. Una campaña sin idiomas
 * cuenta entera en cualquier filtro de idioma.
 */
export function demanda(
  campanas: readonly CampanaMercado[],
  f: FiltroCelda
): MedidaDemanda {
  let D = 0
  let n = 0
  for (const x of campanas) {
    if (x.estado !== "activa" || x.restante <= 0) continue
    const celdas = celdasDe(x.campana)
    if (celdas.length === 0) continue
    const dentro = celdas.filter((celda) => coincide(celda, f)).length
    if (dentro === 0) continue
    D += (x.restante * dentro) / celdas.length
    n += 1
  }
  return { D: redondear(D), campanas: n }
}

/** Envíos de los últimos 7 días que caen en la celda, repartidos como la demanda. */
export function enviosRecientes(
  campanas: readonly CampanaMercado[],
  envios: readonly Envio[],
  f: FiltroCelda,
  ref: string
): number {
  const desde = ms(ref) - 7 * DIA_MS
  const hasta = ms(ref)
  const porCampana = agrupar(
    envios.filter((e) => ms(e.enviadoEn) >= desde && ms(e.enviadoEn) < hasta),
    (e) => e.campanaId
  )
  let total = 0
  for (const x of campanas) {
    const recientes = porCampana.get(x.campana.id)?.length ?? 0
    if (recientes === 0) continue
    const celdas = celdasDe(x.campana)
    const dentro = celdas.filter((celda) => coincide(celda, f)).length
    if (dentro) total += (recientes * dentro) / celdas.length
  }
  return redondear(total)
}

/* ---------------------------------------------------------------------------
   Cobertura y estado
   --------------------------------------------------------------------------- */

/** `R(c)` = cliperos ponderados por cada US$ 1.000 activos. */
export const cobertura = (O: number, D: number) =>
  redondear(O / Math.max(D / 1000, 0.001))

/** Saturación = envíos en 7 días por cada US$ 1.000 activos. */
export const saturacion = (envios7d: number, D: number) =>
  D > 0 ? redondear(envios7d / (D / 1000)) : null

/**
 * Estado de la celda (§7.3). Sin demanda la cobertura no existe: con oferta de
 * 20 o más es excedente y, si no, no hay datos.
 */
export function estadoCelda(O: number, D: number): EstadoCelda {
  const u = UMBRALES_MERCADO
  if (O === 0 && D > 0) return "sin-oferta"
  if (D === 0) return O >= u.excedenteSinDemanda ? "excedente" : "sin-datos"
  const R = cobertura(O, D)
  if (R < u.escasezR && D >= u.escasezDemandaMin) return "escasez"
  if (R > u.equilibrioMax) return "excedente"
  if (R >= u.escasezR) return "equilibrio"
  return "sin-datos"
}

export const esMuestraBaja = (O: number, campanas: number) =>
  O < UMBRALES_MERCADO.muestraBajaOferta ||
  campanas < UMBRALES_MERCADO.muestraBajaCampanas

export type NivelCelda = "celda" | "vertical-pais" | "vertical"

export interface Medida {
  O: number
  D: number
  campanas: number
}

/**
 * Estado con muestra baja (§7.3): si la celda tiene poca oferta o menos de 3
 * campañas, su estado se lee en `(vertical, país)` y, si tampoco llega, en la
 * vertical. «Sin oferta» (nadie y hay dinero) y la ausencia de demanda no se
 * agregan: no son un problema de muestra.
 */
export function agregarMuestraBaja(niveles: readonly [Medida, Medida?, Medida?]): {
  estado: EstadoCelda
  nivel: NivelCelda
  muestraBaja: boolean
} {
  const [celda] = niveles
  if ((celda.O === 0 && celda.D > 0) || celda.D === 0)
    return { estado: estadoCelda(celda.O, celda.D), nivel: "celda", muestraBaja: false }
  const nombres: NivelCelda[] = ["celda", "vertical-pais", "vertical"]
  for (let i = 0; i < niveles.length; i++) {
    const m = niveles[i]
    if (!m) continue
    if (!esMuestraBaja(m.O, m.campanas))
      return { estado: estadoCelda(m.O, m.D), nivel: nombres[i], muestraBaja: i > 0 }
  }
  return { estado: estadoCelda(celda.O, celda.D), nivel: "celda", muestraBaja: true }
}

export interface CeldaMercado {
  clave: string
  vertical: Vertical
  pais: PaisCelda | null
  idioma: IdiomaAudiencia | null
  red: SocialId | null
  O: number
  D: number
  R: number | null
  /** Personas detrás de O. */
  n: number
  campanas: number
  estado: EstadoCelda
  nivel: NivelCelda
  muestraBaja: boolean
  /** Menos de 10 personas: la cifra de oferta no se enseña (el estado sí). */
  oculta: boolean
  envios7d: number
  saturacion: number | null
}

/** Evalúa una celda con su agregación por muestra baja. */
export function evaluarCelda(
  cliperos: readonly CliperoMercado[],
  campanas: readonly CampanaMercado[],
  envios: readonly Envio[],
  f: FiltroCelda,
  ref: string
): CeldaMercado {
  const o = oferta(cliperos, f, ref)
  const d = demanda(campanas, f)
  const medida = (filtro: FiltroCelda): Medida => ({
    O: oferta(cliperos, filtro, ref).O,
    ...demanda(campanas, filtro),
  })
  const base: Medida = { O: o.O, D: d.D, campanas: d.campanas }
  const filtrada = !!f.idioma || !!f.red
  const evaluado = agregarMuestraBaja(
    esMuestraBaja(base.O, base.campanas) && base.D > 0 && base.O > 0
      ? [
          base,
          filtrada ? medida({ vertical: f.vertical, pais: f.pais }) : undefined,
          medida({ vertical: f.vertical, pais: null }),
        ]
      : [base]
  )
  const envios7d = enviosRecientes(campanas, envios, f, ref)
  return {
    clave: claveCelda(f),
    vertical: f.vertical,
    pais: f.pais,
    idioma: f.idioma ?? null,
    red: f.red ?? null,
    O: o.O,
    D: d.D,
    R: d.D > 0 ? cobertura(o.O, d.D) : null,
    n: o.n,
    campanas: d.campanas,
    ...evaluado,
    muestraBaja: evaluado.muestraBaja || (o.n > 0 && o.n < 20),
    oculta: o.n > 0 && o.n < UMBRAL_ADMIN,
    envios7d,
    saturacion: saturacion(envios7d, d.D),
  }
}

/** Rejilla vertical × país (con la columna global) para un idioma y una red. */
export function celdas(
  cliperos: readonly CliperoMercado[],
  campanas: readonly CampanaMercado[],
  envios: readonly Envio[],
  filtro: { idioma?: IdiomaAudiencia | null; red?: SocialId | null },
  ref: string,
  opciones: { verticales?: readonly Vertical[]; paises?: readonly PaisCelda[] } = {}
): CeldaMercado[] {
  const verticales = opciones.verticales ?? VERTICALES
  const paises = opciones.paises ?? PAISES_CELDA
  return verticales.flatMap((vertical) =>
    paises.map((pais) =>
      evaluarCelda(
        cliperos,
        campanas,
        envios,
        { vertical, pais, idioma: filtro.idioma ?? null, red: filtro.red ?? null },
        ref
      )
    )
  )
}

/** Celdas en las que hay cliperos para servir (equilibrio o excedente). */
export const esServible = (estado: EstadoCelda) =>
  estado === "equilibrio" || estado === "excedente"

/* ---------------------------------------------------------------------------
   Campañas: aviso temprano y CPM
   --------------------------------------------------------------------------- */

export interface AvisoTemprano {
  /** Envíos en las primeras 72 h por cada US$ 1.000. */
  ratio: number
  envios: number
  /** Ya pasaron las 72 h. */
  evaluable: boolean
  enRiesgo: boolean
}

/** Aviso temprano de una campaña (§7.3). */
export function avisoTemprano(
  c: Pick<Campana, "id" | "inicio" | "presupuesto">,
  envios: readonly Envio[],
  ref: string
): AvisoTemprano {
  const u = UMBRALES_MERCADO
  const inicio = ms(c.inicio)
  const fin = inicio + u.avisoTempranoHoras * 3_600_000
  const n = envios.filter(
    (e) => e.campanaId === c.id && ms(e.enviadoEn) >= inicio && ms(e.enviadoEn) < fin
  ).length
  const ratio = redondear(n / Math.max(c.presupuesto / 1000, 0.001))
  const evaluable = ms(ref) >= fin
  return {
    ratio,
    envios: n,
    evaluable,
    enRiesgo: evaluable && ratio < u.avisoTempranoMin,
  }
}

/** La campaña llenó: gastó el 80 % antes de terminar o tuvo 10 aprobados en su primera semana. */
export function llena(c: Campana, envios: readonly Envio[], ref: string): boolean {
  const u = UMBRALES_MERCADO
  const propios = envios.filter((e) => e.campanaId === c.id)
  const corte = Math.min(ms(c.fin), ms(ref))
  const l = liquidar(
    c,
    propios.filter((e) => ms(e.enviadoEn) <= corte)
  )
  if (l.consumidoPct >= u.cpmLlenaGastoPct) return true
  const semana = ms(c.inicio) + u.cpmLlenaDias * DIA_MS
  const aprobados = propios.filter(
    (e) => e.estado === "aprobado" && ms(e.enviadoEn) < semana
  ).length
  return aprobados >= u.cpmLlenaAprobados
}

/** Percentil ponderado (0–1) por peso: el valor donde el peso acumulado alcanza `p`. */
export function percentilPonderado(
  valores: readonly { valor: number; peso: number }[],
  p: number
): number | null {
  const lista = valores.filter((x) => x.peso > 0).sort((a, b) => a.valor - b.valor)
  const total = lista.reduce((n, x) => n + x.peso, 0)
  if (total === 0) return null
  let acumulado = 0
  for (const x of lista) {
    acumulado += x.peso
    if (acumulado / total >= p) return x.valor
  }
  return lista.at(-1)!.valor
}

export type BaseCpm =
  "sector-pais" | "sector" | "vertical" | "referencia" | "sin-referencia"

export interface CpmQueLlena {
  base: BaseCpm
  /** Campañas que llenaron en esa base (0 en la referencia de mercado). */
  n: number
  p25: number | null
  p50: number | null
  p75: number | null
}

const dentroDeVentana = (c: Campana, ref: string) => {
  const inicio = ms(c.inicio)
  return inicio <= ms(ref) && inicio >= ms(ref) - UMBRALES_MERCADO.cpmVentanaDias * DIA_MS
}

const cubrePais = (c: Campana, pais: PaisCelda) =>
  pais === GLOBAL ? !c.paisesObjetivo?.length : !!c.paisesObjetivo?.includes(pais)

/**
 * CPM que llena por sector y país (§7.3), ponderado por presupuesto, en 90 días.
 * Con menos de 8 campañas que llenan: el sector en todos los países, después las
 * campañas de sus verticales principales y, al final, la referencia de mercado.
 */
export function cpmQueLlena(
  campanas: readonly Campana[],
  envios: readonly Envio[],
  opciones: { sector: Sector; pais: PaisCelda; ref: string }
): CpmQueLlena {
  const { sector, pais, ref } = opciones
  const recientes = campanas.filter((c) => dentroDeVentana(c, ref))
  const principales = SECTOR_VERTICALES[sector].principales
  const bases: [BaseCpm, (c: Campana) => boolean][] = [
    ["sector-pais", (c) => c.sector === sector && cubrePais(c, pais)],
    ["sector", (c) => c.sector === sector],
    ["vertical", (c) => !!c.vertical && principales.includes(c.vertical)],
  ]
  for (const [base, filtro] of bases) {
    const llenas = recientes.filter((c) => filtro(c) && llena(c, envios, ref))
    if (llenas.length >= UMBRALES_MERCADO.cpmMuestraMin) {
      const valores = llenas.map((c) => ({ valor: c.cpm, peso: c.presupuesto }))
      return {
        base,
        n: llenas.length,
        p25: percentilPonderado(valores, 0.25),
        p50: percentilPonderado(valores, 0.5),
        p75: percentilPonderado(valores, 0.75),
      }
    }
  }
  const referencia = CPM_REFERENCIA[sector]
  if (!referencia)
    return { base: "sin-referencia", n: 0, p25: null, p50: null, p75: null }
  return {
    base: "referencia",
    n: 0,
    p25: referencia.min,
    p50: redondear((referencia.min + referencia.max) / 2),
    p75: referencia.max,
  }
}

/** CPM que se atasca: mediana del CPM de las campañas «en riesgo» del sector y país. */
export function cpmQueSeAtasca(
  campanas: readonly Campana[],
  envios: readonly Envio[],
  opciones: { sector: Sector; pais: PaisCelda; ref: string }
): { n: number; mediana: number | null } {
  const { sector, pais, ref } = opciones
  const cpms = campanas
    .filter(
      (c) =>
        c.sector === sector &&
        cubrePais(c, pais) &&
        dentroDeVentana(c, ref) &&
        avisoTemprano(c, envios, ref).enRiesgo
    )
    .map((c) => c.cpm)
  return { n: cpms.length, mediana: mediana(cpms) }
}

/**
 * CPM recomendado para el formulario (§7.3): el rango p25–p75 del que llena;
 * con escasez, se sugiere el p75. `bajo` si el elegido no llega al que se atasca.
 */
export function cpmRecomendado(
  llena: CpmQueLlena,
  opciones: { escasez?: boolean; elegido?: number; atasca?: number | null } = {}
) {
  const sugerido = opciones.escasez ? llena.p75 : llena.p50
  const bajo =
    opciones.elegido != null &&
    opciones.atasca != null &&
    opciones.elegido < opciones.atasca
  return { min: llena.p25, max: llena.p75, sugerido, bajo }
}

/* ---------------------------------------------------------------------------
   Fandom y adyacencias
   --------------------------------------------------------------------------- */

export interface Oportunidad {
  creadorId: CreadorId
  /** Fans con actividad > 0 (sin quien se opuso a N2). */
  fans: number
  /** País con más fans, solo si allí hay 10 o más (umbral del admin). */
  paisPrincipal: CountryCode | null
  fansPaisPrincipal: number | null
  vistasMedianas: number | null
  puntuacion: number
  /** Su enlace de canal coincide con el de un usuario: ya está en Clipealo. */
  esUsuario: boolean
}

/** Mediana de vistas por clip aprobado, por vertical de la campaña. */
export function vistasMedianasPorVertical(
  campanas: readonly Campana[],
  envios: readonly Envio[]
): Partial<Record<Vertical, number>> {
  const vertical = new Map(campanas.map((c) => [c.id, c.vertical]))
  const porVertical = new Map<Vertical, number[]>()
  for (const e of envios) {
    if (e.estado !== "aprobado") continue
    const v = vertical.get(e.campanaId)
    if (!v) continue
    // Un envío sin medición no entra en la mediana: contarlo como cero
    // hundiría la referencia del mercado con un dato que nadie tomó
    if (sinMedir(e)) continue
    const lista = porVertical.get(v) ?? []
    lista.push(vistasDe(e))
    porVertical.set(v, lista)
  }
  return Object.fromEntries(
    [...porVertical].map(([v, xs]) => [v, mediana(xs) ?? 0])
  ) as Partial<Record<Vertical, number>>
}

/**
 * Oportunidad por creador (§7.3): 25 fans activos o más y sin campaña activa.
 * Orden: fans × mediana de vistas por clip aprobado en su vertical (sin vistas,
 * solo fans). Los creadores no sugeribles no se listan nunca.
 */
export function oportunidades(
  creadores: readonly Creador[],
  cliperos: readonly CliperoMercado[],
  campanas: readonly CampanaMercado[],
  ref: string,
  opciones: {
    vistasMedianas?: Partial<Record<Vertical, number>>
    /** Handles de canal de usuarios («plataforma:handle» en minúsculas). */
    handlesUsuarios?: ReadonlySet<string>
  } = {}
): Oportunidad[] {
  const activos = cliperos.filter((c) => cuentaEnAgregados(c) && actividad(c, ref) > 0)
  const conCampana = new Set(
    campanas
      .filter((x) => x.estado === "activa" && x.campana.creadorId)
      .map((x) => x.campana.creadorId!)
  )
  const salida: Oportunidad[] = []
  for (const cr of creadores) {
    if (!cr.sugerible || conCampana.has(cr.id)) continue
    const fans = activos.filter((c) => c.creadoresFan.includes(cr.id))
    if (fans.length < UMBRALES_MERCADO.fansOportunidad) continue
    const porPais = new Map<CountryCode, number>()
    for (const f of fans) if (f.pais) porPais.set(f.pais, (porPais.get(f.pais) ?? 0) + 1)
    const [top] = [...porPais].sort((a, b) => b[1] - a[1])
    const principal = top && top[1] >= UMBRAL_ADMIN ? top : null
    const vistas =
      cr.verticales
        .map((v) => opciones.vistasMedianas?.[v])
        .find((x): x is number => typeof x === "number" && x > 0) ?? null
    salida.push({
      creadorId: cr.id,
      fans: fans.length,
      paisPrincipal: principal?.[0] ?? null,
      fansPaisPrincipal: principal?.[1] ?? null,
      vistasMedianas: vistas,
      puntuacion: fans.length * (vistas ?? 1),
      esUsuario: cr.cuentas.some((cuenta) =>
        opciones.handlesUsuarios?.has(
          `${cuenta.plataforma}:${cuenta.handle.toLowerCase()}`
        )
      ),
    })
  }
  return salida.sort((a, b) => b.puntuacion - a.puntuacion || b.fans - a.fans)
}

/** Fans activos por creador (para la prioridad y el bloque «Encaje»). */
export function fansActivos(
  cliperos: readonly CliperoMercado[],
  ref: string
): Partial<Record<CreadorId, number>> {
  const cuenta: Partial<Record<CreadorId, number>> = {}
  for (const c of cliperos) {
    if (!cuentaEnAgregados(c) || actividad(c, ref) === 0) continue
    for (const id of c.creadoresFan) cuenta[id] = (cuenta[id] ?? 0) + 1
  }
  return cuenta
}

export interface Adyacencia {
  a: Vertical
  b: Vertical
  /** Cliperos activos con A. */
  nA: number
  /** Con A y B. */
  nAB: number
  /** `P(B | A)`; `null` si A tiene menos de 30 cliperos activos. */
  p: number | null
}

/** Verticales de un clipero para la adyacencia: declaradas y deducidas. */
const verticalesDe = (c: CliperoMercado) =>
  new Set<Vertical>([...c.verticales, ...c.verticalesInferidas])

/** Matriz de adyacencia (§7.3): `P(B | A)` entre cliperos activos, solo si #A ≥ 30. */
export function adyacencias(
  cliperos: readonly CliperoMercado[],
  ref: string,
  verticales: readonly Vertical[] = VERTICALES
): Adyacencia[] {
  const activos = cliperos
    .filter((c) => cuentaEnAgregados(c) && actividad(c, ref) > 0)
    .map(verticalesDe)
  const salida: Adyacencia[] = []
  for (const a of verticales) {
    const conA = activos.filter((s) => s.has(a))
    for (const b of verticales) {
      if (a === b) continue
      const nAB = conA.filter((s) => s.has(b)).length
      salida.push({
        a,
        b,
        nA: conA.length,
        nAB,
        p:
          conA.length >= UMBRALES_MERCADO.adyacenciaMinA
            ? redondear(nAB / conA.length)
            : null,
      })
    }
  }
  return salida
}

/* ---------------------------------------------------------------------------
   Cola de agencias (§7.5)
   --------------------------------------------------------------------------- */

/** Puntos del tramo del borrador (se multiplican por 2). */
export const PUNTOS_TRAMO: Record<TramoPresupuesto, number> = {
  "lt-500": 0,
  "500-2k": 1,
  "2k-10k": 2,
  "10k-50k": 3,
  "50k-plus": 4,
  "no-decir": 1,
}

export type MotivoPrioridad =
  | { codigo: "tramo"; puntos: number; tramo: TramoPresupuesto }
  | { codigo: "celdas"; puntos: 2 }
  | { codigo: "fans"; puntos: 2; fans: number }
  | { codigo: "dominio"; puntos: 1 }
  | { codigo: "web"; puntos: 1 }

export interface PrioridadSolicitud {
  puntos: number
  /** Un chip por motivo; el tramo siempre, aunque sume 0. */
  motivos: MotivoPrioridad[]
  /** Insignia «Revisión legal»: no cambia la prioridad. */
  regulado: boolean
}

export type SolicitudPriorizable = Pick<
  SolicitudAgenciaDatos,
  | "tramoPresupuesto"
  | "dominioCoincide"
  | "web"
  | "sector"
  | "verticalesMaterial"
  | "paisesObjetivo"
  | "redesObjetivo"
  | "creadorId"
>

/**
 * Prioridad explicable de una solicitud de agencia: 2 × tramo, +2 si alguna de
 * sus celdas tiene cliperos para servirla, +2 si su creador tiene 25 fans
 * activos o más, +1 si el correo coincide con la web y +1 si la web es válida.
 * `celdaServible` recibe la clave de `claveCelda` sin idioma.
 */
export function prioridadSolicitud(
  s: SolicitudPriorizable,
  contexto: {
    celdaServible: (clave: string) => boolean
    fansActivos: (creadorId: CreadorId) => number
  }
): PrioridadSolicitud {
  const motivos: MotivoPrioridad[] = [
    {
      codigo: "tramo",
      puntos: 2 * PUNTOS_TRAMO[s.tramoPresupuesto],
      tramo: s.tramoPresupuesto,
    },
  ]
  const paises: PaisCelda[] = s.paisesObjetivo.length ? s.paisesObjetivo : [GLOBAL]
  const redes: (SocialId | null)[] = s.redesObjetivo.length ? s.redesObjetivo : [null]
  const servible = s.verticalesMaterial.some((vertical) =>
    paises.some((pais) =>
      redes.some((red) => contexto.celdaServible(claveCelda({ vertical, pais, red })))
    )
  )
  if (servible) motivos.push({ codigo: "celdas", puntos: 2 })
  const fans = s.creadorId ? contexto.fansActivos(s.creadorId) : 0
  if (fans >= UMBRALES_MERCADO.fansOportunidad)
    motivos.push({ codigo: "fans", puntos: 2, fans })
  if (s.dominioCoincide) motivos.push({ codigo: "dominio", puntos: 1 })
  if (normalizarWeb(s.web)) motivos.push({ codigo: "web", puntos: 1 })
  return {
    puntos: motivos.reduce((n, m) => n + m.puntos, 0),
    motivos,
    regulado: SECTOR_REGULADO[s.sector] ?? false,
  }
}

/* ---------------------------------------------------------------------------
   Utilidades
   --------------------------------------------------------------------------- */

function redondear(n: number, decimales = 2) {
  const f = 10 ** decimales
  return Math.round(n * f) / f
}

export function mediana(valores: readonly number[]): number | null {
  if (valores.length === 0) return null
  const orden = [...valores].sort((a, b) => a - b)
  const mitad = Math.floor(orden.length / 2)
  return orden.length % 2 ? orden[mitad] : (orden[mitad - 1] + orden[mitad]) / 2
}

function agrupar<T, K>(items: readonly T[], clave: (x: T) => K): Map<K, T[]> {
  const mapa = new Map<K, T[]>()
  for (const x of items) {
    const k = clave(x)
    const lista = mapa.get(k)
    if (lista) lista.push(x)
    else mapa.set(k, [x])
  }
  return mapa
}
