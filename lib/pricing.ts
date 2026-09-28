import { LOCALE_TAG, type Locale } from "@/i18n/routing"

/** Divisas que ofrece el catálogo de precios público. */
export const PRICING_CURRENCIES = ["PEN", "USD"] as const
export type PricingCurrency = (typeof PRICING_CURRENCIES)[number]
/** Divisa de respaldo para formateadores del resto de la aplicación. */
export const MONEDA = "US$"

export function formatPrecio(amount: number, currency: PricingCurrency, locale: Locale) {
  const fractionDigits = Number.isInteger(amount) ? 0 : Number.isInteger(amount * 2) ? 1 : 2
  const value = new Intl.NumberFormat(LOCALE_TAG[locale], {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: 2,
  }).format(amount)
  if (currency === "PEN") return `S/${value}`
  if (locale === "pt") return `US$ ${value}`
  return `US$${value}`
}

/** Descuento que aplica al precio base con facturación anual. */
export const DESCUENTO_ANUAL_PCT = 20

export type PricingPlanId = "free" | "basic" | "standard" | "premium"
type Prices = Record<PricingCurrency, number>

export interface PricingPlan {
  id: PricingPlanId
  monthly: Prices
  yearly: Prices
  /** Minutos de vídeo incluidos por mes en la BD. */
  includedMinutes: number
  featured?: boolean
}

/**
 * Soles según plans.monthly_price / plans.yearly_price (el anual se muestra por mes).
 * USD fijados con la venta SBS de S/3,425 por US$1 (25/09/2026),
 * redondeados al múltiplo de US$0,50 más cercano.
 */
export const PLANS: readonly PricingPlan[] = [
  {
    id: "free",
    monthly: { PEN: 0, USD: 0 },
    yearly: { PEN: 0, USD: 0 },
    includedMinutes: 30,
  },
  {
    id: "basic",
    monthly: { PEN: 45, USD: 13 },
    yearly: { PEN: 36, USD: 10.5 },
    includedMinutes: 300,
  },
  {
    id: "standard",
    monthly: { PEN: 90, USD: 26.5 },
    yearly: { PEN: 72, USD: 21 },
    includedMinutes: 600,
    featured: true,
  },
  {
    id: "premium",
    monthly: { PEN: 180, USD: 52.5 },
    yearly: { PEN: 144, USD: 42 },
    includedMinutes: 1200,
  },
]

export function planPrice(plan: PricingPlan, yearly: boolean, currency: PricingCurrency) {
  return (yearly ? plan.yearly : plan.monthly)[currency]
}

/** Tarifas públicas fijas por hora extra. */
export const EXTRA_HOUR_PRICE_PEN = 5
export const EXTRA_HOUR_PRICE_USD = 1.5
/** Límites del checkout de recargas: horas enteras de 1 a 100. */
export const EXTRA_HOUR_MIN = 1
export const EXTRA_HOUR_MAX = 100

/** Resumen visible de cada plan, en el orden de sus diferencias principales. */
export const CARD_HIGHLIGHTS = {
  free: ["time", "export", "storage", "watermark", "youtubeLocal"],
  basic: ["time", "export", "noWatermark", "storage", "social", "youtubeKickTwitchLocal"],
  standard: ["previous", "time", "storage", "facebook"],
  premium: ["previous", "time", "export", "storage", "driveZoom"],
} as const satisfies Record<PricingPlanId, readonly string[]>

export type VideoSourceId = "youtube" | "kick" | "twitch" | "facebook" | "drive" | "zoom"

/** Orígenes que devuelve plans.available_platforms en la BD actual. */
const VIDEO_SOURCES_BY_PLAN: Record<PricingPlanId, readonly VideoSourceId[]> = {
  free: ["youtube"],
  basic: ["youtube", "kick", "twitch"],
  standard: ["youtube", "kick", "twitch", "facebook"],
  premium: ["youtube", "kick", "twitch", "facebook", "drive", "zoom"],
}

type FeatureValueTextId =
  "unlimited" | "tiktokOnly" | "allNetworks" | `storage.${PricingPlanId}`

export type FeatureValue =
  | boolean
  | number
  | string
  | { text: FeatureValueTextId }
  | { sources: readonly VideoSourceId[] }

interface FeatureRow {
  id: string
  values: Record<PricingPlanId, FeatureValue>
}

export interface FeatureGroup {
  id: string
  rows: readonly FeatureRow[]
}

/** Datos base de la comparativa completa de /precios. */
export const FEATURE_GROUPS = [
  {
    id: "ia",
    rows: [
      {
        id: "videoHours",
        values: { free: "30 min", basic: "5 h", standard: "10 h", premium: "20 h" },
      },
      {
        id: "videoSources",
        values: {
          free: { sources: VIDEO_SOURCES_BY_PLAN.free },
          basic: { sources: VIDEO_SOURCES_BY_PLAN.basic },
          standard: { sources: VIDEO_SOURCES_BY_PLAN.standard },
          premium: { sources: VIDEO_SOURCES_BY_PLAN.premium },
        },
      },
    ],
  },
  {
    id: "editor",
    rows: [
      {
        id: "noWatermark",
        values: { free: false, basic: true, standard: true, premium: true },
      },
      {
        id: "downloadQuality",
        values: {
          free: "720p",
          basic: "1080p",
          standard: "1080p",
          premium: "4K",
        },
      },
      {
        id: "storage",
        values: {
          free: { text: "storage.free" },
          basic: { text: "storage.basic" },
          standard: { text: "storage.standard" },
          premium: { text: "storage.premium" },
        },
      },
      {
        id: "exportFormats",
        values: {
          free: "9:16 · 16:9",
          basic: "9:16 · 16:9",
          standard: "9:16 · 16:9",
          premium: "9:16 · 16:9",
        },
      },
      {
        id: "brandTemplate",
        values: { free: false, basic: false, standard: true, premium: true },
      },
    ],
  },
  {
    id: "social",
    rows: [
      {
        id: "monthlyPosts",
        values: {
          free: "3",
          basic: "15",
          standard: "50",
          premium: { text: "unlimited" },
        },
      },
      {
        id: "publishNetworks",
        values: {
          free: { text: "tiktokOnly" },
          basic: { text: "allNetworks" },
          standard: { text: "allNetworks" },
          premium: { text: "allNetworks" },
        },
      },
      {
        id: "scheduling",
        values: { free: false, basic: false, standard: true, premium: true },
      },
      {
        id: "audienceByNetwork",
        values: { free: false, basic: false, standard: true, premium: true },
      },
    ],
  },
  {
    id: "support",
    rows: [
      {
        id: "discord",
        values: { free: true, basic: true, standard: true, premium: true },
      },
      {
        id: "whatsappSupport",
        values: { free: false, basic: true, standard: true, premium: true },
      },
      {
        id: "priorityWhatsapp",
        values: { free: false, basic: false, standard: false, premium: true },
      },
    ],
  },
] as const satisfies readonly FeatureGroup[]

export const PRICING_FAQ = [
  "includedTime",
  "extraHours",
  "annualBilling",
  "cancel",
  "currencies",
] as const
