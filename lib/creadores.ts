import { campanasSemilla, type Campana, type EstadoVisto } from "@/lib/campanas"
import type { IdiomaAudiencia, PlataformaDirecto } from "@/lib/ajustes"
import type { CountryCode } from "@/lib/countries"
import {
  analizarEnlaceCanal,
  hashEstable,
  pareceEnlace,
  type CreadorPendiente,
  type EnlaceCanal,
  type PaisResidencia,
} from "@/lib/onboarding"
import type { SocialId } from "@/lib/social"
import type {
  EtiquetaSeguridad,
  FormatoDirecto,
  JuegoId,
  Vertical,
} from "@/lib/taxonomia"

/**
 * Catálogo de creadores de la demo (§4.2). **Todos ficticios**: reutilizan
 * nombres de `lib/comunidad.ts` y de las campañas semilla, y añaden otros
 * inventados. Antes de publicar la demo hay que comprobar que ninguno coincide
 * con un creador real. En producción, el catálogo sale de las APIs de Twitch,
 * Kick y YouTube y de los creadores que ya son usuarios.
 *
 * No sugiere políticos, líderes religiosos, menores ni cuentas de apuestas o
 * adultas: esas quedan con `sugerible: false` y solo se guardan si alguien pega
 * su enlace (para su aviso personal, nunca para un agregado).
 *
 * Los nombres son contenido de demo y no se traducen.
 */

export type CreadorId = `cre_${string}`

export type TipoCreador = "streamer" | "podcast" | "artista" | "club-evento" | "creador"

export interface Creador {
  id: CreadorId
  nombre: string
  tipo: TipoCreador
  /** La primera es la plataforma principal. */
  cuentas: {
    plataforma: PlataformaDirecto | SocialId
    handle: string
    seguidores: number
  }[]
  verticales: Vertical[]
  juegos?: JuegoId[]
  formatos?: FormatoDirecto[]
  pais?: CountryCode
  idiomas: IdiomaAudiencia[]
  campanaId?: string
  etiquetas?: EtiquetaSeguridad[]
  sugerible: boolean
  /** Fans declarados simulados: alimentan umbrales y radar. */
  fansDemo: number
}

export const CREADORES: readonly Creador[] = [
  {
    id: "cre_liga_estrellas",
    nombre: "Liga de las Estrellas",
    tipo: "club-evento",
    cuentas: [
      { plataforma: "youtube", handle: "ligadelasestrellas", seguidores: 420_000 },
      { plataforma: "tiktok", handle: "ligaestrellas", seguidores: 180_000 },
      { plataforma: "instagram", handle: "ligaestrellas", seguidores: 95_000 },
    ],
    verticales: ["deportes"],
    pais: "PE",
    idiomas: ["es"],
    campanaId: "cmp_liga",
    sugerible: true,
    fansDemo: 310,
  },
  {
    id: "cre_diosesmonstruo",
    nombre: "Diosesmonstruo",
    tipo: "streamer",
    cuentas: [
      { plataforma: "youtube", handle: "diosesmonstruo", seguidores: 1_250_000 },
      { plataforma: "tiktok", handle: "diosesmonstruo", seguidores: 640_000 },
    ],
    verticales: ["directos-irl", "humor"],
    formatos: ["just-chatting"],
    pais: "MX",
    idiomas: ["es"],
    campanaId: "cmp_bingo",
    sugerible: true,
    fansDemo: 180,
  },
  {
    id: "cre_joaquin_mar",
    nombre: "Joaquín Mar",
    tipo: "artista",
    cuentas: [
      { plataforma: "youtube", handle: "joaquinmar", seguidores: 890_000 },
      { plataforma: "tiktok", handle: "joaquinmar", seguidores: 1_100_000 },
    ],
    verticales: ["musica"],
    pais: "CO",
    idiomas: ["es"],
    campanaId: "cmp_casi",
    sugerible: true,
    fansDemo: 240,
  },
  {
    id: "cre_ambar",
    nombre: "Ámbar",
    tipo: "artista",
    cuentas: [
      { plataforma: "tiktok", handle: "ambar.oficial", seguidores: 2_300_000 },
      { plataforma: "youtube", handle: "ambaroficial", seguidores: 310_000 },
    ],
    verticales: ["musica"],
    pais: "MX",
    idiomas: ["es"],
    campanaId: "cmp_anmi",
    sugerible: true,
    fansDemo: 90,
  },
  {
    id: "cre_fernanda_millares",
    nombre: "Fernanda Millares",
    tipo: "creador",
    cuentas: [
      { plataforma: "instagram", handle: "fernandamillares", seguidores: 280_000 },
      { plataforma: "youtube", handle: "fernandamillares", seguidores: 64_000 },
    ],
    verticales: ["negocios"],
    pais: "AR",
    idiomas: ["es"],
    campanaId: "cmp_fer",
    sugerible: true,
    fansDemo: 60,
  },
  {
    id: "cre_alex_prado",
    nombre: "Álex Prado",
    tipo: "creador",
    cuentas: [
      { plataforma: "youtube", handle: "alexprado", seguidores: 540_000 },
      { plataforma: "instagram", handle: "alexprado", seguidores: 120_000 },
    ],
    verticales: ["educacion"],
    pais: "ES",
    idiomas: ["es"],
    campanaId: "cmp_alex",
    sugerible: true,
    fansDemo: 45,
  },
  {
    id: "cre_ruta_fit",
    nombre: "Ruta Fit",
    tipo: "creador",
    cuentas: [
      { plataforma: "instagram", handle: "rutafit", seguidores: 190_000 },
      { plataforma: "youtube", handle: "rutafit", seguidores: 75_000 },
    ],
    verticales: ["salud-fitness"],
    pais: "CL",
    idiomas: ["es"],
    campanaId: "cmp_fit",
    sugerible: true,
    fansDemo: 30,
  },
  {
    id: "cre_camila_quispe",
    nombre: "Camila Quispe",
    tipo: "creador",
    cuentas: [
      { plataforma: "youtube", handle: "camilaquispe", seguidores: 760_000 },
      { plataforma: "tiktok", handle: "camilaquispe", seguidores: 1_400_000 },
    ],
    verticales: ["humor", "estilo"],
    pais: "PE",
    idiomas: ["es"],
    sugerible: true,
    fansDemo: 520,
  },
  {
    id: "cre_podcast_lima",
    nombre: "Podcast Lima",
    tipo: "podcast",
    cuentas: [
      { plataforma: "tiktok", handle: "podcastlima", seguidores: 210_000 },
      { plataforma: "youtube", handle: "podcastlima", seguidores: 98_000 },
    ],
    verticales: ["podcast", "negocios"],
    pais: "PE",
    idiomas: ["es"],
    sugerible: true,
    fansDemo: 70,
  },
  {
    id: "cre_marta_penalosa",
    nombre: "Marta Peñalosa",
    tipo: "creador",
    cuentas: [{ plataforma: "instagram", handle: "martapenalosa", seguidores: 330_000 }],
    verticales: ["estilo"],
    pais: "CO",
    idiomas: ["es"],
    sugerible: true,
    fansDemo: 130,
  },
  {
    id: "cre_rodrigo_salas",
    nombre: "Rodrigo Salas",
    tipo: "creador",
    cuentas: [
      { plataforma: "tiktok", handle: "rodrigosalas", seguidores: 980_000 },
      { plataforma: "instagram", handle: "rodrigosalas", seguidores: 210_000 },
    ],
    verticales: ["humor"],
    pais: "MX",
    idiomas: ["es"],
    campanaId: "cmp_rodrigo",
    sugerible: true,
    fansDemo: 210,
  },
  {
    id: "cre_la_hora_dev",
    nombre: "La Hora Dev",
    tipo: "podcast",
    cuentas: [{ plataforma: "youtube", handle: "lahoradev", seguidores: 86_000 }],
    verticales: ["tecnologia"],
    pais: "ES",
    idiomas: ["es"],
    sugerible: true,
    fansDemo: 40,
  },
  {
    id: "cre_mateo_brisa",
    nombre: "Mateo Brisa",
    tipo: "streamer",
    cuentas: [
      { plataforma: "kick", handle: "mateobrisa", seguidores: 145_000 },
      { plataforma: "tiktok", handle: "mateobrisa", seguidores: 260_000 },
    ],
    verticales: ["directos-irl"],
    formatos: ["just-chatting"],
    pais: "CO",
    idiomas: ["es"],
    sugerible: true,
    fansDemo: 380,
  },
  {
    id: "cre_sofi_pampa",
    nombre: "Sofi Pampa",
    tipo: "streamer",
    cuentas: [
      { plataforma: "kick", handle: "sofipampa", seguidores: 98_000 },
      { plataforma: "youtube", handle: "sofipampa", seguidores: 64_000 },
    ],
    verticales: ["directos-irl", "deportes"],
    formatos: ["irl", "reacciones"],
    pais: "AR",
    idiomas: ["es"],
    sugerible: true,
    fansDemo: 260,
  },
  {
    id: "cre_kira_andes",
    nombre: "Kira Andes",
    tipo: "streamer",
    cuentas: [
      { plataforma: "twitch", handle: "kiraandes", seguidores: 72_000 },
      { plataforma: "tiktok", handle: "kiraandes", seguidores: 150_000 },
    ],
    verticales: ["gaming"],
    juegos: ["free-fire"],
    pais: "PE",
    idiomas: ["es"],
    sugerible: true,
    fansDemo: 150,
  },
  {
    id: "cre_lupe_arcade",
    nombre: "Lupe Arcade",
    tipo: "streamer",
    cuentas: [
      { plataforma: "youtube", handle: "lupearcade", seguidores: 430_000 },
      { plataforma: "tiktok", handle: "lupearcade", seguidores: 220_000 },
    ],
    verticales: ["gaming"],
    juegos: ["minecraft", "roblox"],
    pais: "MX",
    idiomas: ["es"],
    sugerible: true,
    fansDemo: 95,
  },
  {
    id: "cre_beto_farol",
    nombre: "Beto Farol",
    tipo: "streamer",
    cuentas: [{ plataforma: "twitch", handle: "betofarol", seguidores: 38_000 }],
    verticales: ["gaming"],
    juegos: ["valorant"],
    pais: "BR",
    idiomas: ["pt"],
    sugerible: true,
    // Muestra baja: por debajo del umbral público
    fansDemo: 20,
  },
  {
    id: "cre_duda_mare",
    nombre: "Duda Maré",
    tipo: "creador",
    cuentas: [{ plataforma: "tiktok", handle: "dudamare", seguidores: 520_000 }],
    verticales: ["humor"],
    pais: "BR",
    idiomas: ["pt"],
    sugerible: true,
    fansDemo: 55,
  },
  {
    id: "cre_pixel_andino",
    nombre: "Pixel Andino",
    tipo: "streamer",
    cuentas: [{ plataforma: "twitch", handle: "pixelandino", seguidores: 21_000 }],
    verticales: ["anime-vtubers"],
    pais: "EC",
    idiomas: ["es"],
    sugerible: true,
    fansDemo: 35,
  },
  {
    id: "cre_dani_brasa",
    nombre: "Dani Brasa",
    tipo: "creador",
    cuentas: [
      { plataforma: "youtube", handle: "danibrasa", seguidores: 150_000 },
      { plataforma: "tiktok", handle: "danibrasa", seguidores: 90_000 },
    ],
    verticales: ["comida"],
    pais: "ES",
    idiomas: ["es"],
    campanaId: "cmp_dani",
    sugerible: true,
    fansDemo: 25,
  },
  {
    // Semilla de la campaña «Arena Nova · temporada de clips» (decisión 6)
    id: "cre_arena_nova",
    nombre: "Arena Nova",
    tipo: "club-evento",
    cuentas: [
      { plataforma: "kick", handle: "arenanova", seguidores: 88_000 },
      { plataforma: "youtube", handle: "arenanova", seguidores: 52_000 },
    ],
    verticales: ["gaming"],
    juegos: ["free-fire", "valorant"],
    formatos: ["eventos-streamers"],
    pais: "MX",
    idiomas: ["es"],
    campanaId: "cmp_arena",
    sugerible: true,
    fansDemo: 120,
  },
  {
    // Prueba de exclusión: nunca se sugiere ni entra en agregados
    id: "cre_ruleta_max",
    nombre: "Ruleta Max",
    tipo: "streamer",
    cuentas: [{ plataforma: "kick", handle: "ruletamax", seguidores: 60_000 }],
    verticales: ["directos-irl"],
    idiomas: ["es"],
    etiquetas: ["apuestas"],
    sugerible: false,
    fansDemo: 0,
  },
]

export const creadorPorId = (id: string, catalogo: readonly Creador[] = CREADORES) =>
  catalogo.find((c) => c.id === id)

/** Plataforma de la primera cuenta. */
export const plataformaPrincipal = (c: Creador) => c.cuentas[0].plataforma

/** Seguidores de la cuenta principal (lo que se enseña con `useFormat().compact`). */
export const seguidoresPrincipales = (c: Creador) => c.cuentas[0].seguidores

const sinTildes = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim()

/* ---------------------------------------------------------------------------
   Búsqueda
   --------------------------------------------------------------------------- */

export type ResultadoBusquedaCreadores =
  /** Campo vacío: se enseñan las sugerencias. */
  | { tipo: "vacio" }
  /** Enlace reconocido de un creador del catálogo (sugerible o no). */
  | { tipo: "enlace"; creador: Creador; enlace: EnlaceCanal }
  /** Enlace reconocido que no está en el catálogo: se guarda como pendiente. */
  | { tipo: "pendiente"; pendiente: CreadorPendiente }
  /** Parece una dirección pero no es de Twitch, Kick, YouTube ni TikTok. */
  | { tipo: "enlace-no-reconocido" }
  /** Texto: resultados (quizá ninguno) agrupados por plataforma principal. */
  | {
      tipo: "texto"
      creadores: Creador[]
      grupos: { plataforma: PlataformaDirecto | SocialId; creadores: Creador[] }[]
    }

export interface OpcionesBusqueda {
  pais?: PaisResidencia | null
  verticales?: readonly Vertical[]
  catalogo?: readonly Creador[]
  limite?: number
}

/**
 * Busca por nombre y handle sin distinguir tildes ni mayúsculas, o resuelve un
 * enlace pegado. En texto solo salen creadores `sugerible`. Orden: empieza por
 * lo escrito, luego empieza una palabra, luego contiene; a igualdad, su país,
 * sus verticales y más fans.
 */
export function buscarCreadores(
  q: string,
  { pais, verticales = [], catalogo = CREADORES, limite = 20 }: OpcionesBusqueda = {}
): ResultadoBusquedaCreadores {
  const texto = q.trim()
  if (!texto) return { tipo: "vacio" }

  const enlace = analizarEnlaceCanal(texto)
  if (enlace) {
    const creador = catalogo.find((c) =>
      c.cuentas.some(
        (x) =>
          x.plataforma === enlace.plataforma && x.handle.toLowerCase() === enlace.handle
      )
    )
    return creador
      ? { tipo: "enlace", creador, enlace }
      : {
          tipo: "pendiente",
          pendiente: {
            pendiente: true,
            texto,
            plataforma: enlace.plataforma,
            handle: enlace.handle,
            url: enlace.url,
          },
        }
  }
  if (pareceEnlace(texto)) return { tipo: "enlace-no-reconocido" }

  const t = sinTildes(texto).replace(/^@/, "")
  const puntua = (c: Creador) => {
    const campos = [c.nombre, ...c.cuentas.map((x) => x.handle)].map(sinTildes)
    if (campos.some((x) => x.startsWith(t))) return 3
    if (campos.some((x) => x.split(/[\s._-]+/).some((w) => w.startsWith(t)))) return 2
    if (campos.some((x) => x.includes(t))) return 1
    return 0
  }
  const creadores = catalogo
    .filter((c) => c.sugerible)
    .map((c) => ({ c, p: puntua(c) }))
    .filter((x) => x.p > 0)
    .sort(
      (a, b) =>
        b.p - a.p ||
        Number(b.c.pais === pais) - Number(a.c.pais === pais) ||
        Number(b.c.verticales.some((v) => verticales.includes(v))) -
          Number(a.c.verticales.some((v) => verticales.includes(v))) ||
        b.c.fansDemo - a.c.fansDemo ||
        a.c.nombre.localeCompare(b.c.nombre)
    )
    .slice(0, limite)
    .map((x) => x.c)

  const grupos: { plataforma: PlataformaDirecto | SocialId; creadores: Creador[] }[] = []
  for (const c of creadores) {
    const plataforma = plataformaPrincipal(c)
    const grupo = grupos.find((g) => g.plataforma === plataforma)
    if (grupo) grupo.creadores.push(c)
    else grupos.push({ plataforma, creadores: [c] })
  }
  return { tipo: "texto", creadores, grupos }
}

/** «Añadir «{texto}»» cuando no hay resultados. */
export const pendienteDesdeTexto = (texto: string): CreadorPendiente => ({
  pendiente: true,
  texto: texto.trim(),
})

/* ---------------------------------------------------------------------------
   Sugerencias antes de escribir
   --------------------------------------------------------------------------- */

export interface OpcionesSugerencias {
  pais?: PaisResidencia | null
  verticales?: readonly Vertical[]
  /** Semilla estable para desempatar, p. ej. el correo. Nunca `Math.random`. */
  semilla?: string
  /** Se pasa con el estado visible, que puede ser «vencida» o «cerrada». */
  campanas?: readonly (Pick<Campana, "id" | "paisesObjetivo"> & { estado: EstadoVisto })[]
  catalogo?: readonly Creador[]
  limite?: number
}

/**
 * 8 sugerencias deterministas (§4.1):
 * 1. creadores con una campaña activa que se puede hacer desde su país;
 * 2. creadores de las verticales que eligió en `nichos`;
 * 3. el resto, por `fansDemo`.
 * Dentro de los grupos 1 y 2 se barajan con un hash de la semilla (evita que
 * todos vean a los mismos primero); en el 3, más fans primero. Nunca salen los
 * `sugerible: false`.
 */
export function sugerencias({
  pais,
  verticales = [],
  semilla = "",
  campanas = campanasSemilla,
  catalogo = CREADORES,
  limite = 8,
}: OpcionesSugerencias = {}): Creador[] {
  const activaEnPais = (c: Creador) => {
    const campana = c.campanaId && campanas.find((x) => x.id === c.campanaId)
    if (!campana || campana.estado !== "activa") return false
    const destino = campana.paisesObjetivo
    return !destino?.length || (!!pais && pais !== "otro" && destino.includes(pais))
  }
  const grupo = (c: Creador) =>
    activaEnPais(c) ? 1 : c.verticales.some((v) => verticales.includes(v)) ? 2 : 3
  return catalogo
    .filter((c) => c.sugerible)
    .map((c) => ({ c, g: grupo(c), h: hashEstable(`${semilla}:${c.id}`) }))
    .sort(
      (a, b) =>
        a.g - b.g ||
        (a.g === 3 ? b.c.fansDemo - a.c.fansDemo : 0) ||
        a.h - b.h ||
        a.c.id.localeCompare(b.c.id)
    )
    .slice(0, limite)
    .map((x) => x.c)
}

/* ---------------------------------------------------------------------------
   Juegos por país (toma `nichos`, al marcar gaming)
   --------------------------------------------------------------------------- */

const JUEGOS_ANDINOS: readonly JuegoId[] = [
  "free-fire",
  "minecraft",
  "gta-v",
  "roblox",
  "valorant",
  "league-of-legends",
  "ea-fc",
  "fortnite",
]

/** Los 8 chips de juegos de cada país, del más al menos jugado (demo). */
export const JUEGOS_POR_PAIS: Record<CountryCode, readonly JuegoId[]> = {
  PE: JUEGOS_ANDINOS,
  EC: JUEGOS_ANDINOS,
  CO: JUEGOS_ANDINOS,
  BR: [
    "free-fire",
    "valorant",
    "counter-strike",
    "minecraft",
    "roblox",
    "gta-v",
    "league-of-legends",
    "ea-fc",
  ],
  MX: [
    "free-fire",
    "fortnite",
    "minecraft",
    "gta-v",
    "roblox",
    "call-of-duty-mobile",
    "valorant",
    "ea-fc",
  ],
  AR: [
    "free-fire",
    "valorant",
    "league-of-legends",
    "counter-strike",
    "minecraft",
    "ea-fc",
    "fortnite",
    "gta-v",
  ],
  CL: [
    "free-fire",
    "league-of-legends",
    "valorant",
    "minecraft",
    "fortnite",
    "clash-royale",
    "ea-fc",
    "gta-v",
  ],
  ES: [
    "ea-fc",
    "fortnite",
    "valorant",
    "league-of-legends",
    "minecraft",
    "clash-royale",
    "gta-v",
    "counter-strike",
  ],
  US: [
    "fortnite",
    "minecraft",
    "roblox",
    "call-of-duty-mobile",
    "valorant",
    "gta-v",
    "league-of-legends",
    "counter-strike",
  ],
}

/** Chips de juegos del país; sin país o con «Otro país», los de la región andina. */
export const juegosDe = (pais: PaisResidencia | null | undefined): readonly JuegoId[] =>
  pais && pais !== "otro" ? JUEGOS_POR_PAIS[pais] : JUEGOS_ANDINOS
