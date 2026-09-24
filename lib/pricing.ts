import { LOCALE_TAG, type Locale } from "@/i18n/routing"
import type { SocialId } from "@/lib/social"

/**
 * Catálogo comercial: los tres escalones de la web y su comparativa. Vive aquí
 * para que la sección de la landing, la página /precios y (mañana) el
 * checkout lean la misma tabla. Los planes que el backoffice crea encima de
 * estos tres —otro precio, otros minutos, otras capacidades— viven en
 * `lib/planes.ts` y heredan de aquí la comparativa de su escalón. Sigue la estructura de los líderes de la
 * categoría (Vizard): un Free que enseña el producto con marca de agua, un
 * Creador que quita límites al creador individual y un Empresa que añade
 * equipo, marca y API.
 *
 * Aquí solo hay cifras e ids: los textos (nombre, lema, botón, resumen,
 * comparativa y preguntas) viven en el espacio `pricing` de los mensajes,
 * indexados por esos ids. El orden de las listas lo fija este archivo.
 *
 * Precios en dólares: es la moneda en la que se comparan estas
 * herramientas. Cambiar la moneda es cambiar `MONEDA` y las cifras.
 */
export const MONEDA = "US$"
export const DESCUENTO_ANUAL_PCT = 50

export const PLAN_IDS = ["free", "creator", "business"] as const
export type PricingPlanId = (typeof PLAN_IDS)[number]

/**
 * Los planes de menos a más, para permisos. `PLAN_IDS` ya va en ese orden, pero
 * ese orden es de presentación (las tarjetas de /precios): el de los permisos se
 * escribe aparte para que reordenar la web no cambie quién puede hacer qué.
 *
 * Es un `Record` y no una lista con `indexOf`: así un plan nuevo sin orden no
 * compila, en vez de caer en silencio a −1 y quedar por debajo de Prueba.
 */
export const ORDEN_PLAN: Record<PricingPlanId, number> = {
  free: 0,
  creator: 1,
  business: 2,
}

/**
 * Lo que los permisos miran de un plan: en qué escalón está (`base`, uno de los
 * tres de la web) y qué desbloquea. Los tres planes de fábrica son su propio
 * escalón; un plan creado en el backoffice (`lib/planes.ts`) hereda el de su
 * base y elige capacidad a capacidad. Las puertas aceptan las dos cosas: el id
 * de un escalón, que es lo que llevan las clases y los tests, o el plan entero,
 * que es lo que tiene la cuenta.
 */
export interface PlanPermisos {
  base: PricingPlanId
  capacidades: readonly Capacidad[]
}

export type PlanRef = PricingPlanId | PlanPermisos

/** El escalón de un plan: el suyo si es de fábrica, el de su base si es creado. */
export const escalonDe = (plan: PlanRef): PricingPlanId =>
  typeof plan === "string" ? plan : plan.base

/** ¿Este plan llega al escalón pedido? El único comparador: nunca `plan !== "free"`. */
export const alMenos = (plan: PlanRef, minimo: PricingPlanId) =>
  ORDEN_PLAN[escalonDe(plan)] >= ORDEN_PLAN[minimo]

/**
 * Lo que se paga con el plan, y desde qué plan. La tabla es la fuente: el tipo
 * `Capacidad` sale de ella, así que añadir una capacidad es añadir una línea.
 *
 * Si esto cambia, cambia la comparativa de /precios, o la web promete una cosa
 * y la app hace otra:
 * - `programar` es la fila «scheduling».
 * - `participarCampanas` es la fila «participarCampanas».
 * - `clasesDePago` es la fila «training»; el plan de cada clase lo lleva la
 *   clase (`Leccion.planMinimo`), esto es solo el suelo del catálogo de pago.
 */
export const PLAN_MINIMO = {
  programar: "creator",
  participarCampanas: "creator",
  clasesDePago: "creator",
  /** Recortar y reducir tamaño: la fila «operaciones». */
  operaciones: "creator",
} as const satisfies Record<string, PricingPlanId>

export type Capacidad = keyof typeof PLAN_MINIMO

export const CAPACIDADES = Object.keys(PLAN_MINIMO) as readonly Capacidad[]

/**
 * La fila de la comparativa que anuncia cada capacidad. Es lo que ata las dos
 * mitades: la columna de un plan creado se escribe desde sus capacidades, y el
 * backoffice nombra cada capacidad con la etiqueta de su fila.
 */
export const CAPACIDAD_FILA = {
  programar: "scheduling",
  participarCampanas: "participarCampanas",
  clasesDePago: "training",
  operaciones: "operaciones",
} as const satisfies Record<Capacidad, string>

/** Un escalón de la web desbloquea lo que `PLAN_MINIMO` le concede; un plan creado, lo que diga su lista. */
export const planPermite = (plan: PlanRef, capacidad: Capacidad) =>
  typeof plan === "string"
    ? alMenos(plan, PLAN_MINIMO[capacidad])
    : plan.capacidades.includes(capacidad)

/** Las capacidades de un escalón, para heredarlas al crear un plan sobre él. */
export const capacidadesDe = (escalon: PricingPlanId): Capacidad[] =>
  CAPACIDADES.filter((c) => planPermite(escalon, c))

/** Programar publicaciones es del plan Creador en adelante. */
export const puedeProgramar = (plan: PlanRef) => planPermite(plan, "programar")

/** Recortar y reducir tamaño sin pasar por el análisis: del plan Creador en adelante. */
export const puedeOperar = (plan: PlanRef) => planPermite(plan, "operaciones")

/** Solicitar entrar en una campaña y subir el clip: del plan Creador en adelante. */
export const puedeParticipar = (plan: PlanRef) => planPermite(plan, "participarCampanas")

/**
 * Plan con el que arranca la demo. Es «creator» a propósito: la demo abre
 * enseñando el producto entero, y media docena de pruebas e2e cuentan con ello.
 * La experiencia Prueba se ve con el conmutador del menú de usuario, no
 * cambiando esta constante.
 */
export const PLAN_DEMO: PricingPlanId = "creator"

/** Un id de plan que viene de fuera (almacenamiento, URL) o el de la demo. */
export const planValido = (v: unknown): PricingPlanId =>
  (PLAN_IDS as readonly string[]).includes(v as string) ? (v as PricingPlanId) : PLAN_DEMO

/** Dónde guarda la demo el plan. Aquí y no en el hook: lo lee también el arranque. */
export const CLAVE_PLAN = "clipealo-plan-v1"

/*
 * Aquí vivía `SCRIPT_PLAN`, que dejaba el plan en `<html data-plan>` antes del
 * primer pintado «para que lo que se resuelve en CSS salga bien desde el primer
 * fotograma». No lo leía nadie: ni una regla de `globals.css`, ni una variante
 * `data-[plan=…]`, ni un componente. Todo el bloqueo por plan se resuelve en
 * React con `usePlan`, cuyo `getServerSnapshot` es `PLAN_DEMO`, así que el
 * parpadeo que decía evitar seguía ocurriendo igual y el script solo añadía
 * trabajo al arranque de cada página.
 *
 * Si alguna vez se quiere quitar ese parpadeo de verdad, el camino es resolver
 * el candado en CSS —y entonces el atributo vuelve, con su regla al lado—. En
 * producción, con el plan en la sesión, no hará falta ninguna de las dos cosas.
 */

/**
 * Cuentas sociales conectadas a la vez, sumando todas las redes: seis en
 * Creador pueden ser dos de TikTok, tres de Instagram y una de YouTube. Prueba
 * admite una, y solo de TikTok (`NETWORKS_BY_PLAN`).
 */
export const CUENTAS_POR_PLAN: Record<PricingPlanId, number> = {
  free: 1,
  creator: 6,
  business: 20,
}

/** Minutos de video al mes de cada plan: la cifra que leen el backoffice y la facturación. */
export const MINUTOS_INCLUIDOS: Record<PricingPlanId, number> = {
  free: 60,
  creator: 600,
  business: 600,
}

/** Nombre, lema y botón: `pricing.plans.<id>.name|tagline|cta`. */
export interface PricingPlan {
  id: PricingPlanId
  monthly: number
  /** Precio al mes con facturación anual. */
  yearly: number
  /** US$ al mes por cada miembro adicional del equipo. Solo los planes con espacio compartido. */
  asiento?: number
  featured?: boolean
}

export const PLANS: PricingPlan[] = [
  { id: "free", monthly: 0, yearly: 0 },
  { id: "creator", monthly: 29, yearly: 14.5, featured: true },
  // El asiento por debajo de Creador: sumar a alguien al equipo tiene que salir
  // más barato que darle su propia cuenta. Se edita en el catálogo del backoffice
  { id: "business", monthly: 39, yearly: 19.5, asiento: 15 },
]

/**
 * Resumen de cada tarjeta, en orden: `pricing.plans.<id>.highlights.<clave>`.
 * El detalle completo está en FEATURE_GROUPS.
 */
export const PLAN_HIGHLIGHTS = {
  free: [
    "minutes",
    "videoLimits",
    "aiClips",
    "export",
    "accounts",
    "storage",
    "watermark",
  ],
  creator: [
    "minutes",
    "videoLimits",
    "export",
    "noWatermark",
    "captions",
    "reframe",
    "accounts",
    "storage",
  ],
  business: [
    "everythingInCreator",
    "sharedWorkspace",
    "seats",
    "accounts",
    "brandKit",
    "storage",
    "api",
  ],
} as const satisfies Record<PricingPlanId, readonly string[]>

/** Clave completa de un punto del resumen, relativa al espacio `pricing`. */
export type PlanHighlightKey = {
  [P in PricingPlanId]: `plans.${P}.highlights.${(typeof PLAN_HIGHLIGHTS)[P][number]}`
}[PricingPlanId]

/** Claves del resumen de un plan, en orden: `t(clave)` con `useTranslations("pricing")`. */
export function highlightKeys(id: PricingPlanId): PlanHighlightKey[] {
  return PLAN_HIGHLIGHTS[id].map(
    (clave) => `plans.${id}.highlights.${clave}` as PlanHighlightKey
  )
}

/**
 * Cifra de un precio en el idioma, sin moneda: 14.5 -> "14,50" · "14.50"; 29 -> "29".
 * La moneda y su posición las pone el mensaje `pricing.price`.
 */
export function precio(n: number, locale: Locale = "es") {
  const decimales = Number.isInteger(n) ? 0 : 2
  return new Intl.NumberFormat(LOCALE_TAG[locale], {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
    useGrouping: false,
  }).format(n)
}

/** Textos de celda traducibles: `pricing.values.<id>`. */
export type FeatureTextId =
  | "minutes"
  | "minutesExpandable"
  | "accounts"
  | "nineLanguages"
  | "unlimitedClips"
  | "onlyTiktok"
  | "allSix"
  | "threeDays"
  | "unlimited"
  | "private"
  | "shared"
  | "perSeat"
  | "analyticsLimited"
  | "basic"
  | "all"
  | "limited"
  | "highLimits"
  | "community"
  | "email"
  | "priority"
  | "freeClasses"
  | "allClasses"

/**
 * Valor de una celda de la comparativa: sí/no, una cifra que se lee igual en
 * los tres idiomas («600 min», «4K», «9:16») o un texto traducible. Los textos
 * reciben `{minutes}` (minutos del plan de su columna), `{accounts}` (cuentas
 * conectadas) y `{seat}` (su precio por asiento, ya con moneda); los que no los
 * usan los ignoran.
 */
export type FeatureValue = boolean | string | { text: FeatureTextId }

export interface FeatureRow {
  /** Etiqueta: `pricing.features.<id>`; aclaración, si la hay: `pricing.featureHints.<id>`. */
  id: string
  values: Record<PricingPlanId, FeatureValue>
}

export interface FeatureGroup {
  /** Título: `pricing.groups.<id>`. */
  id: string
  rows: readonly FeatureRow[]
}

export const FEATURE_GROUPS = [
  {
    id: "creditos",
    rows: [
      // La cifra la pone cada plan (`minutos`): así un plan creado con 1.200
      // minutos, o un escalón al que se le cambian, lo dicen en su columna
      {
        id: "minutesPerMonth",
        values: {
          free: { text: "minutes" },
          creator: { text: "minutes" },
          business: { text: "minutesExpandable" },
        },
      },
      {
        id: "maxDuration",
        values: { free: "60 min", creator: "600 min", business: "600 min" },
      },
      {
        id: "maxFileSize",
        values: { free: "1 GB", creator: "30 GB", business: "30 GB" },
      },
      { id: "videoLinks", values: { free: true, creator: true, business: true } },
      { id: "liveStreams", values: { free: false, creator: true, business: true } },
    ],
  },
  {
    id: "ia",
    rows: [
      { id: "aiClips", values: { free: true, creator: true, business: true } },
      { id: "transcript", values: { free: true, creator: true, business: true } },
      { id: "autoCaptions", values: { free: false, creator: true, business: true } },
      {
        id: "captionTranslation",
        values: {
          free: false,
          creator: { text: "nineLanguages" },
          business: { text: "nineLanguages" },
        },
      },
      { id: "autoReframe", values: { free: false, creator: true, business: true } },
      { id: "nameDictionary", values: { free: false, creator: true, business: true } },
    ],
  },
  {
    id: "exportacion",
    rows: [
      { id: "exportQuality", values: { free: "720p", creator: "4K", business: "4K" } },
      {
        id: "formats",
        values: {
          free: "9:16",
          creator: "9:16 · 4:5 · 1:1 · 16:9",
          business: "9:16 · 4:5 · 1:1 · 16:9",
        },
      },
      {
        id: "clipsPerProject",
        values: {
          free: "10",
          creator: { text: "unlimitedClips" },
          business: { text: "unlimitedClips" },
        },
      },
      { id: "noWatermark", values: { free: false, creator: true, business: true } },
      // Se bloquea en la app (`puedeOperar`): si no estuviera aquí, /precios
      // callaría algo que el producto cobra
      { id: "operaciones", values: { free: false, creator: true, business: true } },
    ],
  },
  {
    id: "publicacion",
    rows: [
      // La cifra la pone cada plan (`cuentas`), sumando todas las redes
      {
        id: "connectedAccounts",
        values: {
          free: { text: "accounts" },
          creator: { text: "accounts" },
          business: { text: "accounts" },
        },
      },
      {
        id: "networks",
        values: {
          free: { text: "onlyTiktok" },
          creator: { text: "allSix" },
          business: { text: "allSix" },
        },
      },
      /* Publicar en las cuentas conectadas es de TODOS los planes, también de
         Prueba: con una sola cuenta de TikTok, pero de verdad. Sin esta fila
         /precios callaría lo que el producto hace, y la cuenta conectada de
         Prueba no serviría para nada. Programar sigue siendo de Creador: es
         lo que se cobra. */
      { id: "directPublish", values: { free: true, creator: true, business: true } },
      { id: "scheduling", values: { free: false, creator: true, business: true } },
      /* Prueba SÍ tiene analíticas, con límite: la cifra la escribe cada plan
         (`valorCelda`), como las cuentas. Decir «no» aquí era mentir desde que
         la app se las enseña */
      {
        id: "clipAnalytics",
        values: { free: { text: "analyticsLimited" }, creator: true, business: true },
      },
    ],
  },
  {
    /* El lado de «ganar» del producto, el mismo que agrupa la barra lateral
       (Campañas, Formación, Wallet). Se anuncia aquí porque se bloquea en la
       app: dejar fuera de las campañas a un plan del que la web no dice nada
       sería que /precios prometa una cosa y el producto haga otra. */
    id: "ganar",
    rows: [
      {
        id: "participarCampanas",
        values: { free: false, creator: true, business: true },
      },
      {
        id: "training",
        values: {
          free: { text: "freeClasses" },
          creator: { text: "allClasses" },
          business: { text: "allClasses" },
        },
      },
    ],
  },
  {
    id: "equipo",
    rows: [
      {
        id: "storage",
        values: {
          free: { text: "threeDays" },
          creator: "100 GB",
          business: { text: "unlimited" },
        },
      },
      {
        id: "workspace",
        values: {
          free: { text: "private" },
          creator: { text: "private" },
          business: { text: "shared" },
        },
      },
      {
        id: "teamMembers",
        values: { free: false, creator: false, business: { text: "perSeat" } },
      },
      { id: "roles", values: { free: false, creator: false, business: true } },
    ],
  },
  {
    id: "marca",
    rows: [
      {
        id: "captionTemplates",
        values: {
          free: { text: "basic" },
          creator: { text: "all" },
          business: { text: "all" },
        },
      },
      { id: "brandKit", values: { free: false, creator: false, business: true } },
      { id: "teamTemplates", values: { free: false, creator: false, business: true } },
    ],
  },
  {
    id: "api",
    rows: [
      {
        id: "api",
        values: {
          free: { text: "limited" },
          creator: { text: "limited" },
          business: { text: "highLimits" },
        },
      },
      { id: "webhooks", values: { free: false, creator: false, business: true } },
      {
        id: "support",
        values: {
          free: { text: "community" },
          creator: { text: "email" },
          business: { text: "priority" },
        },
      },
    ],
  },
] as const satisfies readonly FeatureGroup[]

export type FeatureGroupId = (typeof FEATURE_GROUPS)[number]["id"]
export type FeatureRowId = (typeof FEATURE_GROUPS)[number]["rows"][number]["id"]

/** Filas con aclaración bajo la etiqueta. */
const FEATURE_HINTS = [
  "minutesPerMonth",
  "autoReframe",
  "networks",
  "directPublish",
  "scheduling",
] as const satisfies readonly FeatureRowId[]
export type FeatureHintId = (typeof FEATURE_HINTS)[number]

export function hasHint(id: FeatureRowId): id is FeatureHintId {
  return (FEATURE_HINTS as readonly string[]).includes(id)
}

/**
 * Cuántos clips ve en Analíticas cada escalón, contando desde el más reciente.
 * `null` es todos.
 *
 * Prueba ve los cinco últimos y solo en TikTok, que es la única red que puede
 * conectar: enseñarle un panel entero de cifras que no puede conseguir sería
 * vender el plan de arriba con los datos del de abajo. No se esconde nada: la
 * página dice cuántos ve y de dónde salen los demás.
 */
export const CLIPS_ANALITICA_POR_PLAN: Record<PricingPlanId, number | null> = {
  free: 5,
  creator: null,
  business: null,
}

/** Redes que puede conectar cada plan: solo TikTok en Prueba; las seis en Creador y Empresa. */
export const NETWORKS_BY_PLAN: Record<PricingPlanId, SocialId[]> = {
  free: ["tiktok"],
  creator: ["tiktok", "instagram", "youtube", "x", "linkedin", "facebook"],
  business: ["tiktok", "instagram", "youtube", "x", "linkedin", "facebook"],
}

/** Preguntas de facturación de /precios, en orden: `pricing.faq.<id>.q|a`. */
export const PRICING_FAQ = [
  "credit",
  "outOfCredits",
  "changePlan",
  "annualBilling",
  "cancelRefund",
  "currencyTaxes",
  "teamSeats",
  "afterCancel",
] as const

export type PricingFaqId = (typeof PRICING_FAQ)[number]
