import type { Categoria } from "@/lib/campanas"
import { PLATAFORMAS_DIRECTO, TEMAS } from "@/lib/ajustes"
import { SOCIAL_IDS } from "@/lib/social"

/**
 * Vocabulario común de cliperos, creadores, agencias y campañas.
 *
 * Aquí solo hay ids (y los nombres propios que no se traducen, como
 * `PLATAFORMA_LABEL`). Las etiquetas viven en `messages/<idioma>/taxonomy.json`,
 * con la misma clave que el catálogo: `t(\`verticales.${id}\`)`.
 *
 * Los ids nunca se borran: si uno deja de usarse se marca obsoleto y se sube
 * `TAXONOMIA_VERSION`, para que `migrar()` de los hooks sepa convertir lo guardado.
 */

export const TAXONOMIA_VERSION = 1

/** `true` si `valor` es uno de los ids del catálogo. */
export function esId<const T extends readonly string[]>(
  catalogo: T,
  valor: unknown
): valor is T[number] {
  return typeof valor === "string" && (catalogo as readonly string[]).includes(valor)
}

/** Deja solo los ids válidos del catálogo, sin repetir y en el orden recibido. */
export function idsValidos<const T extends readonly string[]>(
  catalogo: T,
  valores: unknown
): T[number][] {
  if (!Array.isArray(valores)) return []
  return [...new Set(valores.filter((v): v is T[number] => esId(catalogo, v)))]
}

/* ---------------------------------------------------------------------------
   Verticales (temas del contenido)
   --------------------------------------------------------------------------- */

/**
 * Incluye los 10 `TEMAS` de Ajustes › Público con los mismos ids y añade 5.
 * `actualidad` solo etiqueta campañas: el clipero no la elige.
 * Etiquetas en `taxonomy.verticales`.
 */
export const VERTICALES = [
  "gaming",
  "directos-irl",
  "podcast",
  "deportes",
  "musica",
  "humor",
  "educacion",
  "negocios",
  "finanzas",
  "tecnologia",
  "estilo",
  "comida",
  "salud-fitness",
  "anime-vtubers",
  "actualidad",
] as const
export type Vertical = (typeof VERTICALES)[number]

/** Las que elige el clipero en la toma `nichos` y el creador en `canal`. */
export const VERTICALES_ELEGIBLES = VERTICALES.filter(
  (v): v is Exclude<Vertical, "actualidad"> => v !== "actualidad"
)
export type VerticalElegible = Exclude<Vertical, "actualidad">

/** Opción excluyente de la toma `nichos`. Etiqueta en `taxonomy.aunNoSe`. */
export const AUN_NO_SE = "aun-no-se" as const

/** Comprobación de tipos: todo `TEMAS` está en `VERTICALES`. */
const _temasEnVerticales: readonly Vertical[] = TEMAS
void _temasEnVerticales

/**
 * Correspondencia con IAB Content Taxonomy 3.1, solo para el backend y los
 * informes. `codigo: null` es una vertical propia; `respaldo`, el código IAB
 * con el que se exporta.
 */
export const VERTICAL_IAB: Record<
  Vertical,
  { codigo: string | null; nombre: string | null; respaldo?: string }
> = {
  gaming: { codigo: "680", nombre: "Video Gaming" },
  "directos-irl": { codigo: null, nombre: null, respaldo: "JLBCU7" },
  podcast: { codigo: "JLBCU7", nombre: null },
  deportes: { codigo: "483", nombre: "Sports" },
  musica: { codigo: "338", nombre: "Music" },
  humor: { codigo: "440", nombre: "Humor and Satire" },
  educacion: { codigo: "132", nombre: "Education" },
  negocios: { codigo: "52", nombre: "Business and Finance" },
  finanzas: { codigo: "391", nombre: "Personal Finance" },
  tecnologia: { codigo: "596", nombre: "Technology & Computing" },
  estilo: { codigo: "552", nombre: "Style & Fashion" },
  comida: { codigo: "210", nombre: "Food & Drink" },
  "salud-fitness": { codigo: "223", nombre: "Healthy Living" },
  "anime-vtubers": { codigo: null, nombre: null },
  actualidad: { codigo: "379", nombre: "News" },
}

/* ---------------------------------------------------------------------------
   Subverticales
   --------------------------------------------------------------------------- */

/** De `directos-irl`. Etiquetas en `taxonomy.formatosDirecto`. */
export const FORMATOS_DIRECTO = [
  "just-chatting",
  "irl",
  "reacciones",
  "eventos-streamers",
  "subathon",
] as const
export type FormatoDirecto = (typeof FORMATOS_DIRECTO)[number]

/** Demo; en producción, el id de Twitch o IGDB. */
export const JUEGOS = [
  "free-fire",
  "gta-v",
  "minecraft",
  "roblox",
  "fortnite",
  "valorant",
  "league-of-legends",
  "ea-fc",
  "counter-strike",
  "call-of-duty-mobile",
  "clash-royale",
  "dota-2",
  "otro-juego",
] as const
export type JuegoId = (typeof JUEGOS)[number]

/**
 * Nombres propios: no se traducen. Lo que no está aquí («Otro juego») tiene su
 * etiqueta en `taxonomy.juegos`:
 * `tieneNombreJuego(id) ? JUEGO_NOMBRE[id] : t(\`juegos.${id}\`)`.
 */
export const JUEGO_NOMBRE = {
  "free-fire": "Free Fire",
  "gta-v": "GTA V",
  minecraft: "Minecraft",
  roblox: "Roblox",
  fortnite: "Fortnite",
  valorant: "Valorant",
  "league-of-legends": "League of Legends",
  "ea-fc": "EA Sports FC",
  "counter-strike": "Counter-Strike 2",
  "call-of-duty-mobile": "Call of Duty: Mobile",
  "clash-royale": "Clash Royale",
  "dota-2": "Dota 2",
} as const satisfies Partial<Record<JuegoId, string>>
export type JuegoConNombre = keyof typeof JUEGO_NOMBRE
export const tieneNombreJuego = (id: JuegoId): id is JuegoConNombre => id in JUEGO_NOMBRE

/** De `deportes`. */
export const LIGAS = [
  "liga-1-pe",
  "liga-mx",
  "liga-betplay",
  "lpf-ar",
  "brasileirao",
  "laliga",
  "champions",
  "selecciones",
  "boxeo",
  "mma",
  "nba",
  "otra-liga",
] as const
export type LigaId = (typeof LIGAS)[number]

/** Nombres propios; «Selecciones», «Boxeo» y «Otra liga» están en `taxonomy.ligas`. */
export const LIGA_NOMBRE = {
  "liga-1-pe": "Liga 1",
  "liga-mx": "Liga MX",
  "liga-betplay": "Liga BetPlay",
  "lpf-ar": "Liga Profesional Argentina",
  brasileirao: "Brasileirão",
  laliga: "LaLiga",
  champions: "Champions League",
  mma: "MMA",
  nba: "NBA",
} as const satisfies Partial<Record<LigaId, string>>
export type LigaConNombre = keyof typeof LIGA_NOMBRE
export const tieneNombreLiga = (id: LigaId): id is LigaConNombre => id in LIGA_NOMBRE

/** De `musica`. Etiquetas en `taxonomy.generosMusica`. */
export const GENEROS_MUSICA = [
  "urbano-latino",
  "regional-mexicano",
  "cumbia",
  "salsa",
  "pop-rock-latino",
  "sertanejo",
  "funk-br",
  "electronica",
  "rap-trap",
  "kpop",
  "otro-genero",
] as const
export type GeneroMusica = (typeof GENEROS_MUSICA)[number]

/* ---------------------------------------------------------------------------
   Plataformas, redes y tramos
   --------------------------------------------------------------------------- */

/** Opción excluyente de la toma `directo`. Etiqueta en `taxonomy.plataformasDirecto`. */
export const NO_TRANSMITO = "no-transmito" as const
/** `PLATAFORMAS_DIRECTO` de `lib/ajustes.ts` (nombres en `PLATAFORMA_LABEL`) + «No hago directos». */
export const PLATAFORMAS_DIRECTO_ONBOARDING = [
  ...PLATAFORMAS_DIRECTO,
  NO_TRANSMITO,
] as const
export type PlataformaDirectoOnboarding = (typeof PLATAFORMAS_DIRECTO_ONBOARDING)[number]

/**
 * Dónde publica el clipero: las redes de `SOCIAL_IDS` (nombre en
 * `SOCIAL_NETWORKS[id].name`) + «Otra red» y «Aún no tengo cuenta» (excluyente),
 * con etiqueta en `taxonomy.redesPublicacion`. Kick no es red de publicación.
 */
export const REDES_PUBLICACION = [...SOCIAL_IDS, "otra", "sin-cuenta"] as const
export type RedPublicacion = (typeof REDES_PUBLICACION)[number]
export const SIN_CUENTA = "sin-cuenta" as const

export const TRAMOS_SEGUIDORES = [
  "empiezo",
  "lt-1k",
  "1k-10k",
  "10k-100k",
  "100k-1m",
  "1m-plus",
] as const
export type TramoSeguidores = (typeof TRAMOS_SEGUIDORES)[number]

/** Tramo de unos seguidores medidos: para comparar con el declarado (`#calidad`). */
export function tramoSeguidoresDe(seguidores: number): TramoSeguidores {
  if (!Number.isFinite(seguidores) || seguidores <= 0) return "empiezo"
  if (seguidores < 1_000) return "lt-1k"
  if (seguidores < 10_000) return "1k-10k"
  if (seguidores < 100_000) return "10k-100k"
  if (seguidores < 1_000_000) return "100k-1m"
  return "1m-plus"
}

export const TRAMOS_ESPECTADORES = [
  "lt-10",
  "10-50",
  "50-200",
  "200-1k",
  "1k-10k",
  "10k-plus",
] as const
export type TramoEspectadores = (typeof TRAMOS_ESPECTADORES)[number]

export const FRECUENCIAS_DIRECTO = [
  "casi-diario",
  "3-6-semana",
  "1-2-semana",
  "algunas-mes",
  "ocasional",
] as const
export type FrecuenciaDirecto = (typeof FRECUENCIAS_DIRECTO)[number]

export const DURACIONES_DIRECTO = ["lt-1h", "1-3h", "3-6h", "6h-plus"] as const
export type DuracionDirecto = (typeof DURACIONES_DIRECTO)[number]

export const OBJETIVOS_USO = ["campanas", "mis-videos", "ambos"] as const
export type ObjetivoUso = (typeof OBJETIVOS_USO)[number]

export const EXPERIENCIA = ["nunca", "diversion", "regular", "clientes"] as const
export type Experiencia = (typeof EXPERIENCIA)[number]

/** Horas a la semana. */
export const DISPONIBILIDAD = ["lt-3", "3-10", "10-20", "20-plus"] as const
export type Disponibilidad = (typeof DISPONIBILIDAD)[number]

/** Hasta 2. */
export const MOTIVACIONES = [
  "ingreso-extra",
  "vivir",
  "crecer-cuentas",
  "portafolio",
  "apoyar-creador",
  "aprender",
] as const
export type Motivacion = (typeof MOTIVACIONES)[number]

export const TIPOS_CUENTA_PUBLICACION = [
  "personal",
  "fan-page",
  "nicho",
  "nueva-clips",
] as const
export type TipoCuentaPublicacion = (typeof TIPOS_CUENTA_PUBLICACION)[number]

/** Seguridad de marca. El contenido sexual no se admite: no es una etiqueta. */
export const ETIQUETAS_SEGURIDAD = [
  "palabrotas",
  "juegos-adultos",
  "apuestas",
  "violencia",
  "alcohol-tabaco",
  "cripto",
] as const
export type EtiquetaSeguridad = (typeof ETIQUETAS_SEGURIDAD)[number]

export const HERRAMIENTAS = [
  "capcut",
  "premiere",
  "davinci",
  "finalcut-ae",
  "ia-clipping",
  "ninguna",
  "otra",
] as const
export type Herramienta = (typeof HERRAMIENTAS)[number]

export const MOTIVOS_PAUSA = [
  "sin-campanas",
  "pagan-poco",
  "cuesta-editar",
  "sin-tiempo",
  "rechazos",
  "otro",
] as const
export type MotivoPausa = (typeof MOTIVOS_PAUSA)[number]

/** Chips bajo el texto libre; se pintan en orden fijo por usuario (`barajarEstable`). */
export const COMO_NOS_CONOCISTE = [
  "video-creador",
  "amigo",
  "tiktok",
  "instagram",
  "youtube",
  "anuncio",
  "buscador",
  "evento",
  "otro",
] as const
export type ComoNosConociste = (typeof COMO_NOS_CONOCISTE)[number]

/** Respuesta a «¿Te gustaría que otros cliperos recorten tus directos?». */
export const INTERES_CAMPANA_PROPIA = ["si", "mas-adelante", "no"] as const
export type InteresCampanaPropia = (typeof INTERES_CAMPANA_PROPIA)[number]

/* ---------------------------------------------------------------------------
   Agencia
   --------------------------------------------------------------------------- */

/** Etiquetas en `taxonomy.tiposOrganizacion`. */
export const TIPOS_ORGANIZACION = [
  "agencia-marketing",
  "marca",
  "startup-app",
  "sello-distribuidora",
  "artista",
  "management-streamers",
  "streamer-creador",
  "infoproductor",
  "club-liga-evento",
  "medio-podcast",
  // Educación: una universidad o un instituto que quiere que sus clases y
  // charlas circulen en clips. Van antes de «otro» para que no acaben ahí
  "universidad",
  "instituto-academia",
  "otro",
] as const
export type TipoOrganizacion = (typeof TIPOS_ORGANIZACION)[number]

/** Categoría de Explorar que recibe el borrador de campaña de cada tipo. */
export const TIPO_A_CATEGORIA: Record<TipoOrganizacion, Categoria> = {
  "agencia-marketing": "marcas",
  marca: "marcas",
  "startup-app": "marcas",
  "sello-distribuidora": "musica",
  artista: "musica",
  "management-streamers": "influencers",
  "streamer-creador": "influencers",
  infoproductor: "infoproductores",
  "club-liga-evento": "marcas",
  "medio-podcast": "influencers",
  // Sus campañas son contenido formativo: la categoría que ya agrupa eso
  universidad: "infoproductores",
  "instituto-academia": "infoproductores",
  otro: "marcas",
}

/**
 * Tipos con la variante «¿Cuál es el canal?» en la toma `promocion`: enlace
 * obligatorio y sector precargado en `SECTOR_CANAL` (editable).
 */
export const TIPOS_ORG_CON_CANAL = [
  "streamer-creador",
  "management-streamers",
] as const satisfies readonly TipoOrganizacion[]
export const SECTOR_CANAL = "entretenimiento-creadores" as const
export const tieneVarianteCanal = (tipo: TipoOrganizacion | null | undefined) =>
  !!tipo && (TIPOS_ORG_CON_CANAL as readonly string[]).includes(tipo)

/** Sector del producto que se promociona. Etiquetas en `taxonomy.sectores`. */
export const SECTORES = [
  "entretenimiento-creadores",
  "musica",
  "gaming-esports",
  "apps-software-ia",
  "ecommerce-moda-belleza",
  "comida-bebidas",
  "educacion-infoproductos",
  "finanzas-fintech",
  "cripto-trading",
  "apuestas-casino",
  "salud-suplementos",
  "alcohol",
  "politica-causas",
  "deportes",
  "medios",
  "tecnologia-telecom",
  "viajes",
  "automocion",
  "inmobiliario",
  "ong",
] as const
export type Sector = (typeof SECTORES)[number]

/**
 * Regulado: revisión del admin, solo cliperos verificados, fuera las cuentas
 * con público mayoritario de 13 a 17 y aviso publicitario por país.
 */
export const SECTOR_REGULADO: Record<Sector, boolean> = {
  "entretenimiento-creadores": false,
  musica: false,
  "gaming-esports": false,
  "apps-software-ia": false,
  "ecommerce-moda-belleza": false,
  "comida-bebidas": false,
  "educacion-infoproductos": false,
  "finanzas-fintech": true,
  "cripto-trading": true,
  "apuestas-casino": true,
  "salud-suplementos": true,
  alcohol: true,
  "politica-causas": true,
  deportes: false,
  medios: false,
  "tecnologia-telecom": false,
  viajes: false,
  automocion: false,
  inmobiliario: false,
  ong: false,
}

/** Verticales compatibles con cada sector: `principales` pesan 1 y `secundarias` 0,5. */
export const SECTOR_VERTICALES: Record<
  Sector,
  { principales: readonly Vertical[]; secundarias: readonly Vertical[] }
> = {
  "entretenimiento-creadores": {
    principales: ["directos-irl", "podcast", "humor"],
    secundarias: ["gaming"],
  },
  musica: { principales: ["musica"], secundarias: ["humor", "estilo"] },
  "gaming-esports": {
    principales: ["gaming"],
    secundarias: ["directos-irl", "anime-vtubers"],
  },
  "apps-software-ia": {
    principales: ["tecnologia", "negocios"],
    secundarias: ["educacion", "humor"],
  },
  "ecommerce-moda-belleza": { principales: ["estilo"], secundarias: ["humor", "comida"] },
  "comida-bebidas": { principales: ["comida"], secundarias: ["humor", "deportes"] },
  "educacion-infoproductos": {
    principales: ["educacion", "negocios"],
    secundarias: ["finanzas"],
  },
  "finanzas-fintech": { principales: ["finanzas", "negocios"], secundarias: [] },
  "cripto-trading": { principales: ["finanzas", "tecnologia"], secundarias: ["gaming"] },
  "apuestas-casino": {
    principales: ["deportes"],
    secundarias: ["gaming", "directos-irl"],
  },
  "salud-suplementos": { principales: ["salud-fitness"], secundarias: [] },
  alcohol: { principales: ["comida"], secundarias: ["deportes", "musica"] },
  "politica-causas": { principales: ["actualidad"], secundarias: [] },
  deportes: { principales: ["deportes"], secundarias: [] },
  medios: { principales: ["actualidad", "podcast"], secundarias: [] },
  "tecnologia-telecom": { principales: ["tecnologia"], secundarias: [] },
  viajes: { principales: ["estilo", "comida"], secundarias: [] },
  automocion: { principales: ["tecnologia"], secundarias: ["deportes"] },
  inmobiliario: { principales: ["negocios", "finanzas"], secundarias: [] },
  ong: { principales: ["educacion", "actualidad"], secundarias: [] },
}

/** 1, 0,5 o 0: cuánto cuenta un clipero de `vertical` para un sector (§4.6). */
export function pesoVerticalEnSector(sector: Sector, vertical: Vertical): 0 | 0.5 | 1 {
  const s = SECTOR_VERTICALES[sector]
  if (s.principales.includes(vertical)) return 1
  if (s.secundarias.includes(vertical)) return 0.5
  return 0
}

/**
 * CPM de referencia de mercado en US$ (a validar). `null`: sin recomendación.
 * Se sustituye por el «CPM que llena» cuando haya 8 campañas o más (§7.3).
 */
export const CPM_REFERENCIA: Record<Sector, { min: number; max: number } | null> = {
  "entretenimiento-creadores": { min: 0.4, max: 1.2 },
  musica: { min: 0.3, max: 1 },
  "gaming-esports": { min: 0.5, max: 1.5 },
  "apps-software-ia": { min: 1.5, max: 4 },
  "ecommerce-moda-belleza": { min: 0.8, max: 2 },
  "comida-bebidas": { min: 0.6, max: 1.5 },
  "educacion-infoproductos": { min: 0.6, max: 1.5 },
  "finanzas-fintech": { min: 2, max: 5 },
  "cripto-trading": { min: 3, max: 6 },
  "apuestas-casino": { min: 3, max: 6 },
  "salud-suplementos": { min: 1, max: 3 },
  alcohol: { min: 1, max: 2.5 },
  "politica-causas": null,
  deportes: { min: 0.5, max: 1.5 },
  medios: { min: 0.4, max: 1.2 },
  "tecnologia-telecom": { min: 1, max: 3 },
  viajes: { min: 0.8, max: 2 },
  automocion: { min: 1, max: 3 },
  inmobiliario: { min: 1, max: 3 },
  ong: { min: 0.3, max: 0.8 },
}

/** Mitad del rango de referencia, a dos decimales; `null` si el sector no tiene. */
export function cpmMedioReferencia(sector: Sector): number | null {
  const r = CPM_REFERENCIA[sector]
  return r ? Math.round(((r.min + r.max) / 2) * 100) / 100 : null
}

/**
 * Verticales vecinas, de más a menos cercana, hasta que haya datos de
 * adyacencia reales (§7.3). Sale de las verticales que comparten sector en
 * `SECTOR_VERTICALES` y de una revisión a mano.
 */
export const ADYACENCIA_POR_DEFECTO: Record<Vertical, readonly Vertical[]> = {
  gaming: ["directos-irl", "anime-vtubers", "tecnologia"],
  "directos-irl": ["gaming", "humor", "podcast"],
  podcast: ["negocios", "directos-irl", "educacion"],
  deportes: ["humor", "directos-irl", "salud-fitness"],
  musica: ["humor", "estilo", "directos-irl"],
  humor: ["directos-irl", "musica", "podcast"],
  educacion: ["negocios", "finanzas", "tecnologia"],
  negocios: ["finanzas", "educacion", "podcast"],
  finanzas: ["negocios", "educacion", "tecnologia"],
  tecnologia: ["gaming", "negocios", "educacion"],
  estilo: ["salud-fitness", "musica", "comida"],
  comida: ["humor", "estilo", "salud-fitness"],
  "salud-fitness": ["deportes", "comida", "estilo"],
  "anime-vtubers": ["gaming", "directos-irl", "humor"],
  actualidad: ["podcast", "deportes", "humor"],
}

/**
 * Vecinas de un conjunto de verticales, sin las propias y sin repetir: primero
 * las más cercanas de cada una, por turnos.
 */
export function adyacentesDe(verticales: readonly Vertical[]): Vertical[] {
  const propias = new Set(verticales)
  const salida: Vertical[] = []
  const max = Math.max(0, ...verticales.map((v) => ADYACENCIA_POR_DEFECTO[v].length))
  for (let i = 0; i < max; i++) {
    for (const v of verticales) {
      const vecina = ADYACENCIA_POR_DEFECTO[v][i]
      if (vecina && !propias.has(vecina) && !salida.includes(vecina)) salida.push(vecina)
    }
  }
  return salida
}

/* ---------------------------------------------------------------------------
   Agencia fuera del alta (creación de campaña, cola del admin)
   --------------------------------------------------------------------------- */

export const TRAMOS_PRESUPUESTO = [
  "lt-500",
  "500-2k",
  "2k-10k",
  "10k-50k",
  "50k-plus",
  "no-decir",
] as const
export type TramoPresupuesto = (typeof TRAMOS_PRESUPUESTO)[number]

/** Tramo del presupuesto en US$ que deja la agencia en el simulador. */
export function tramoPresupuestoDe(usd: number | null | undefined): TramoPresupuesto {
  if (usd == null || !Number.isFinite(usd) || usd <= 0) return "no-decir"
  if (usd < 500) return "lt-500"
  if (usd < 2_000) return "500-2k"
  if (usd < 10_000) return "2k-10k"
  if (usd < 50_000) return "10k-50k"
  return "50k-plus"
}

export const FRECUENCIAS_CAMPANA = [
  "unica",
  "varias-ano",
  "mensual",
  "siempre-activa",
] as const
export type FrecuenciaCampana = (typeof FRECUENCIAS_CAMPANA)[number]

/**
 * CPM esperado. La especificación escribía «lt-0.5» y «0.5-1», pero next-intl
 * no admite puntos en las claves de mensajes: el medio punto va con guion bajo.
 */
export const TRAMOS_CPM = [
  "lt-0_5",
  "0_5-1",
  "1-3",
  "3-6",
  "6-plus",
  "recomiendame",
] as const
export type TramoCpm = (typeof TRAMOS_CPM)[number]

export const TRAMOS_CLIENTES = ["1", "2-5", "6-20", "21-plus"] as const
export type TramoClientes = (typeof TRAMOS_CLIENTES)[number]

export const MATERIALES = [
  "directos",
  "videos-largos",
  "podcast",
  "videoclips",
  "eventos-entrevistas",
  "anuncios",
] as const
export type Material = (typeof MATERIALES)[number]

/** Hasta 2. */
export const OBJETIVOS_CAMPANA = [
  "alcance",
  "lanzamiento",
  "crecer-canal",
  "trafico-ventas",
  "presencia-continua",
  "reactivar-catalogo",
] as const
export type ObjetivoCampana = (typeof OBJETIVOS_CAMPANA)[number]

export const ROLES = ["fundador", "marketing", "manager", "creador", "otro"] as const
export type Rol = (typeof ROLES)[number]

/** Por qué el admin rechaza una solicitud de agencia (§7.5). */
export const MOTIVOS_RECHAZO_AGENCIA = [
  "web-no-verificable",
  "sector-no-admitido",
  "datos-incompletos",
  "duplicada",
  "otro",
] as const
export type MotivoRechazo = (typeof MOTIVOS_RECHAZO_AGENCIA)[number]
