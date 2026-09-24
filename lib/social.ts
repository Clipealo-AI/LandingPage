import type { AspectRatioKey } from "@/lib/types"

/**
 * Redes de destino.
 *
 * No es solo una lista de logotipos: cada red impone un formato y una duración,
 * y eso es información que el producto necesita para proponer el recorte
 * correcto. Un clip de 90 s no entra en un Short; uno en 16:9 no funciona en
 * TikTok. Aquí vive esa tabla, y de aquí la leen el selector de formato, el
 * panel de publicación y la sección de la landing.
 */
export const SOCIAL_IDS = [
  "tiktok",
  "instagram",
  "youtube",
  "x",
  "linkedin",
  "facebook",
] as const

export type SocialId = (typeof SOCIAL_IDS)[number]

export interface SocialNetwork {
  id: SocialId
  name: string
  /**
   * Dónde aterriza el clip dentro de la red, en español.
   * @deprecated En la interfaz, ``t(`common.social.surface.${id}`)``.
   */
  surface: string
  /** Formato que la red premia. El primero es el recomendado. */
  aspects: AspectRatioKey[]
  /** Duración máxima admitida, en segundos. */
  maxSeconds: number
  /** Duración que mejor retiene según el propio producto. */
  sweetSpot: [number, number]
}

export const SOCIAL_NETWORKS: Record<SocialId, SocialNetwork> = {
  tiktok: {
    id: "tiktok",
    name: "TikTok",
    surface: "Para ti",
    aspects: ["9:16"],
    maxSeconds: 600,
    sweetSpot: [21, 60],
  },
  instagram: {
    id: "instagram",
    name: "Instagram",
    surface: "Reels",
    aspects: ["9:16", "4:5", "1:1"],
    maxSeconds: 180,
    sweetSpot: [15, 45],
  },
  youtube: {
    id: "youtube",
    name: "YouTube",
    surface: "Shorts y video",
    aspects: ["9:16", "16:9"],
    maxSeconds: 60,
    sweetSpot: [25, 55],
  },
  x: {
    id: "x",
    name: "X",
    surface: "Cronología",
    aspects: ["16:9", "1:1"],
    maxSeconds: 140,
    sweetSpot: [20, 60],
  },
  linkedin: {
    id: "linkedin",
    name: "LinkedIn",
    surface: "Feed profesional",
    aspects: ["1:1", "4:5", "16:9"],
    maxSeconds: 600,
    sweetSpot: [30, 90],
  },
  facebook: {
    id: "facebook",
    name: "Facebook",
    surface: "Reels y feed",
    aspects: ["9:16", "1:1"],
    maxSeconds: 90,
    sweetSpot: [15, 45],
  },
}

export const socialList = SOCIAL_IDS.map((id) => SOCIAL_NETWORKS[id])

/* ---------------------------------------------------------------------------
   Cuentas conectadas
   --------------------------------------------------------------------------- */

/**
 * En qué punto está la conexión. Hoy no hay OAuth: `caducada` y `revocada`
 * existen porque el calendario necesita distinguir «esta cuenta ya no está» de
 * «nunca la conectaste», y porque una entrada planificada sobre una cuenta que
 * se cayó tiene que poder decirlo. Etiquetas en la interfaz, nunca aquí.
 */
export const ESTADOS_CUENTA = ["conectada", "caducada", "revocada"] as const
export type EstadoCuenta = (typeof ESTADOS_CUENTA)[number]

/** Las dos caras del producto sobre los mismos datos. */
export const DUENOS_CUENTA = ["clipero", "agencia"] as const
export type DuenoCuenta = (typeof DUENOS_CUENTA)[number]

export interface SocialAccount {
  /**
   * Identifica la CUENTA, no la red: el plan Creador vende seis cuentas y el
   * de Empresa veinte, así que «TikTok» no basta para saber dónde se publica.
   */
  id: string
  network: SocialId
  /** Sin `handle` la red se considera no conectada. */
  handle?: string
  followers?: number
  connectedAt?: string
  /** Sin valor, `conectada`: las cuentas guardadas antes no lo traen. */
  estado?: EstadoCuenta
  /** Sin valor, `clipero`. */
  dueno?: DuenoCuenta
}

export const estadoCuenta = (c: Pick<SocialAccount, "estado">): EstadoCuenta =>
  c.estado ?? "conectada"

export const duenoCuenta = (c: Pick<SocialAccount, "dueno">): DuenoCuenta =>
  c.dueno ?? "clipero"

/** Se puede publicar en ella: tiene identidad y la conexión sigue viva. */
export const cuentaActiva = (c: SocialAccount) =>
  Boolean(c.handle) && estadoCuenta(c) === "conectada"

/**
 * Estado de demostración. Sustituir por la respuesta real de la API.
 *
 * Dos cuentas de TikTok a propósito: sin una segunda, el selector de cuenta del
 * calendario no tendría nada que enseñar y el `id` parecería decoración.
 */
export const socialAccounts: SocialAccount[] = [
  {
    id: "cta_tk_clipealo",
    network: "tiktok",
    handle: "@clipealo",
    followers: 48_200,
    connectedAt: "2026-07-14T10:00:00.000Z",
    estado: "conectada",
    dueno: "clipero",
  },
  {
    id: "cta_tk_ana",
    network: "tiktok",
    handle: "@cortes.ana",
    followers: 6_100,
    connectedAt: "2026-08-21T18:00:00.000Z",
    estado: "conectada",
    dueno: "clipero",
  },
  {
    id: "cta_yt_clipealo",
    network: "youtube",
    handle: "@clipealo",
    followers: 12_400,
    connectedAt: "2026-08-02T09:30:00.000Z",
    estado: "conectada",
    dueno: "clipero",
  },
  {
    id: "cta_ig_nebula",
    network: "instagram",
    handle: "@nebula.studio",
    followers: 31_500,
    connectedAt: "2026-06-30T12:00:00.000Z",
    estado: "conectada",
    dueno: "agencia",
  },
  {
    id: "cta_li_nebula",
    network: "linkedin",
    handle: "@agencia-nebula",
    followers: 4_800,
    connectedAt: "2026-07-02T08:00:00.000Z",
    estado: "conectada",
    dueno: "agencia",
  },
]

/** La cuenta con ese id, venga de donde venga. */
export const cuentaPorId = (id: string | undefined, cuentas = socialAccounts) =>
  id ? cuentas.find((c) => c.id === id) : undefined

/** Las cuentas de una de las dos caras. */
export const cuentasDe = (dueno: DuenoCuenta, cuentas = socialAccounts) =>
  cuentas.filter((c) => duenoCuenta(c) === dueno)

/** Las cuentas activas de una red, en el orden en que se conectaron. */
export const cuentasDeRed = (red: SocialId, cuentas = socialAccounts) =>
  cuentas.filter((c) => c.network === red && cuentaActiva(c))

/**
 * ¿Hay alguna cuenta viva en esa red? La firma no cambia: lo único nuevo es que
 * una cuenta caducada o revocada deja de contar, que es lo que ya significaba.
 */
export function isConnected(id: SocialId, accounts = socialAccounts) {
  return accounts.some((a) => a.network === id && cuentaActiva(a))
}

/** Redes en las que este clip cabe, por formato y duración. */
export function networksFor(aspect: AspectRatioKey, seconds: number) {
  return socialList.filter((n) => n.aspects.includes(aspect) && seconds <= n.maxSeconds)
}
