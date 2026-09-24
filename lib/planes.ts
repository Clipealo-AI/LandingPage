import {
  CAPACIDADES,
  CAPACIDAD_FILA,
  CLIPS_ANALITICA_POR_PLAN,
  CUENTAS_POR_PLAN,
  MINUTOS_INCLUIDOS,
  NETWORKS_BY_PLAN,
  PLANS,
  PLAN_DEMO,
  PLAN_IDS,
  capacidadesDe,
  highlightKeys,
  planPermite,
  type Capacidad,
  type FeatureRow,
  type FeatureValue,
  type PlanPermisos,
  type PricingPlanId,
} from "@/lib/pricing"
import type { SocialId } from "@/lib/social"

/**
 * LOS PLANES, como dato.
 *
 * Los tres de la web están escritos en `lib/pricing.ts`: precio, minutos,
 * comparativa, textos en tres idiomas. Cambiar un precio era tocar código, y
 * darle a una universidad «Creador pero con 1.200 minutos» era imposible. Aquí
 * los planes salen del código: el backoffice cambia los de fábrica y crea otros
 * nuevos, y la app, /precios y la puerta de cada función leen el catálogo.
 *
 * Un plan creado HEREDA de un escalón (`base`): la columna de la comparativa,
 * los puntos de la tarjeta y las redes que admite son los de su base, y encima
 * elige lo suyo: nombre, lema, precios, minutos, qué capacidades desbloquea, si
 * sale en /precios o queda oculto para asignarlo a mano. Lo que la app cobra
 * de verdad —minutos y las cuatro capacidades— se escribe en su columna desde
 * sus propios datos, no desde la base: que /precios prometa lo que el producto
 * hace es la regla de siempre.
 *
 * Semillas + parches, como Formación y las preguntas: de un escalón se guarda
 * solo lo que cambia; un plan creado se guarda entero. Sin React ni reloj.
 */

/* ---------------------------------------------------------------------------
   Qué es un plan
   --------------------------------------------------------------------------- */

/** El id de un plan de la cuenta: uno de los tres escalones o uno creado (`plan_…`). */
export type PlanId = string

export interface PlanCatalogo extends PlanPermisos {
  id: PlanId
  /** `semilla`: uno de los tres de la web. `creado`: lo escribió el admin. */
  origen: "semilla" | "creado"
  /** De qué escalón hereda comparativa, tarjeta y redes. Las semillas son su propia base. */
  base: PricingPlanId
  /** Apagado no se puede tener ni asignar. Apagar no borra: quien lo tenía cae al de la demo. */
  activo: boolean
  /** Sale en /precios y en la comparativa. Oculto solo se asigna desde el backoffice. */
  visible: boolean
  /** De menor a mayor, para las tarjetas y los selectores. */
  orden: number
  monthly: number
  /** Precio al mes con facturación anual. */
  yearly: number
  /** Minutos de video al mes. */
  minutos: number
  /** Cuentas sociales conectadas a la vez, sumando todas las redes. Las redes las da su escalón. */
  cuentas: number
  /** US$ al mes por miembro adicional del equipo. 0: los miembros no se cobran aparte. */
  asiento: number
  capacidades: readonly Capacidad[]
  /** La tarjeta destacada. Como mucho una. */
  featured: boolean
  /* --- Solo los creados: lo que la semilla tiene en `messages/` --- */
  /** Contenido: va en el idioma en que se escriba y no se traduce. */
  nombre?: string
  lema?: string
}

export const LIMITES_PLAN = {
  nombreMin: 2,
  nombreMax: 40,
  lemaMax: 80,
  precioMax: 9999,
  minutosMin: 1,
  minutosMax: 100_000,
  cuentasMin: 1,
  cuentasMax: 1000,
} as const

/** Los tres de fábrica, tal y como los escribe `lib/pricing.ts`. */
export const PLANES_SEMILLA: PlanCatalogo[] = PLANS.map((p, i) => ({
  id: p.id,
  origen: "semilla",
  base: p.id,
  activo: true,
  visible: true,
  orden: i,
  monthly: p.monthly,
  yearly: p.yearly,
  minutos: MINUTOS_INCLUIDOS[p.id],
  cuentas: CUENTAS_POR_PLAN[p.id],
  asiento: p.asiento ?? 0,
  capacidades: capacidadesDe(p.id),
  featured: Boolean(p.featured),
}))

/* ---------------------------------------------------------------------------
   Lo que se guarda: semillas + parches
   --------------------------------------------------------------------------- */

export const PLANES_VERSION = 1

/** Lo que se puede cambiar de una semilla. El nombre no: vive en `messages/`. */
export type ParchePlan = Partial<
  Pick<
    PlanCatalogo,
    | "activo"
    | "visible"
    | "orden"
    | "monthly"
    | "yearly"
    | "minutos"
    | "cuentas"
    | "asiento"
    | "capacidades"
    | "featured"
  >
>

export interface PlanesGuardados {
  version: number
  creados: PlanCatalogo[]
  /** id de semilla → lo que cambió. */
  cambios: Record<string, ParchePlan>
}

export const PLANES_VACIO: PlanesGuardados = {
  version: PLANES_VERSION,
  creados: [],
  cambios: {},
}

/** El catálogo aplicado, en orden. Las semillas van delante a igual orden. */
export function aplicarPlanes(
  g: PlanesGuardados,
  semillas: readonly PlanCatalogo[] = PLANES_SEMILLA
): PlanCatalogo[] {
  return [...semillas, ...g.creados]
    .map((p) => (g.cambios[p.id] ? { ...p, ...g.cambios[p.id] } : p))
    .sort(
      (a, b) =>
        a.orden - b.orden ||
        Number(a.origen === "creado") - Number(b.origen === "creado") ||
        a.id.localeCompare(b.id)
    )
}

const mismasCapacidades = (a: readonly Capacidad[], b: readonly Capacidad[]) =>
  a.length === b.length && a.every((c) => b.includes(c))

/** El parche mínimo de una semilla: nunca se copia el plan entero. */
export function parchePlan(base: PlanCatalogo, siguiente: PlanCatalogo): ParchePlan {
  const p: ParchePlan = {}
  if (siguiente.activo !== base.activo) p.activo = siguiente.activo
  if (siguiente.visible !== base.visible) p.visible = siguiente.visible
  if (siguiente.orden !== base.orden) p.orden = siguiente.orden
  if (siguiente.monthly !== base.monthly) p.monthly = siguiente.monthly
  if (siguiente.yearly !== base.yearly) p.yearly = siguiente.yearly
  if (siguiente.minutos !== base.minutos) p.minutos = siguiente.minutos
  if (siguiente.cuentas !== base.cuentas) p.cuentas = siguiente.cuentas
  if (siguiente.asiento !== base.asiento) p.asiento = siguiente.asiento
  if (!mismasCapacidades(siguiente.capacidades, base.capacidades))
    p.capacidades = [...siguiente.capacidades]
  if (siguiente.featured !== base.featured) p.featured = siguiente.featured
  return p
}

/* ---------------------------------------------------------------------------
   Escribir un plan
   --------------------------------------------------------------------------- */

export interface BorradorPlan {
  /** Sin `id` = plan nuevo. */
  id?: PlanId
  origen: PlanCatalogo["origen"]
  nombre: string
  lema: string
  base: PricingPlanId
  monthly: number
  yearly: number
  minutos: number
  cuentas: number
  asiento: number
  capacidades: Capacidad[]
  visible: boolean
  activo: boolean
  featured: boolean
}

const semillaDe = (escalon: PricingPlanId) =>
  PLANES_SEMILLA.find((p) => p.id === escalon) ?? PLANES_SEMILLA[0]

/** Un plan nuevo nace como Creador: es el escalón que más se parece a lo que se pide a mano. */
export const PLAN_NUEVO: BorradorPlan = {
  origen: "creado",
  nombre: "",
  lema: "",
  base: PLAN_DEMO,
  monthly: semillaDe(PLAN_DEMO).monthly,
  yearly: semillaDe(PLAN_DEMO).yearly,
  minutos: semillaDe(PLAN_DEMO).minutos,
  cuentas: semillaDe(PLAN_DEMO).cuentas,
  asiento: semillaDe(PLAN_DEMO).asiento,
  capacidades: [...semillaDe(PLAN_DEMO).capacidades],
  visible: true,
  activo: true,
  featured: false,
}

/** Al cambiar la base de un plan nuevo, lo demás la sigue: es lo que «como Creador» quiere decir. */
export function borradorSobre(b: BorradorPlan, base: PricingPlanId): BorradorPlan {
  const semilla = semillaDe(base)
  return {
    ...b,
    base,
    monthly: semilla.monthly,
    yearly: semilla.yearly,
    minutos: semilla.minutos,
    cuentas: semilla.cuentas,
    asiento: semilla.asiento,
    capacidades: [...semilla.capacidades],
  }
}

export type CodigoAvisoPlan =
  | "nombreCorto"
  | "nombreRepetido"
  | "precioFuera"
  | "anualMayor"
  | "minutosFuera"
  | "cuentasFuera"
  | "asientoFuera"

export interface AvisoPlan {
  code: CodigoAvisoPlan
  bloquea: boolean
  values?: { min: number; max: number }
}

export type AvisosPlan = Partial<Record<keyof BorradorPlan, AvisoPlan>>

/**
 * Lo que impide guardar un plan. `otros` son los demás del catálogo: dos
 * planes con el mismo nombre serían indistinguibles en el selector del admin.
 */
export function validarPlan(
  b: BorradorPlan,
  otros: readonly PlanCatalogo[] = []
): AvisosPlan {
  const a: AvisosPlan = {}
  const L = LIMITES_PLAN
  const nombre = b.nombre.trim()
  if (b.origen === "creado") {
    if (nombre.length < L.nombreMin)
      a.nombre = {
        code: "nombreCorto",
        bloquea: true,
        values: { min: L.nombreMin, max: L.nombreMax },
      }
    else if (
      otros.some(
        (p) => p.id !== b.id && p.nombre?.trim().toLowerCase() === nombre.toLowerCase()
      )
    )
      a.nombre = { code: "nombreRepetido", bloquea: true }
  }
  const precioBueno = (n: number) => Number.isFinite(n) && n >= 0 && n <= L.precioMax
  if (!precioBueno(b.monthly))
    a.monthly = {
      code: "precioFuera",
      bloquea: true,
      values: { min: 0, max: L.precioMax },
    }
  if (!precioBueno(b.yearly))
    a.yearly = {
      code: "precioFuera",
      bloquea: true,
      values: { min: 0, max: L.precioMax },
    }
  // El anual es un descuento sobre el mensual: al revés nadie lo elegiría y la
  // tarjeta diría «antes 14,50» tachando el precio más barato
  else if (b.yearly > b.monthly) a.yearly = { code: "anualMayor", bloquea: true }
  if (!Number.isFinite(b.minutos) || b.minutos < L.minutosMin || b.minutos > L.minutosMax)
    a.minutos = {
      code: "minutosFuera",
      bloquea: true,
      values: { min: L.minutosMin, max: L.minutosMax },
    }
  if (!precioBueno(b.asiento))
    a.asiento = {
      code: "asientoFuera",
      bloquea: true,
      values: { min: 0, max: L.precioMax },
    }
  if (!Number.isFinite(b.cuentas) || b.cuentas < L.cuentasMin || b.cuentas > L.cuentasMax)
    a.cuentas = {
      code: "cuentasFuera",
      bloquea: true,
      values: { min: L.cuentasMin, max: L.cuentasMax },
    }
  return a
}

export const hayBloqueoPlan = (a: AvisosPlan) =>
  Object.values(a).some((x) => x?.bloquea === true)

export const nuevoIdPlan = (semilla: string) => `plan_${semilla}`

export function borradorDePlan(p: PlanCatalogo): BorradorPlan {
  return {
    id: p.id,
    origen: p.origen,
    nombre: p.nombre ?? "",
    lema: p.lema ?? "",
    base: p.base,
    monthly: p.monthly,
    yearly: p.yearly,
    minutos: p.minutos,
    cuentas: p.cuentas,
    asiento: p.asiento,
    capacidades: [...p.capacidades],
    visible: p.visible,
    activo: p.activo,
    featured: p.featured,
  }
}

/** Los precios van con dos decimales como mucho: 14.5 sí, 14.499 no. */
const redondear = (n: number) => Math.round(n * 100) / 100

/** Un plan creado, entero. Para una semilla se usa `parchePlan`. */
export function planDeBorrador(b: BorradorPlan, id: PlanId, orden: number): PlanCatalogo {
  return {
    id,
    origen: "creado",
    base: b.base,
    activo: b.activo,
    visible: b.visible,
    orden,
    monthly: redondear(b.monthly),
    yearly: redondear(b.yearly),
    minutos: Math.round(b.minutos),
    cuentas: Math.round(b.cuentas),
    asiento: redondear(b.asiento),
    capacidades: CAPACIDADES.filter((c) => b.capacidades.includes(c)),
    featured: b.featured,
    nombre: b.nombre.trim().slice(0, LIMITES_PLAN.nombreMax),
    lema: b.lema.trim().slice(0, LIMITES_PLAN.lemaMax) || undefined,
  }
}

/** Mover un plan un puesto. La misma lista si no hay sitio. */
export function moverPlan(
  planes: readonly PlanCatalogo[],
  id: PlanId,
  delta: -1 | 1
): PlanCatalogo[] {
  const lista = [...planes].sort((a, b) => a.orden - b.orden)
  const i = lista.findIndex((p) => p.id === id)
  const j = i + delta
  if (i === -1 || j < 0 || j >= lista.length) return [...planes]
  // Se renumeran todos: así dos planes nunca comparten orden tras un cambio
  const [movido] = lista.splice(i, 1)
  lista.splice(j, 0, movido)
  return lista.map((p, k) => ({ ...p, orden: k }))
}

/* ---------------------------------------------------------------------------
   Lo guardado se limpia al leer
   --------------------------------------------------------------------------- */

const esEscalon = (v: unknown): v is PricingPlanId =>
  typeof v === "string" && (PLAN_IDS as readonly string[]).includes(v)

const esCapacidad = (v: unknown): v is Capacidad =>
  typeof v === "string" && (CAPACIDADES as readonly string[]).includes(v)

const numeroEn = (v: unknown, min: number, max: number): number | undefined =>
  typeof v === "number" && Number.isFinite(v) && v >= min && v <= max ? v : undefined

function limpiarPlan(v: unknown): PlanCatalogo | null {
  if (!v || typeof v !== "object") return null
  const p = v as Partial<PlanCatalogo>
  if (typeof p.id !== "string" || !p.id.startsWith("plan_") || !esEscalon(p.base))
    return null
  if (typeof p.nombre !== "string" || p.nombre.trim().length < LIMITES_PLAN.nombreMin)
    return null
  const monthly = numeroEn(p.monthly, 0, LIMITES_PLAN.precioMax)
  const yearly = numeroEn(p.yearly, 0, LIMITES_PLAN.precioMax)
  const minutos = numeroEn(p.minutos, LIMITES_PLAN.minutosMin, LIMITES_PLAN.minutosMax)
  if (monthly === undefined || yearly === undefined || minutos === undefined) return null
  const capacidades = p.capacidades
  return {
    id: p.id,
    origen: "creado",
    base: p.base,
    activo: p.activo !== false,
    visible: p.visible !== false,
    orden: typeof p.orden === "number" && Number.isFinite(p.orden) ? p.orden : 100,
    monthly,
    yearly: Math.min(yearly, monthly),
    minutos: Math.round(minutos),
    // Un plan guardado antes de que existieran el asiento o las cuentas hereda los de su escalón
    asiento: numeroEn(p.asiento, 0, LIMITES_PLAN.precioMax) ?? semillaDe(p.base).asiento,
    cuentas:
      numeroEn(p.cuentas, LIMITES_PLAN.cuentasMin, LIMITES_PLAN.cuentasMax) ??
      semillaDe(p.base).cuentas,
    capacidades: Array.isArray(capacidades)
      ? CAPACIDADES.filter((c) => capacidades.includes(c))
      : capacidadesDe(p.base),
    featured: p.featured === true,
    nombre: p.nombre.trim().slice(0, LIMITES_PLAN.nombreMax),
    lema:
      typeof p.lema === "string" && p.lema.trim()
        ? p.lema.trim().slice(0, LIMITES_PLAN.lemaMax)
        : undefined,
  }
}

function limpiarParche(v: unknown): ParchePlan {
  if (!v || typeof v !== "object") return {}
  const p = v as ParchePlan
  const out: ParchePlan = {}
  if (typeof p.activo === "boolean") out.activo = p.activo
  if (typeof p.visible === "boolean") out.visible = p.visible
  if (typeof p.featured === "boolean") out.featured = p.featured
  if (typeof p.orden === "number" && Number.isFinite(p.orden)) out.orden = p.orden
  const monthly = numeroEn(p.monthly, 0, LIMITES_PLAN.precioMax)
  const yearly = numeroEn(p.yearly, 0, LIMITES_PLAN.precioMax)
  const minutos = numeroEn(p.minutos, LIMITES_PLAN.minutosMin, LIMITES_PLAN.minutosMax)
  if (monthly !== undefined) out.monthly = monthly
  if (yearly !== undefined) out.yearly = yearly
  if (minutos !== undefined) out.minutos = Math.round(minutos)
  const asiento = numeroEn(p.asiento, 0, LIMITES_PLAN.precioMax)
  if (asiento !== undefined) out.asiento = asiento
  const cuentas = numeroEn(p.cuentas, LIMITES_PLAN.cuentasMin, LIMITES_PLAN.cuentasMax)
  if (cuentas !== undefined) out.cuentas = Math.round(cuentas)
  if (Array.isArray(p.capacidades)) out.capacidades = p.capacidades.filter(esCapacidad)
  return out
}

export function migrarPlanes(guardado: unknown): PlanesGuardados {
  if (!guardado || typeof guardado !== "object") return PLANES_VACIO
  const g = guardado as Partial<PlanesGuardados>
  const creados = (Array.isArray(g.creados) ? g.creados : [])
    .map(limpiarPlan)
    .filter((p): p is PlanCatalogo => p !== null)
  const cambios: Record<string, ParchePlan> = {}
  for (const [id, parche] of Object.entries(g.cambios ?? {})) {
    if (!esEscalon(id)) continue
    cambios[id] = limpiarParche(parche)
  }
  return { version: PLANES_VERSION, creados, cambios }
}

/* ---------------------------------------------------------------------------
   Leerlo
   --------------------------------------------------------------------------- */

/**
 * El plan de una cuenta a partir de lo guardado. Un id que ya no está en el
 * catálogo, o un plan apagado, cae al de la demo: apagar un plan no puede
 * dejar a nadie sin plan.
 */
export function planDe(
  ref: PlanId | PlanCatalogo | null | undefined,
  catalogo: readonly PlanCatalogo[] = PLANES_SEMILLA
): PlanCatalogo {
  const id = typeof ref === "string" ? ref : ref?.id
  const encontrado = id ? catalogo.find((p) => p.id === id) : undefined
  if (encontrado?.activo) return encontrado
  return catalogo.find((p) => p.id === PLAN_DEMO && p.activo) ?? semillaDe(PLAN_DEMO)
}

/** Los que salen en /precios, en orden. */
export const planesVisibles = (catalogo: readonly PlanCatalogo[]) =>
  catalogo.filter((p) => p.activo && p.visible)

/** Los que se pueden asignar desde el backoffice: también los ocultos. */
export const planesAsignables = (catalogo: readonly PlanCatalogo[]) =>
  catalogo.filter((p) => p.activo)

/** Las redes que admite: las de su escalón. */
export const redesDe = (plan: PlanCatalogo): readonly SocialId[] =>
  NETWORKS_BY_PLAN[plan.base]

/**
 * Cuántos clips ve en Analíticas: los de su escalón. `null` es todos.
 *
 * Se hereda de la base y no se edita por plan, igual que las redes: son las
 * dos mitades del mismo límite, y partirlas dejaría planes que ven seis redes
 * y cinco clips, que no significa nada.
 */
export const clipsEnAnaliticas = (plan: PlanCatalogo): number | null =>
  CLIPS_ANALITICA_POR_PLAN[plan.base]

/** Los puntos de su tarjeta: los de su escalón. */
export const puntosDe = (plan: PlanCatalogo) => highlightKeys(plan.base)

/** Fila → capacidad, para escribir la celda desde el plan. */
const FILA_CAPACIDAD = Object.fromEntries(
  CAPACIDADES.map((c) => [CAPACIDAD_FILA[c], c])
) as Record<string, Capacidad | undefined>

/** La fila de la comparativa que anuncia el precio por asiento. */
export const FILA_ASIENTO = "teamMembers"
/** La fila que anuncia cuántas cuentas se conectan a la vez. */
export const FILA_CUENTAS = "connectedAccounts"
/** La fila que anuncia cuántos clips se miden. */
export const FILA_ANALITICAS = "clipAnalytics"

/**
 * La celda de una fila para un plan: lo que hereda de su escalón, salvo lo que
 * la app cobra de verdad, que se escribe desde sus capacidades. Formación no es
 * un sí/no: con la capacidad se ven todas las clases; sin ella, la ruta de
 * bienvenida.
 */
export function valorCelda(row: FeatureRow, plan: PlanCatalogo): FeatureValue {
  const capacidad = FILA_CAPACIDAD[row.id]
  if (capacidad === "clasesDePago")
    return { text: planPermite(plan, capacidad) ? "allClasses" : "freeClasses" }
  if (capacidad) return planPermite(plan, capacidad)
  // Con precio, «{seat} al mes por asiento»; a 0 en un escalón con equipo, los
  // miembros van incluidos; en un escalón sin equipo, nada que decir
  if (row.id === FILA_ASIENTO)
    return plan.asiento > 0 ? { text: "perSeat" } : row.values[plan.base] !== false
  if (row.id === FILA_CUENTAS) return String(plan.cuentas)
  // Con límite, la celda lo dice con su cifra; sin él, es un sí
  if (row.id === FILA_ANALITICAS)
    return clipsEnAnaliticas(plan) === null ? true : { text: "analyticsLimited" }
  return row.values[plan.base]
}

/* ---------------------------------------------------------------------------
   Conectar cuentas
   --------------------------------------------------------------------------- */

export type CodigoAvisoConexion = "redFueraDelPlan" | "cuentasAgotadas"

export interface AvisoConexion {
  code: CodigoAvisoConexion
  bloquea: boolean
  values?: { max: number }
}

/**
 * Lo que impide conectar una cuenta más en esa red. Las redes las da el
 * escalón (Prueba: solo TikTok); el cupo lo da el plan y se suma entre todas
 * las redes: seis en Creador son seis cuentas, sean de la red que sean.
 * `activas` son las cuentas vivas de quien conecta.
 */
export function validarConexion(
  plan: PlanCatalogo,
  red: SocialId,
  activas: readonly { network: SocialId }[]
): AvisoConexion[] {
  const avisos: AvisoConexion[] = []
  if (!redesDe(plan).includes(red))
    avisos.push({ code: "redFueraDelPlan", bloquea: true })
  if (activas.length >= plan.cuentas)
    avisos.push({ code: "cuentasAgotadas", bloquea: true, values: { max: plan.cuentas } })
  return avisos
}

export const hayBloqueoConexion = (a: AvisoConexion[]) => a.some((x) => x.bloquea)

/* ---------------------------------------------------------------------------
   Publicar en ellas
   --------------------------------------------------------------------------- */

/** Lo mínimo que hay que saber de una cuenta para saber si el plan la cubre. */
export interface CuentaDePlan {
  id: string
  network: SocialId
  connectedAt?: string
}

/**
 * Las cuentas en las que este plan puede publicar, en el orden en que se
 * conectaron y como mucho las que incluye.
 *
 * Hace falta porque el cupo solo se comprobaba al CONECTAR: quien baja de
 * Empresa a Creador se queda con veinte cuentas conectadas y un plan que paga
 * seis. Al publicar hay que volver a decidir, y la regla tiene que ser
 * previsible: las primeras que se conectaron. Desconectar siempre se puede, y
 * así quien baja de plan elige cuáles conserva sin que nadie se las borre.
 *
 * `activas` son las cuentas vivas de quien publica (`cuentaActiva`), ya
 * filtradas por dueño: las de la agencia no gastan el cupo del clipero.
 */
export function cuentasPublicables<T extends CuentaDePlan>(
  plan: PlanCatalogo,
  activas: readonly T[]
): T[] {
  const redes = redesDe(plan)
  return activas
    .filter((c) => redes.includes(c.network))
    .slice()
    .sort((a, b) => (a.connectedAt ?? "").localeCompare(b.connectedAt ?? ""))
    .slice(0, plan.cuentas)
}

export type CodigoAvisoPublicar =
  "sinCuentasElegidas" | "redFueraDelPlan" | "fueraDelCupo"

export interface AvisoPublicar {
  code: CodigoAvisoPublicar
  bloquea: boolean
  values?: { red?: SocialId; max?: number }
}

/**
 * Lo que impide publicar en las cuentas elegidas. Todos bloquean: publicar
 * donde el plan no llega no es un consejo que se pueda desoír, es algo que el
 * servidor va a rechazar de todas formas.
 */
export function validarPublicacion<T extends CuentaDePlan>(
  plan: PlanCatalogo,
  elegidas: readonly string[],
  activas: readonly T[]
): AvisoPublicar[] {
  const avisos: AvisoPublicar[] = []
  if (elegidas.length === 0) return [{ code: "sinCuentasElegidas", bloquea: true }]
  const redes = redesDe(plan)
  const publicables = new Set(cuentasPublicables(plan, activas).map((c) => c.id))
  for (const id of elegidas) {
    const cuenta = activas.find((c) => c.id === id)
    if (cuenta && !redes.includes(cuenta.network)) {
      avisos.push({
        code: "redFueraDelPlan",
        bloquea: true,
        values: { red: cuenta.network },
      })
      continue
    }
    if (!publicables.has(id))
      avisos.push({ code: "fueraDelCupo", bloquea: true, values: { max: plan.cuentas } })
  }
  return avisos
}

export const hayBloqueoPublicar = (a: AvisoPublicar[]) => a.some((x) => x.bloquea)

/**
 * El plan que cubre unos minutos al mes: el primero de los visibles que los
 * incluye. Si ninguno llega, el último (se amplía) con `cubre: false`.
 */
export function planParaMinutos(
  minutos: number,
  catalogo: readonly PlanCatalogo[] = PLANES_SEMILLA
): { plan: PlanCatalogo; cubre: boolean } {
  const visibles = planesVisibles(catalogo)
  const plan = visibles.find((p) => p.minutos >= minutos)
  if (plan) return { plan, cubre: true }
  return { plan: visibles[visibles.length - 1] ?? planDe(null, catalogo), cubre: false }
}

export interface ResumenPlanes {
  total: number
  visibles: number
  ocultos: number
  creados: number
  apagados: number
}

export function resumenPlanes(catalogo: readonly PlanCatalogo[]): ResumenPlanes {
  return {
    total: catalogo.length,
    visibles: catalogo.filter((p) => p.activo && p.visible).length,
    ocultos: catalogo.filter((p) => p.activo && !p.visible).length,
    creados: catalogo.filter((p) => p.origen === "creado").length,
    apagados: catalogo.filter((p) => !p.activo).length,
  }
}
