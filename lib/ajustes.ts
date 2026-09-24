import type { CountryCode } from "@/lib/countries"
import type { PricingPlanId } from "@/lib/pricing"
import { ZONA_POR_DEFECTO, type Zona } from "@/lib/fechas"

/**
 * Ajustes de la cuenta: secciones, catálogos de opciones y los valores de demo.
 *
 * Las secciones y las opciones del perfil (nombre del canal como marca de agua,
 * plataformas donde transmite, país) salen de la app actual de Clipealo. Las de
 * Público y Notificaciones son del producto nuevo: la app actual solo enseña el
 * nombre de esas pestañas.
 *
 * Aquí solo hay ids y valores: las etiquetas viven en `messages/<idioma>/settings.json`
 * y cada componente las traduce.
 */

export const SECCIONES_AJUSTES = [
  "perfil",
  "publico",
  "cuentas",
  "notificaciones",
  // Tus datos (§6.8 del onboarding): resumen, permisos, historial y borrado
  "datos",
  "facturacion",
] as const
export type SeccionAjustes = (typeof SECCIONES_AJUSTES)[number]

/* ---------------------------------------------------------------------------
   Perfil
   --------------------------------------------------------------------------- */

/** De dónde sale el video del creador. No son las redes de publicación. */
export const PLATAFORMAS_DIRECTO = [
  "twitch",
  "youtube",
  "kick",
  "tiktok",
  "facebook",
] as const
export type PlataformaDirecto = (typeof PLATAFORMAS_DIRECTO)[number]

export const PLATAFORMA_LABEL: Record<PlataformaDirecto, string> = {
  twitch: "Twitch",
  youtube: "YouTube",
  kick: "Kick",
  tiktok: "TikTok",
  facebook: "Facebook",
}

export interface PerfilCanal {
  /** Sin la arroba: se añade al pintarlo. */
  canal: string
  /** URL de la foto; `null` enseña las iniciales. */
  avatarUrl: string | null
  plataformas: PlataformaDirecto[]
  pais: CountryCode
  /**
   * Zona horaria IANA con la que se programan y se leen las publicaciones del
   * Calendario. No es la del navegador de quien mira: si alguien abre la agenda
   * desde otro país, las horas siguen siendo las de su zona y la pantalla lo dice.
   */
  zona: Zona
}

export const perfilInicial: PerfilCanal = {
  canal: "clipealo",
  avatarUrl: null,
  plataformas: ["youtube", "tiktok"],
  pais: "PE",
  zona: ZONA_POR_DEFECTO,
}

/** Como en TikTok e Instagram: letras, números, punto y guion bajo. */
export const CANAL_MIN = 3
export const CANAL_MAX = 30

/** Motivo por el que no vale un nombre de canal; el texto está en `settings.profile.channel.errors`. */
export type ErrorCanal =
  | { code: "tooShort"; values: { min: number } }
  | { code: "tooLong"; values: { max: number } }
  | { code: "invalidChars"; values?: undefined }

export function validarCanal(canal: string): ErrorCanal | null {
  const limpio = canal.trim()
  if (limpio.length < CANAL_MIN) return { code: "tooShort", values: { min: CANAL_MIN } }
  if (limpio.length > CANAL_MAX) return { code: "tooLong", values: { max: CANAL_MAX } }
  if (!/^[a-zA-Z0-9._]+$/.test(limpio)) return { code: "invalidChars" }
  return null
}

export const AVATAR_TIPOS = ["image/png", "image/jpeg", "image/webp"]
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024

/* ---------------------------------------------------------------------------
   Público
   --------------------------------------------------------------------------- */

export const TEMAS = [
  "gaming",
  "podcast",
  "educacion",
  "humor",
  "deportes",
  "musica",
  "negocios",
  "tecnologia",
  "estilo",
  "actualidad",
] as const
export type Tema = (typeof TEMAS)[number]
export const TEMAS_MAX = 3

export const EDADES = ["13–17", "18–24", "25–34", "35–44", "45+"] as const
export type Edad = (typeof EDADES)[number]

/**
 * Los nueve idiomas de subtítulos de los planes de pago (`lib/pricing.ts`), en
 * código ISO 639-1. Es el idioma del público, no el de la interfaz: el nombre se
 * pinta con `Intl.DisplayNames` en el idioma activo.
 */
export const IDIOMAS_AUDIENCIA = [
  "es",
  "en",
  "pt",
  "fr",
  "it",
  "de",
  "ca",
  "eu",
  "gl",
] as const
export type IdiomaAudiencia = (typeof IDIOMAS_AUDIENCIA)[number]

export const TONOS = ["cercano", "divertido", "profesional", "directo"] as const
export type Tono = (typeof TONOS)[number]

export interface PublicoCanal {
  temas: Tema[]
  edades: Edad[]
  idioma: IdiomaAudiencia
  tono: Tono
  ocultarPalabrotas: boolean
}

export const publicoInicial: PublicoCanal = {
  temas: ["podcast", "negocios"],
  edades: ["18–24", "25–34"],
  idioma: "es",
  tono: "cercano",
  ocultarPalabrotas: false,
}

/* ---------------------------------------------------------------------------
   Notificaciones
   --------------------------------------------------------------------------- */

export const CANALES_AVISO = ["correo", "app"] as const
export type CanalAviso = (typeof CANALES_AVISO)[number]

export type TipoAvisoId =
  | "clips-listos"
  | "errores"
  | "publicaciones"
  | "minutos"
  | "resumen"
  | "pagos"
  | "novedades"

/** Título y descripción de cada aviso: `settings.notifications.types.<id>`. */
export interface TipoAviso {
  id: TipoAvisoId
  /** Valor inicial por canal. */
  porDefecto: Record<CanalAviso, boolean>
}

export const TIPOS_AVISO: TipoAviso[] = [
  { id: "clips-listos", porDefecto: { correo: true, app: true } },
  { id: "errores", porDefecto: { correo: true, app: true } },
  { id: "publicaciones", porDefecto: { correo: false, app: true } },
  { id: "minutos", porDefecto: { correo: true, app: true } },
  { id: "resumen", porDefecto: { correo: true, app: false } },
  { id: "pagos", porDefecto: { correo: true, app: false } },
  { id: "novedades", porDefecto: { correo: false, app: false } },
]

/** Qué avisos quiere recibir esta cuenta y por dónde. */
export type PreferenciasAviso = Record<string, Record<CanalAviso, boolean>>

export const CLAVE_AVISOS = "clipealo-avisos-v1"

/** Lo que trae una cuenta nueva: lo que cada tipo declara por defecto. */
export const avisosPorDefecto = (): PreferenciasAviso =>
  Object.fromEntries(TIPOS_AVISO.map((t) => [t.id, { ...t.porDefecto }]))

/**
 * Lo guardado, limpio: un tipo de aviso que ya no existe se descarta y uno
 * nuevo entra con su valor por defecto, para que añadir un aviso al catálogo no
 * deje a nadie sin poder elegirlo.
 */
export function migrarAvisos(guardado: unknown): PreferenciasAviso {
  const base = avisosPorDefecto()
  if (!guardado || typeof guardado !== "object") return base
  const g = guardado as Record<string, unknown>
  for (const tipo of TIPOS_AVISO) {
    const suyo = g[tipo.id]
    if (!suyo || typeof suyo !== "object") continue
    for (const canal of CANALES_AVISO) {
      const v = (suyo as Record<string, unknown>)[canal]
      if (typeof v === "boolean") base[tipo.id][canal] = v
    }
  }
  return base
}

/* ---------------------------------------------------------------------------
   Plan y facturación
   --------------------------------------------------------------------------- */

/**
 * La suscripción de la demo, sin el plan: el plan vive en `hooks/use-plan.ts`,
 * que es lo único que sabe cuál está puesto. Aquí queda lo que sí es de la
 * suscripción y no del catálogo.
 */
export const suscripcionDemo = {
  ciclo: "mensual" as CicloFacturacion,
  estado: "activa" as const,
  desde: "2026-03-01T00:00:00.000Z",
  metodo: { marca: "Visa", ultimos4: "4242", caduca: "08/28" },
}

export type CicloFacturacion = "mensual" | "anual"

export interface Factura {
  id: string
  fecha: string
  /** El concepto («Plan Creador · mensual») se compone con el plan y el ciclo. */
  plan: PricingPlanId
  ciclo: CicloFacturacion
  importe: number
  estado: "pagada" | "reembolsada"
}

export const facturasDemo: Factura[] = [
  {
    id: "F-2026-0912",
    fecha: "2026-09-01T00:00:00.000Z",
    plan: "creator",
    ciclo: "mensual",
    importe: 29,
    estado: "pagada",
  },
  {
    id: "F-2026-0811",
    fecha: "2026-08-01T00:00:00.000Z",
    plan: "creator",
    ciclo: "mensual",
    importe: 29,
    estado: "pagada",
  },
  {
    id: "F-2026-0710",
    fecha: "2026-07-01T00:00:00.000Z",
    plan: "creator",
    ciclo: "mensual",
    importe: 29,
    estado: "pagada",
  },
  {
    id: "F-2026-0609",
    fecha: "2026-06-01T00:00:00.000Z",
    plan: "creator",
    ciclo: "mensual",
    importe: 29,
    estado: "pagada",
  },
]
