import type { SocialId } from "@/lib/social"
import { LOCALE_TAG, type Locale } from "@/i18n/routing"

/** Divisas que ofrece el catálogo de precios público. */
export const PRICING_CURRENCIES = ["PEN", "USD"] as const
export type PricingCurrency = (typeof PRICING_CURRENCIES)[number]
/** Divisa de respaldo para formateadores del resto de la aplicación. */
export const MONEDA = "US$"

export function formatPrecio(amount: number, currency: PricingCurrency, locale: Locale) {
  const fractionDigits = Number.isInteger(amount) ? 0 : 2
  const value = new Intl.NumberFormat(LOCALE_TAG[locale], {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: 2,
  }).format(amount)
  if (currency === "PEN") return `S/${value}`
  if (locale === "es") return `${value} US$`
  if (locale === "pt") return `US$ ${value}`
  return `US$${value}`
}

/** Descuento que aplica al precio base con facturación anual. */
export const DESCUENTO_ANUAL_PCT = 20

const PLAN_IDS = ["free", "basic", "standard", "premium"] as const
export type PricingPlanId = (typeof PLAN_IDS)[number]
type Prices = Record<PricingCurrency, number>

export interface PricingPlan {
  id: PricingPlanId
  monthly: Prices
  yearly: Prices
  /** Créditos incluidos al mes en el nivel inicial del plan. */
  includedCredits: number
  /** Opciones de créditos mensuales disponibles en el selector de la tarjeta. */
  creditOptions: readonly number[]
  /** Precio mensual de cada 100 créditos adicionales. No recibe el descuento anual. */
  addonPer100: Prices
  featured?: boolean
}

const creditStepsFrom = (base: number, second: number, count: number) => [
  base,
  second,
  ...Array.from({ length: count }, (_, index) => second + 400 * (index + 1)),
]

/**
 * Catálogo público verificado en dev. Los precios anuales muestran su
 * equivalente mensual; el pago se factura por año. Los créditos extra se
 * cobran al precio mensual publicado, incluso en el ciclo anual.
 */
export const PLANS: readonly PricingPlan[] = [
  {
    id: "free",
    monthly: { PEN: 0, USD: 0 },
    yearly: { PEN: 0, USD: 0 },
    includedCredits: 30,
    creditOptions: [30],
    addonPer100: { PEN: 9, USD: 2.5 },
  },
  {
    id: "basic",
    monthly: { PEN: 45, USD: 12.5 },
    yearly: { PEN: 36, USD: 10 },
    includedCredits: 300,
    creditOptions: creditStepsFrom(300, 400, 14),
    addonPer100: { PEN: 9, USD: 2.5 },
  },
  {
    id: "standard",
    monthly: { PEN: 90, USD: 25 },
    yearly: { PEN: 72, USD: 20 },
    includedCredits: 600,
    creditOptions: creditStepsFrom(600, 800, 13),
    addonPer100: { PEN: 9, USD: 2.5 },
    featured: true,
  },
  {
    id: "premium",
    monthly: { PEN: 180, USD: 50 },
    yearly: { PEN: 144, USD: 40 },
    includedCredits: 1_200,
    creditOptions: [
      1_200,
      ...Array.from({ length: 12 }, (_, index) => 1_600 + 400 * index),
    ],
    addonPer100: { PEN: 9, USD: 2.5 },
  },
]

export function planPrice(
  plan: PricingPlan,
  credits: number,
  yearly: boolean,
  currency: PricingCurrency
) {
  const base = (yearly ? plan.yearly : plan.monthly)[currency]
  const extraHundreds = Math.max(0, credits - plan.includedCredits) / 100
  return base + extraHundreds * plan.addonPer100[currency]
}

export const CREDIT_PACKS = [
  { id: "hour", credits: 60, hours: 1, PEN: 5.5, USD: 1.5 },
  { id: "threeHours", credits: 180, hours: 3, PEN: 16.5, USD: 4.6 },
  { id: "fiveHours", credits: 300, hours: 5, PEN: 27.5, USD: 7.65, popular: true },
] as const

export const CARD_SECTIONS = ["vod", "editor", "social", "analytics"] as const
export type CardSectionId = (typeof CARD_SECTIONS)[number]
export type CardFeatureId =
  | "process30"
  | "youtube"
  | "process5h"
  | "process10h"
  | "process20h"
  | "manualUpload"
  | "zoomRecordings"
  | "quality720"
  | "quality1080"
  | "quality4k"
  | "clips5"
  | "clips30"
  | "clips100"
  | "clipsUnlimited"
  | "watermark"
  | "noWatermark"
  | "storage500"
  | "storage5gb30d"
  | "storage20gb90d"
  | "storage100gb90d"
  | "brandKit"
  | "posts3"
  | "posts15"
  | "posts50Schedule"
  | "postsUnlimitedSchedule"
  | "tiktokOnly"
  | "allNetworks"
  | "audienceByNetwork"
  | "tiktokAnalytics"

export const CARD_FEATURES: Record<
  PricingPlanId,
  Partial<Record<CardSectionId, readonly CardFeatureId[]>>
> = {
  free: {
    vod: ["process30", "youtube"],
    editor: ["quality720", "clips5", "watermark", "storage500"],
    social: ["posts3", "tiktokOnly"],
  },
  basic: {
    vod: ["process5h", "manualUpload"],
    editor: ["quality1080", "clips30", "noWatermark", "storage5gb30d"],
    social: ["posts15", "allNetworks"],
  },
  standard: {
    vod: ["process10h", "manualUpload"],
    editor: ["quality1080", "clips100", "noWatermark", "brandKit", "storage20gb90d"],
    social: ["posts50Schedule", "audienceByNetwork"],
    analytics: ["tiktokAnalytics"],
  },
  premium: {
    vod: ["process20h", "zoomRecordings", "manualUpload"],
    editor: ["quality4k", "clipsUnlimited", "noWatermark", "brandKit", "storage100gb90d"],
    social: ["postsUnlimitedSchedule", "audienceByNetwork"],
    analytics: ["tiktokAnalytics"],
  },
}

/** La publicación en redes comparte límites con el catálogo actual de dev. */
export const NETWORKS_BY_PLAN: Record<PricingPlanId, SocialId[]> = {
  free: ["tiktok"],
  basic: ["tiktok", "instagram", "youtube", "x", "linkedin", "facebook"],
  standard: ["tiktok", "instagram", "youtube", "x", "linkedin", "facebook"],
  premium: ["tiktok", "instagram", "youtube", "x", "linkedin", "facebook"],
}

type FeatureValueTextId =
  | "unlimited"
  | "tiktokOnly"
  | "allNetworks"
  | `storage.${PricingPlanId}`
  | `videoSources.${PricingPlanId}`

export type FeatureValue = boolean | number | string | { text: FeatureValueTextId }

export interface FeatureRow {
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
        id: "monthlyCredits",
        values: { free: 30, basic: 300, standard: 600, premium: 1_200 },
      },
      {
        id: "videoHours",
        values: { free: "30 min", basic: "5 h", standard: "10 h", premium: "20 h" },
      },
      {
        id: "videoSources",
        values: {
          free: { text: "videoSources.free" },
          basic: { text: "videoSources.basic" },
          standard: { text: "videoSources.standard" },
          premium: { text: "videoSources.premium" },
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
          premium: "1080p + 4K",
        },
      },
      {
        id: "downloadableClips",
        values: {
          free: "5",
          basic: "30",
          standard: "100",
          premium: { text: "unlimited" },
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
          free: "9:16",
          basic: "9:16",
          standard: "9:16",
          premium: "9:16",
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

type FeatureGroupId = (typeof FEATURE_GROUPS)[number]["id"]
type FeatureRowId = (typeof FEATURE_GROUPS)[number]["rows"][number]["id"]

export const ENTERPRISE_INCLUDED = [
  "everythingPremium",
  "creditsByVolume",
  "multiUserChannels",
  "multiBranding",
  "processingSla",
  "dedicatedClipper",
] as const

export const ENTERPRISE_EXTRAS = ["approvalFlow", "whiteLabel", "creditPackages"] as const

export const PRICING_FAQ = [
  "credit",
  "adjustCredits",
  "annualBilling",
  "cancel",
  "currencies",
  "creditPacks",
] as const

type PricingFaqId = (typeof PRICING_FAQ)[number]
