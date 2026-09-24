import type { IdiomaAudiencia, PlataformaDirecto } from "@/lib/ajustes"
import {
  campanasSemilla,
  enviosSemilla,
  esRegulada,
  type Campana,
  type Categoria,
  type Envio,
  type EstadoEnvio,
} from "@/lib/campanas"
import type { CountryCode } from "@/lib/countries"
import { CREADORES, juegosDe, type CreadorId } from "@/lib/creadores"
import { seededNoise } from "@/lib/mock-data"
import {
  completitud,
  confianzaBaja,
  dimensionesDe,
  type CuentaPublicacion,
  type PasoId,
} from "@/lib/onboarding"
import { recomendarCampanas } from "@/lib/recomendacion"
import type { SocialId } from "@/lib/social"
import {
  CPM_REFERENCIA,
  SECTOR_REGULADO,
  SECTOR_VERTICALES,
  TRAMOS_SEGUIDORES,
  tramoPresupuestoDe,
  tramoSeguidoresDe,
  type ComoNosConociste,
  type DuracionDirecto,
  type FrecuenciaDirecto,
  type InteresCampanaPropia,
  type JuegoId,
  type MotivoRechazo,
  type ObjetivoUso,
  type PlataformaDirectoOnboarding,
  type RedPublicacion,
  type Sector,
  type TipoOrganizacion,
  type TramoSeguidores,
  type Vertical,
} from "@/lib/taxonomia"
import type { AdminUser, OnboardingAdmin, SolicitudAgenciaAdmin } from "@/lib/admin/types"

/**
 * Onboarding, campañas y envíos simulados del backoffice (§7.8).
 *
 * El admin lee una instantánea del servidor y el onboarding de la demo vive en
 * el localStorage de cada navegador, así que hasta conectar la API los paneles
 * del onboarding y del mercado salen de aquí. Todo es determinista y usa sus
 * propias semillas: los 652 usuarios de `mock-data.ts` (nombres, países,
 * canales, proyectos y pagos) no cambian. Solo se les añade lo que respondieron.
 *
 * Unos 7 de cada 10 usuarios tienen el onboarding instrumentado; el resto son
 * cuentas anteriores y quedan fuera de sus métricas.
 */

const DIA = 86_400_000
const ms = (iso: string) => new Date(iso).getTime()
const iso = (t: number) => new Date(t).toISOString()

type Rnd = () => number

function elegir<T>(rnd: Rnd, tabla: readonly (readonly [T, number])[]): T {
  const total = tabla.reduce((n, [, w]) => n + w, 0)
  let r = rnd() * total
  for (const [valor, peso] of tabla) {
    r -= peso
    if (r < 0) return valor
  }
  return tabla[tabla.length - 1][0]
}

/** `k` elementos distintos, sin reemplazo, ponderados. */
function elegirVarios<T>(
  rnd: Rnd,
  tabla: readonly (readonly [T, number])[],
  k: number
): T[] {
  const quedan = tabla.filter(([, w]) => w > 0).map((x) => [...x] as [T, number])
  const salida: T[] = []
  while (salida.length < k && quedan.length > 0) {
    const valor = elegir(rnd, quedan)
    salida.push(valor)
    quedan.splice(
      quedan.findIndex(([v]) => v === valor),
      1
    )
  }
  return salida
}

/** Log-normal con mediana `m` y dispersión `s`. */
function lognormal(rnd: Rnd, m: number, s: number) {
  const u1 = Math.max(rnd(), 1e-9)
  const u2 = rnd()
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  return m * Math.exp(s * z)
}

const LIMITE_HOY = (hoy: string, t: number) => t <= ms(hoy)

/* ---------------------------------------------------------------------------
   Tablas de la simulación
   --------------------------------------------------------------------------- */

const VERTICALES_BASE: [Vertical, number][] = [
  ["gaming", 16],
  ["humor", 12],
  ["directos-irl", 10],
  ["musica", 10],
  ["deportes", 10],
  ["podcast", 6],
  ["negocios", 6],
  ["educacion", 5],
  ["tecnologia", 5],
  ["estilo", 5],
  ["comida", 5],
  ["salud-fitness", 4],
  ["finanzas", 3],
  ["anime-vtubers", 3],
]

const SESGO_PAIS: Partial<Record<CountryCode, Partial<Record<Vertical, number>>>> = {
  PE: { gaming: 1.2, humor: 1.2 },
  BR: { gaming: 1.6, humor: 1.3 },
  AR: { deportes: 1.7 },
  ES: { deportes: 1.5, podcast: 1.4 },
  MX: { musica: 1.5, humor: 1.2 },
  CO: { musica: 1.6 },
  CL: { "salud-fitness": 1.5 },
  US: { tecnologia: 1.5 },
}

const REDES_PESO: [SocialId, number][] = [
  ["tiktok", 85],
  ["instagram", 55],
  ["youtube", 45],
  ["facebook", 18],
  ["x", 7],
  ["linkedin", 3],
]

const PAISES_CAMPANA: [CountryCode, number][] = [
  ["PE", 42],
  ["MX", 16],
  ["CO", 13],
  ["AR", 8],
  ["CL", 6],
  ["ES", 6],
  ["BR", 6],
  ["EC", 3],
]

const SECTORES_CAMPANA: [Sector, number][] = [
  ["entretenimiento-creadores", 18],
  ["musica", 13],
  ["gaming-esports", 14],
  ["apps-software-ia", 8],
  ["ecommerce-moda-belleza", 8],
  ["comida-bebidas", 6],
  ["educacion-infoproductos", 9],
  ["deportes", 8],
  ["finanzas-fintech", 3],
  ["apuestas-casino", 3],
  ["salud-suplementos", 2],
  ["medios", 3],
  ["tecnologia-telecom", 4],
  ["viajes", 1],
]

const TIPOS_ORG: [TipoOrganizacion, number][] = [
  ["agencia-marketing", 22],
  ["marca", 18],
  ["startup-app", 10],
  ["sello-distribuidora", 7],
  ["artista", 7],
  ["management-streamers", 8],
  ["streamer-creador", 10],
  ["infoproductor", 8],
  ["club-liga-evento", 4],
  ["medio-podcast", 3],
  ["otro", 3],
]

const PLATAFORMAS: [PlataformaDirecto, number][] = [
  ["youtube", 35],
  ["twitch", 30],
  ["kick", 20],
  ["tiktok", 15],
  ["facebook", 10],
]

/** Tiempo típico por toma, en ms (mediana). */
const MS_TOMA: Partial<Record<PasoId, number>> = {
  cuenta: 8_000,
  objetivo: 9_500,
  nichos: 13_000,
  fandom: 16_000,
  redes: 7_000,
  basicos: 6_500,
  directo: 12_000,
  canal: 14_000,
  render: 2_400,
  "tipo-org": 11_000,
  org: 22_000,
  promocion: 18_000,
  alcance: 14_000,
  "render-agencia": 30_000,
}

/** Creadores que §4.2 marca como «oportunidad»: ninguna campaña simulada los usa. */
const OPORTUNIDADES_DEMO: readonly CreadorId[] = ["cre_camila_quispe", "cre_mateo_brisa"]

/** Categoría de Explorar de una campaña simulada. */
const CATEGORIA_SECTOR = (sector: Sector): Categoria =>
  sector === "musica"
    ? "musica"
    : sector === "entretenimiento-creadores"
      ? "influencers"
      : sector === "educacion-infoproductos"
        ? "infoproductores"
        : "marcas"

const idiomaDePais = (pais: CountryCode): IdiomaAudiencia =>
  pais === "BR" ? "pt" : pais === "US" ? "en" : "es"

/* ---------------------------------------------------------------------------
   1. Perfil de onboarding por usuario
   --------------------------------------------------------------------------- */

interface Borrador {
  user: AdminUser
  ob: OnboardingAdmin
}

function pasosDe(
  tipo: "clipero" | "agencia",
  objetivo: ObjetivoUso | undefined,
  expres: boolean
) {
  if (tipo === "agencia") return ["tipo-org", "org", "promocion", "alcance"] as PasoId[]
  if (expres) return ["redes", "basicos"] as PasoId[]
  const rama: PasoId[] =
    objetivo === "mis-videos" ? ["directo", "canal"] : ["nichos", "fandom"]
  return ["objetivo", ...rama, "redes", "basicos"] as PasoId[]
}

function simularPerfil(
  rnd: Rnd,
  user: AdminUser,
  idx: number,
  hoy: string
): OnboardingAdmin | null {
  if (user.plan === "interno") return null
  // Cuentas sin instrumentar (anteriores al onboarding)
  if (rnd() >= 0.72) return null

  const creada = ms(user.createdAt)
  const pais = user.countryCode
  const agencia = user.plan === "free" && user.projects === 0 && rnd() < 0.09
  const tipo = agencia ? "agencia" : "clipero"
  const objetivo: ObjetivoUso | undefined = agencia
    ? undefined
    : user.projects > 0
      ? elegir(rnd, [
          ["mis-videos", 55],
          ["ambos", 35],
          ["campanas", 10],
        ])
      : elegir(rnd, [
          ["campanas", 70],
          ["ambos", 20],
          ["mis-videos", 10],
        ])
  const expres = objetivo === "campanas" && rnd() < 0.06
  const oauth = rnd() < 0.05
  const tomas = [
    ...(oauth ? (["cuenta"] as PasoId[]) : []),
    ...pasosDe(tipo, objetivo, expres),
  ]
  const render: PasoId = agencia ? "render-agencia" : "render"
  const dispositivo = rnd() < 0.64 ? "movil" : "escritorio"
  const locale =
    pais === "BR"
      ? rnd() < 0.9
        ? "pt"
        : "en"
      : pais === "US"
        ? "en"
        : rnd() < 0.94
          ? "es"
          : "en"

  const ob: OnboardingAdmin = {
    tipo,
    objetivo,
    modo: expres ? "expres" : "normal",
    estado: "sin-empezar",
    pasosVistos: [],
    pasosRespondidos: [],
    pasosSaltados: [],
    msPorPaso: {},
    textoAcelerado: 0,
    saltoIntro: false,
    dispositivo,
    locale,
    verticales: [],
    aunNoSe: false,
    verticalesInferidas: [],
    juegos: [],
    creadoresFan: [],
    creadoresPendientes: 0,
    plataformasQueVe: [],
    plataformasDirecto: [],
    verticalesCanal: [],
    redes: [],
    idiomas: [],
    confianzaBaja: false,
    paraTi: [],
    consiente: { estadisticas: true, informesSector: false, novedades: false },
    revocoEn30d: false,
    completitud: 0,
  }

  // ¿Empezó?
  if (rnd() < 0.06) return ob
  const retraso = rnd() < 0.9 ? (1 + rnd() * 30) * 60_000 : (1 + rnd() * 4) * DIA
  const inicio = creada + retraso
  if (!LIMITE_HOY(hoy, inicio)) return ob
  ob.iniciadoEn = iso(inicio)

  const r = rnd()
  const completa = r < (agencia ? 0.64 : 0.76)
  const pospone = !completa && r < (agencia ? 0.8 : 0.89)
  const corte = completa
    ? tomas.length
    : Math.min(
        tomas.length - 1,
        elegir(rnd, [
          [0, 22],
          [1, 30],
          [2, 22],
          [3, 16],
          [4, 10],
        ])
      )

  const saltaFandom = rnd() < 0.45
  let t = inicio
  const acelera = dispositivo === "movil" ? 0.45 : 0.36
  for (let i = 0; i <= Math.min(corte, tomas.length - 1); i++) {
    const paso = tomas[i]
    ob.pasosVistos.push(paso)
    const dura = Math.round(lognormal(rnd, MS_TOMA[paso] ?? 10_000, 0.45))
    if (i < corte) {
      ob.msPorPaso[paso] = dura
      t += dura
      if (paso === "fandom" && saltaFandom) ob.pasosSaltados.push(paso)
      else ob.pasosRespondidos.push(paso)
      if (rnd() < acelera) ob.textoAcelerado += 1
    } else {
      // La toma en la que se quedó: tiempo parcial
      ob.msPorPaso[paso] = Math.round(dura * 0.6)
      t += dura * 0.6
    }
  }
  if (rnd() < 0.16) ob.saltoIntro = true
  ob.ultimoPaso = completa ? render : tomas[corte]

  // Respuestas de lo que llegó a contestar
  const respondio = (paso: PasoId) => ob.pasosRespondidos.includes(paso)
  const vio = (paso: PasoId) => ob.pasosVistos.includes(paso)

  if (!agencia) {
    if (respondio("nichos")) {
      if (rnd() < 0.09) ob.aunNoSe = true
      else {
        const sesgo = SESGO_PAIS[pais] ?? {}
        const k = elegir(rnd, [
          [1, 22],
          [2, 30],
          [3, 25],
          [4, 13],
          [5, 10],
        ])
        ob.verticales = elegirVarios(
          rnd,
          VERTICALES_BASE.map(([v, w]) => [v, w * (sesgo[v] ?? 1)] as const),
          k
        )
        if (ob.verticales.includes("gaming") && rnd() < 0.6) {
          ob.juegos = elegirVarios(
            rnd,
            juegosDe(pais).map((j, i) => [j, 8 - i] as const),
            1 + Math.floor(rnd() * 3)
          ) as JuegoId[]
        }
      }
    }
    if (respondio("fandom")) {
      const catalogo = CREADORES.filter((c) => c.sugerible)
      const k = 1 + Math.floor(rnd() * 4)
      ob.creadoresFan = elegirVarios(
        rnd,
        catalogo.map(
          (c) =>
            [
              c.id,
              c.fansDemo *
                (c.pais === pais ? 1.6 : 1) *
                (c.verticales.some((v) => ob.verticales.includes(v)) ? 1.8 : 1),
            ] as const
        ),
        k
      )
      if (rnd() < 0.12) ob.creadoresPendientes = 1
      ob.plataformasQueVe = dimensionesDe(ob.creadoresFan, CREADORES).plataformas
    }
    if (respondio("directo")) {
      if (rnd() < 0.25) ob.plataformasDirecto = ["no-transmito"]
      else {
        const sesgoKick = pais === "AR" || pais === "CO" ? 2 : 1
        ob.plataformasDirecto = elegirVarios(
          rnd,
          PLATAFORMAS.map(([p, w]) => [p, p === "kick" ? w * sesgoKick : w] as const),
          1 + Math.floor(rnd() * 2)
        ) as PlataformaDirectoOnboarding[]
        ob.frecuencia = elegir<FrecuenciaDirecto>(rnd, [
          ["casi-diario", 12],
          ["3-6-semana", 28],
          ["1-2-semana", 32],
          ["algunas-mes", 18],
          ["ocasional", 10],
        ])
        if (rnd() < 0.7)
          ob.duracion = elegir<DuracionDirecto>(rnd, [
            ["lt-1h", 10],
            ["1-3h", 45],
            ["3-6h", 35],
            ["6h-plus", 10],
          ])
      }
    }
    if (respondio("canal")) {
      ob.verticalesCanal = elegirVarios(rnd, VERTICALES_BASE, 1 + Math.floor(rnd() * 3))
      if (rnd() < 0.55) {
        const plataforma =
          (ob.plataformasDirecto.find((p) => p !== "no-transmito") as
            PlataformaDirecto | undefined) ?? "youtube"
        ob.enlaceCanal = {
          plataforma,
          handle: user.email.split("@")[0].replace(/[^a-z0-9]/g, "_"),
        }
      }
      if (rnd() < 0.7)
        ob.interesCampanaPropia = elegir<InteresCampanaPropia>(rnd, [
          ["si", 25],
          ["mas-adelante", 45],
          ["no", 30],
        ])
    }
    if (respondio("redes")) {
      if (rnd() < 0.07) ob.redes = ["sin-cuenta"]
      else {
        const redes: RedPublicacion[] = elegirVarios(
          rnd,
          REDES_PESO,
          elegir(rnd, [
            [1, 40],
            [2, 38],
            [3, 22],
          ])
        )
        if (rnd() < 0.04) redes.push("otra")
        ob.redes = redes
      }
      const cuentas: CuentaPublicacion[] = []
      const red = ob.redes.find((x): x is SocialId => x !== "otra" && x !== "sin-cuenta")
      if (red) {
        const conectada = rnd() < 0.32
        if (conectada) {
          const seguidores = Math.round(lognormal(rnd, 4_000, 1.4))
          const antes = rnd() < 0.2
          cuentas.push({
            red,
            handle: "x",
            seguidoresMedidos: seguidores,
            tramoDeclarado: antes
              ? TRAMOS_SEGUIDORES[
                  Math.max(
                    0,
                    Math.min(
                      TRAMOS_SEGUIDORES.length - 1,
                      TRAMOS_SEGUIDORES.indexOf(tramoSeguidoresDe(seguidores)) +
                        elegir(rnd, [
                          [0, 55],
                          [1, 25],
                          [-1, 10],
                          [2, 10],
                        ])
                    )
                  )
                ]
              : undefined,
          })
          ob.seguidoresMedidos = seguidores
          ob.paisPublicoMedido = rnd() < 0.85 ? pais : pais === "PE" ? "MX" : "PE"
        } else if (rnd() < 0.28) {
          cuentas.push({
            red,
            handle: "x",
            tramoDeclarado: elegir<TramoSeguidores>(rnd, [
              ["empiezo", 25],
              ["lt-1k", 35],
              ["1k-10k", 25],
              ["10k-100k", 10],
              ["100k-1m", 3],
              ["1m-plus", 2],
            ]),
          })
        }
        ob.tramoDeclarado = cuentas[0]?.tramoDeclarado
      }
      ob.confianzaBaja = confianzaBaja({
        verticales: ob.aunNoSe ? "aun-no-se" : ob.verticales,
        redes: ob.redes,
        cuentas,
      })
    }
    if (respondio("basicos") || vio("basicos")) {
      const base = idiomaDePais(pais)
      ob.idiomas = rnd() < 0.12 && base !== "en" ? [base, "en"] : [base]
    }
  } else {
    ob.tipoOrganizacion = elegir(rnd, TIPOS_ORG)
    if (respondio("org")) {
      ob.dominioCoincide = rnd() < 0.35
      ob.webValida = rnd() < 0.92
    }
    if (respondio("promocion")) {
      const tipoOrg = ob.tipoOrganizacion
      ob.sector =
        tipoOrg === "streamer-creador" || tipoOrg === "management-streamers"
          ? "entretenimiento-creadores"
          : tipoOrg === "sello-distribuidora" || tipoOrg === "artista"
            ? "musica"
            : elegir(rnd, [...SECTORES_CAMPANA, ["cripto-trading", 2], ["alcohol", 2]])
      const compatibles = SECTOR_VERTICALES[ob.sector]
      ob.verticalesMaterial = elegirVarios(
        rnd,
        [
          ...compatibles.principales.map((v) => [v, 2] as const),
          ...compatibles.secundarias.map((v) => [v, 1] as const),
        ],
        1 + Math.floor(rnd() * 2)
      )
      if (rnd() < 0.2) {
        const candidatos = CREADORES.filter(
          (c) =>
            c.sugerible && c.verticales.some((v) => ob.verticalesMaterial!.includes(v))
        )
        if (candidatos.length)
          ob.creadorId = candidatos[Math.floor(rnd() * candidatos.length)].id
      }
    }
    if (respondio("alcance")) {
      ob.redesObjetivo = elegirVarios(rnd, REDES_PESO, 1 + Math.floor(rnd() * 3))
      const otro = elegir(rnd, PAISES_CAMPANA)
      ob.paisesObjetivo = rnd() < 0.3 && otro !== pais ? [pais, otro] : [pais]
      ob.idiomasObjetivo = [...new Set(ob.paisesObjetivo.map(idiomaDePais))]
      ob.tramoPresupuesto =
        rnd() < 0.08
          ? "no-decir"
          : tramoPresupuestoDe(Math.round(lognormal(rnd, 1_200, 1)))
    }
  }

  // Cierre del flujo
  if (completa) {
    const renderMs = Math.round(lognormal(rnd, MS_TOMA[render] ?? 3_000, 0.3))
    ob.pasosVistos.push(render)
    ob.msPorPaso[render] = renderMs
    t += renderMs
    if (LIMITE_HOY(hoy, t)) {
      ob.estado = "completado"
      ob.completadoEn = iso(t)
    } else {
      ob.estado = "en-curso"
    }
  } else if (pospone) {
    ob.estado = "pospuesto"
    ob.pospuestoEn = iso(t)
    ob.pasoAbandono = tomas[corte]
    // Retomados: vuelven desde la tarjeta del panel y terminan
    if (rnd() < 0.38) {
      const vuelta = t + (1 + rnd() * 19) * DIA
      if (LIMITE_HOY(hoy, vuelta)) {
        for (const paso of tomas.slice(corte)) {
          if (!ob.pasosVistos.includes(paso)) ob.pasosVistos.push(paso)
          if (!ob.pasosRespondidos.includes(paso)) ob.pasosRespondidos.push(paso)
        }
        ob.pasosVistos.push(render)
        ob.estado = "completado"
        ob.completadoEn = iso(vuelta)
        ob.ultimoPaso = render
      }
    }
  } else {
    ob.estado = "en-curso"
  }
  ob.msTotal = Object.values(ob.msPorPaso).reduce((n, x) => n + (x ?? 0), 0)

  if (ob.estado === "completado") {
    ob.consiente = {
      estadisticas: rnd() < 0.94,
      informesSector: rnd() < 0.27,
      novedades: rnd() < 0.33,
    }
    ob.revocoEn30d = rnd() < 0.03
    if (rnd() < 0.4) {
      ob.comoNosConociste = elegir<ComoNosConociste>(rnd, [
        ["video-creador", 24],
        ["amigo", 20],
        ["tiktok", 22],
        ["instagram", 10],
        ["youtube", 9],
        ["anuncio", 5],
        ["buscador", 5],
        ["evento", 2],
        ["otro", 3],
      ])
      ob.comoLlegasteSinNormalizar = rnd() < 0.08
    }
  } else {
    ob.consiente = { estadisticas: rnd() < 0.96, informesSector: false, novedades: false }
  }

  if (agencia && ob.estado === "completado" && ob.completadoEn && rnd() < 0.85) {
    ob.solicitud = simularSolicitud(rnd, ob, ob.completadoEn, hoy)
  }

  ob.completitud = completitud({
    tipo,
    pais,
    idiomas: ob.idiomas,
    clipero: {
      objetivo,
      verticales: ob.aunNoSe ? "aun-no-se" : ob.verticales,
      redes: ob.redes,
      creadoresFan: ob.creadoresFan,
      cuentas:
        ob.seguidoresMedidos != null
          ? [{ red: "tiktok", handle: "x", seguidoresMedidos: ob.seguidoresMedidos }]
          : ob.tramoDeclarado
            ? [{ red: "tiktok", handle: "x", tramoDeclarado: ob.tramoDeclarado }]
            : [],
    },
    creador: {
      plataformasDirecto: ob.plataformasDirecto,
      frecuencia: ob.frecuencia,
      verticalesCanal: ob.verticalesCanal,
      enlaceCanal: ob.enlaceCanal ? { ...ob.enlaceCanal, verificado: false } : undefined,
    },
    agencia: {
      tipoOrganizacion: ob.tipoOrganizacion,
      organizacion: respondio("org") ? "Organización" : undefined,
      web: ob.webValida ? "https://ejemplo.com" : undefined,
      pais: respondio("org") ? pais : undefined,
      sector: ob.sector,
      verticalesMaterial: ob.verticalesMaterial,
      redesObjetivo: ob.redesObjetivo,
      paisesObjetivo: ob.paisesObjetivo,
      idiomasObjetivo: ob.idiomasObjetivo,
      solicitudEnviadaEn: ob.solicitud?.enviadaEn,
    },
  })
  void idx
  return ob
}

function simularSolicitud(
  rnd: Rnd,
  ob: OnboardingAdmin,
  enviadaEn: string,
  hoy: string
): SolicitudAgenciaAdmin {
  const s: SolicitudAgenciaAdmin = { enviadaEn, estado: "pendiente" }
  const horas = lognormal(rnd, 30, 0.7)
  const resuelta = ms(enviadaEn) + horas * 3_600_000
  if (!LIMITE_HOY(hoy, resuelta)) return s
  s.resueltaEn = iso(resuelta)
  const regulado = ob.sector ? SECTOR_REGULADO[ob.sector] : false
  const aprobada = rnd() < (regulado ? 0.45 : 0.72) && ob.webValida !== false
  if (!aprobada) {
    s.estado = "rechazada"
    s.motivo =
      ob.webValida === false
        ? "web-no-verificable"
        : elegir<MotivoRechazo>(rnd, [
            ["web-no-verificable", 30],
            ["datos-incompletos", 25],
            ["sector-no-admitido", regulado ? 40 : 8],
            ["duplicada", 10],
            ["otro", 8],
          ])
    return s
  }
  s.estado = "aprobada"
  if (rnd() < 0.58) {
    const primera = resuelta + (2 + rnd() * 18) * DIA
    if (LIMITE_HOY(hoy, primera)) {
      s.primeraCampanaEn = iso(primera)
      const referencia = { "lt-500": 400, "500-2k": 1_000, "2k-10k": 4_000 }
      const base =
        referencia[ob.tramoPresupuesto as keyof typeof referencia] ??
        (ob.tramoPresupuesto === "no-decir" ? 800 : 12_000)
      if (ms(hoy) - resuelta >= 60 * DIA)
        s.gastado60d = Math.round(base * (0.3 + rnd() * 0.6))
    }
  }
  return s
}

/* ---------------------------------------------------------------------------
   2. Campañas simuladas
   --------------------------------------------------------------------------- */

const INICIO_CAMPANAS = ms("2026-03-01T00:00:00.000Z")

function simularCampanas(rnd: Rnd, hoy: string): Campana[] {
  const ultimo = ms(hoy) - DIA / 2
  const salida: Campana[] = []
  for (let i = 0; i < 64; i++) {
    const sector = elegir(rnd, SECTORES_CAMPANA)
    const compatibles = SECTOR_VERTICALES[sector]
    const vertical = compatibles.principales[
      Math.floor(rnd() * compatibles.principales.length)
    ] as Vertical
    const secundaria =
      compatibles.secundarias.length && rnd() < 0.3
        ? compatibles.secundarias[Math.floor(rnd() * compatibles.secundarias.length)]
        : undefined
    const paises =
      rnd() < 0.68
        ? elegirVarios(rnd, PAISES_CAMPANA, rnd() < 0.25 ? 2 : 1)
        : ([] as CountryCode[])
    const idiomas =
      paises.length && rnd() < 0.55 ? [...new Set(paises.map(idiomaDePais))] : []
    const redes = elegirVarios(
      rnd,
      REDES_PESO.filter(([r]) => r !== "linkedin"),
      elegir(rnd, [
        [1, 30],
        [2, 45],
        [3, 25],
      ])
    )
    const presupuesto = Math.min(
      12_000,
      Math.max(300, Math.round(lognormal(rnd, 1_800, 0.7) / 50) * 50)
    )
    const ref = CPM_REFERENCIA[sector] ?? { min: 0.5, max: 1.5 }
    const medio = (ref.min + ref.max) / 2
    const cpm = Math.round(medio * (0.55 + rnd() * 0.9) * 100) / 100
    const inicio = INICIO_CAMPANAS + rnd() * (ultimo - INICIO_CAMPANAS)
    const fin = inicio + (21 + Math.floor(rnd() * 36)) * DIA
    const creador =
      (sector === "entretenimiento-creadores" || sector === "gaming-esports") &&
      rnd() < 0.25
        ? CREADORES.find(
            (c) =>
              c.sugerible &&
              !c.campanaId &&
              !OPORTUNIDADES_DEMO.includes(c.id) &&
              c.verticales.includes(vertical)
          )
        : undefined
    const activa = fin > ms(hoy)
    const c: Campana = {
      id: `cmp_sim_${String(i + 1).padStart(3, "0")}`,
      titulo: `Campaña simulada ${i + 1}`,
      marca: `Marca simulada ${i + 1}`,
      descripcion: "Campaña simulada del backoffice.",
      categoria: CATEGORIA_SECTOR(sector),
      creadaPor: { perfil: "agencia", nombre: `Agencia simulada ${i + 1}` },
      estado: activa ? (rnd() < 0.06 ? "pausada" : "activa") : "finalizada",
      destacada: false,
      privada: false,
      presupuesto,
      cpm,
      topePorVideoPct: 3 + Math.floor(rnd() * 8),
      minimoVistas: elegir(rnd, [
        [1_000, 50],
        [2_000, 35],
        [5_000, 15],
      ]),
      redes,
      material: "",
      requisitos: [],
      inicio: iso(inicio),
      fin: iso(fin),
      creadaEn: iso(inicio - DIA),
      vertical,
      verticalesSecundarias: secundaria ? [secundaria] : undefined,
      sector,
      paisesObjetivo: paises.length ? paises : undefined,
      idiomas: idiomas.length ? idiomas : undefined,
      creadorId: creador?.id,
    }
    if (esRegulada(c)) {
      c.regulado = true
      c.soloVerificados = true
    }
    salida.push(c)
  }
  return salida.sort((a, b) => a.inicio.localeCompare(b.inicio))
}

/* ---------------------------------------------------------------------------
   3. Envíos simulados y lo que se deduce de ellos
   --------------------------------------------------------------------------- */

const verticalesCampana = (c: Campana) => [
  ...(c.vertical ? [c.vertical] : []),
  ...(c.verticalesSecundarias ?? []),
]

const activaEn = (c: Campana, t: number) =>
  c.estado !== "finalizada" || ms(c.fin) > t ? ms(c.inicio) <= t && t < ms(c.fin) : false

/** Las tres de «Para ti» al terminar el onboarding, con la recomendación real. */
function paraTiDe(ob: OnboardingAdmin, pais: CountryCode, campanas: readonly Campana[]) {
  if (!ob.completadoEn) return []
  const t = ms(ob.completadoEn)
  const items = campanas
    .filter((c) => !c.privada && activaEn(c, t))
    .map((campana) => ({
      campana,
      liquidacion: { restante: campana.presupuesto },
      estado: "activa" as const,
    }))
  if (items.length === 0) return []
  const r = recomendarCampanas(items, {
    pais,
    idiomas: ob.idiomas,
    verificado: false,
    clipero: {
      verticales: ob.aunNoSe ? "aun-no-se" : ob.verticales,
      creadoresFan: ob.creadoresFan,
      redes: ob.redes,
      tolerancia: [],
    },
  })
  return r.recomendadas.slice(0, 3).map((x) => x.item.campana.id)
}

function simularEnvios(
  rnd: Rnd,
  borradores: readonly Borrador[],
  campanas: readonly Campana[],
  hoy: string
): Envio[] {
  const salida: Envio[] = []
  const cliperos = borradores.filter(
    ({ ob }) =>
      ob.tipo === "clipero" &&
      (ob.objetivo === "campanas" || ob.objetivo === "ambos") &&
      ob.completadoEn
  )
  for (const c of campanas) {
    const referencia = c.sector ? CPM_REFERENCIA[c.sector] : null
    const medio = referencia ? (referencia.min + referencia.max) / 2 : 1
    const atractivo = Math.min(1.5, Math.max(0.5, c.cpm / medio))
    const inicio = ms(c.inicio)
    const fin = Math.min(ms(c.fin), ms(hoy))
    if (fin <= inicio) continue
    const verticales = verticalesCampana(c)
    const participantes: { b: Borrador; clips: number; desde: number }[] = []
    for (const b of cliperos) {
      const { ob, user } = b
      const encaja =
        ob.verticales.some((v) => verticales.includes(v)) || (ob.aunNoSe && rnd() < 0.1)
      if (!encaja) continue
      if (!ob.redes.some((r) => c.redes.includes(r as SocialId))) continue
      if (c.paisesObjetivo?.length && !c.paisesObjetivo.includes(user.countryCode))
        continue
      if (c.idiomas?.length && !ob.idiomas.some((i) => c.idiomas!.includes(i))) continue
      const desde = Math.max(inicio, ms(ob.completadoEn!))
      if (desde >= fin) continue
      // Quien terminó hace mucho participa menos; «Para ti» empuja
      const antiguedad = (inicio - ms(ob.completadoEn!)) / DIA
      const decae = antiguedad > 0 ? Math.exp(-antiguedad / 150) : 1
      const empuje = ob.paraTi.includes(c.id) ? 0.2 : 0
      if (rnd() >= (0.3 * atractivo ** 1.5 + empuje) * decae) continue
      participantes.push({ b, clips: 1 + Math.floor(rnd() * 3 * atractivo), desde })
    }
    const totalClips = participantes.reduce((n, p) => n + p.clips, 0)
    if (totalClips === 0) continue
    const relleno = atractivo >= 1.1 ? 1.4 : atractivo < 0.8 ? 0.35 : 0.8
    const vistasMedianas = Math.max(
      c.minimoVistas * 0.8,
      Math.min(
        400_000,
        ((c.presupuesto / c.cpm) * 1000 * relleno) / Math.max(6, totalClips)
      )
    )
    const exponente = atractivo >= 1 ? 2.2 : 1.2
    for (const p of participantes) {
      for (let k = 0; k < p.clips; k++) {
        const enviadoEn = p.desde + (fin - p.desde) * rnd() ** exponente
        const reciente = ms(hoy) - enviadoEn < 2 * DIA
        const estado: EstadoEnvio = reciente
          ? rnd() < 0.6
            ? "en-revision"
            : "aprobado"
          : elegir(rnd, [
              ["aprobado", 84],
              ["rechazado", 10],
              ["en-revision", 6],
            ])
        const redes = p.b.ob.redes.filter((r): r is SocialId =>
          c.redes.includes(r as SocialId)
        )
        const [nombre, apellido = ""] = p.b.user.name.split(" ")
        const n = salida.length + 1
        salida.push({
          id: `env_sim_${String(n).padStart(4, "0")}`,
          campanaId: c.id,
          creador: `${nombre} ${apellido.charAt(0)}.`,
          userId: p.b.user.id,
          titulo: `Clip ${n}`,
          red: redes[Math.floor(rnd() * redes.length)] ?? c.redes[0],
          url: `https://clipealo.app/c/${c.id}/${n}`,
          vistas: Math.round(lognormal(rnd, vistasMedianas, 0.9)),
          estado,
          enviadoEn: iso(enviadoEn),
        })
      }
    }
  }
  return salida.sort((a, b) => a.enviadoEn.localeCompare(b.enviadoEn))
}

/* ---------------------------------------------------------------------------
   Punto de entrada
   --------------------------------------------------------------------------- */

export interface SimulacionOnboarding {
  campaigns: Campana[]
  submissions: Envio[]
}

/**
 * Añade a cada usuario su onboarding, su tipo de cuenta y sus fechas de envío,
 * y devuelve las campañas (semillas + simuladas) y los envíos (semillas +
 * simulados). Muta `users` en su sitio, como el resto de `mock-data.ts`.
 */
export function simularOnboarding(users: AdminUser[], hoy: string): SimulacionOnboarding {
  const rndPerfil = seededNoise(1509)
  const rndCampanas = seededNoise(5151)
  const rndEnvios = seededNoise(6161)

  const borradores: Borrador[] = []
  users.forEach((user, idx) => {
    const ob = simularPerfil(rndPerfil, user, idx, hoy)
    if (user.plan !== "interno") user.accountType = ob?.tipo ?? "clipero"
    if (!ob) return
    user.onboarding = ob
    borradores.push({ user, ob })
  })

  const simuladas = simularCampanas(rndCampanas, hoy)
  const campaigns = [...campanasSemilla, ...simuladas]

  for (const b of borradores) b.ob.paraTi = paraTiDe(b.ob, b.user.countryCode, campaigns)

  const envios = simularEnvios(rndEnvios, borradores, simuladas, hoy)

  // Lo que se deduce de los envíos: fechas y verticales inferidas (2+ aprobados)
  const verticalDe = new Map(simuladas.map((c) => [c.id, c.vertical]))
  const porUsuario = new Map<string, Envio[]>()
  for (const e of envios) {
    if (!e.userId) continue
    const lista = porUsuario.get(e.userId) ?? []
    lista.push(e)
    porUsuario.set(e.userId, lista)
  }
  for (const b of borradores) {
    const propios = porUsuario.get(b.user.id)
    if (!propios?.length) continue
    b.user.firstSubmissionAt = propios[0].enviadoEn
    b.user.lastSubmissionAt = propios.at(-1)!.enviadoEn
    const aprobados = new Map<Vertical, number>()
    for (const e of propios) {
      const v = verticalDe.get(e.campanaId)
      if (e.estado === "aprobado" && v) aprobados.set(v, (aprobados.get(v) ?? 0) + 1)
    }
    b.ob.verticalesInferidas = [...aprobados].filter(([, n]) => n >= 2).map(([v]) => v)
  }

  return { campaigns, submissions: [...enviosSemilla, ...envios] }
}
