"use client"

import * as React from "react"
import { useLocale } from "next-intl"

import type { Locale } from "@/i18n/routing"
import { TIPOS_CUENTA, type TipoCuenta } from "@/lib/auth"
import {
  EDADES,
  IDIOMAS_AUDIENCIA,
  PLATAFORMAS_DIRECTO,
  TEMAS,
  TEMAS_MAX,
  TONOS,
  perfilInicial,
  publicoInicial,
  validarCanal,
  CANAL_MAX,
  type IdiomaAudiencia,
  type PerfilCanal,
  type PublicoCanal,
} from "@/lib/ajustes"
import { CUENTA_DEMO, type BorradorCampana } from "@/lib/campanas"
import { COUNTRY_CODES } from "@/lib/countries"
import {
  ESTADOS_ONBOARDING,
  FLUJOS_ONBOARDING,
  MODOS_ONBOARDING,
  ONBOARDING_VERSION,
  PASOS,
  PROGRESO_VACIO,
  completitudDetalle,
  cuentasDelPerfil,
  precision,
  type CampoId,
  type Cuenta,
  type EventoOnboarding,
  type FlujoOnboarding,
  type Fuente,
  type MetaDato,
  type ModoOnboarding,
  type PaisResidencia,
  type PasoId,
  type ProgresoOnboarding,
  type RespuestasAgencia,
  type RespuestasClipero,
  type RespuestasCreador,
} from "@/lib/onboarding"
import {
  FINALIDADES,
  registrar as registrarConsentimiento,
  vigente,
  type Finalidad,
  type OrigenConsentimiento,
  type RegistroConsentimiento,
} from "@/lib/privacidad"
import { SOCIAL_IDS, cuentaActiva } from "@/lib/social"
import { useCuentasSociales } from "@/hooks/use-cuentas-sociales"
import {
  AUN_NO_SE,
  DISPONIBILIDAD,
  DURACIONES_DIRECTO,
  ETIQUETAS_SEGURIDAD,
  EXPERIENCIA,
  FRECUENCIAS_DIRECTO,
  HERRAMIENTAS,
  INTERES_CAMPANA_PROPIA,
  JUEGOS,
  MOTIVACIONES,
  MOTIVOS_PAUSA,
  OBJETIVOS_USO,
  PLATAFORMAS_DIRECTO_ONBOARDING,
  REDES_PUBLICACION,
  ROLES,
  SECTORES,
  TAXONOMIA_VERSION,
  TIPOS_ORGANIZACION,
  TRAMOS_ESPECTADORES,
  VERTICALES,
  esId,
  idsValidos,
} from "@/lib/taxonomia"

/**
 * La cuenta de la demo, sin backend: quién es, qué respondió en el onboarding
 * «Tu primer corte», sus consentimientos y lo que Ajustes › Perfil y Público
 * guardan. Es la única fuente de verdad del nombre, el correo, el país y las
 * respuestas: el onboarding, Ajustes, `UserNav` y el saludo del panel leen y
 * escriben aquí.
 *
 * Mismo patrón que `use-campanas.ts`: `useSyncExternalStore`, clave
 * `clipealo-cuenta-v1`, evento `clipealo:cuenta` más `storage` (entre
 * pestañas), caché del valor crudo y lectura en try/catch con `migrarCuenta`.
 *
 * - Sin nada guardado, la cuenta es la demo «Ana Ruiz» con el onboarding
 *   completado y respuestas coherentes con `perfilInicial` y `publicoInicial`.
 * - Las fechas se leen dentro de las acciones (que se llaman desde manejadores),
 *   nunca durante el render. Las transiciones puras están en `transicionesCuenta`
 *   y reciben la fecha: así se prueban sin reloj.
 * - Los tipos viven en `lib/onboarding.ts`; aquí solo se reexportan.
 * - Con la API real, cada acción pasa a ser una mutación.
 */

export type {
  CampoId,
  CreadorPendiente,
  Cuenta,
  EstadoOnboarding,
  EventoOnboarding,
  FlujoOnboarding,
  Fuente,
  MetaDato,
  MicroPreguntas,
  ModoOnboarding,
  PaisResidencia,
  PasoId,
  ProgresoOnboarding,
  RespuestasAgencia,
  RespuestasClipero,
  RespuestasCreador,
  SolicitudAgenciaDatos,
} from "@/lib/onboarding"
export { PROGRESO_VACIO } from "@/lib/onboarding"

export const CLAVE_CUENTA = "clipealo-cuenta-v1"
const EVENTO = "clipealo:cuenta"

/** Eventos guardados como mucho: solo ids y recuentos, pero el localStorage no es infinito. */
export const EVENTOS_MAX = 500
/** «Ahora no» en una micropregunta: vuelve a salir pasados estos días (§6.6). */
export const DIAS_MICRO_POSPUESTA = 7

/** Un evento del funnel (§7.7) con el momento en que ocurrió. */
export type EventoRegistrado = EventoOnboarding & { en: string }

/** Lo que se guarda: la `Cuenta` de §3.7 y el registro de eventos del onboarding. */
export interface CuentaGuardada extends Cuenta {
  eventos: EventoRegistrado[]
}

/** Valor que admite cada campo de `responder`. `undefined` borra una respuesta. */
export type ValorCampo<C extends CampoId> = C extends "tipo"
  ? TipoCuenta | null
  : C extends "mayorDeEdad"
    ? boolean
    : C extends "pais"
      ? PaisResidencia | null
      : C extends "idiomas"
        ? IdiomaAudiencia[]
        : C extends `clipero.${infer K}`
          ? K extends keyof RespuestasClipero
            ? RespuestasClipero[K] | undefined
            : never
          : C extends `creador.${infer K}`
            ? K extends keyof RespuestasCreador
              ? RespuestasCreador[K] | undefined
              : never
            : C extends `agencia.${infer K}`
              ? K extends keyof RespuestasAgencia
                ? RespuestasAgencia[K] | undefined
                : never
              : never

/* ---------------------------------------------------------------------------
   Cuenta demo
   --------------------------------------------------------------------------- */

/** Fechas fijas de la demo: la cuenta ya existía antes del «hoy» de las campañas. */
const DEMO_CREADA = "2026-08-18T10:12:00.000Z"
const DEMO_COMPLETADA = "2026-08-18T10:13:24.000Z"

const metaDemo: MetaDato = { fuente: "declarado", en: DEMO_COMPLETADA }

const consentimientosDemo = (
  [
    ["terminos", "auth.signup.accept"],
    ["privacidad", "auth.signup.accept"],
    ["mayor-edad", "auth.signup.adult.label"],
    ["estadisticas", "auth.signup.privacyNote"],
  ] as const
).reduce<RegistroConsentimiento[]>(
  (r, [finalidad, textoId]) =>
    registrarConsentimiento(r, {
      finalidad,
      valor: true,
      origen: "registro",
      locale: "es",
      textoId,
      en: DEMO_CREADA,
    }),
  []
)

/**
 * «Ana Ruiz»: clipera de las dos cosas, de Perú, que clipea podcasts y negocios
 * (los temas de `publicoInicial`) y publica en YouTube, TikTok e Instagram. Con
 * el onboarding completado: Ajustes, el panel y el OAuth de `login.spec` siguen
 * como antes.
 */
export const CUENTA_VACIA: CuentaGuardada = {
  nombre: CUENTA_DEMO.nombre,
  correo: "ana@estudio.co",
  tipo: "clipero",
  creadaEn: DEMO_CREADA,
  mayorDeEdad: true,
  // Cobró un retiro antes de que existiera la verificación con proveedor: sin
  // verificar, no ve campañas reguladas
  verificado: false,
  pais: perfilInicial.pais,
  idiomas: [publicoInicial.idioma],
  perfilCanal: perfilInicial,
  publico: publicoInicial,
  clipero: {
    objetivo: "ambos",
    // Contestada: con 12 clips y 4 proyectos publicados, tratarla de novata en
    // Formación (la ruta «De no haber editado nunca…») no se sostenía
    experiencia: "regular",
    verticales: [...publicoInicial.temas],
    juegos: [],
    subverticales: {},
    creadoresFan: [],
    plataformasQueVe: [],
    redes: ["youtube", "tiktok", "instagram"],
    cuentas: [],
    motivaciones: [],
    tolerancia: [],
    herramientas: [],
    comoNosConociste: { chips: [] },
  },
  creador: { plataformasDirecto: [...perfilInicial.plataformas] },
  agencia: {},
  meta: {
    tipo: metaDemo,
    mayorDeEdad: metaDemo,
    pais: metaDemo,
    idiomas: metaDemo,
    "clipero.objetivo": metaDemo,
    "clipero.experiencia": metaDemo,
    "clipero.verticales": metaDemo,
    "clipero.redes": metaDemo,
    "creador.plataformasDirecto": metaDemo,
  },
  onboarding: {
    ...PROGRESO_VACIO,
    flujo: "clipero",
    estado: "completado",
    pasosVistos: ["objetivo", "nichos", "fandom", "redes", "basicos", "render"],
    pasosRespondidos: ["objetivo", "nichos", "redes", "basicos"],
    pasosSaltados: ["fandom"],
    msPorPaso: {
      objetivo: 9200,
      nichos: 21400,
      fandom: 6100,
      redes: 11800,
      basicos: 8900,
    },
    animacionVista: true,
    iniciadoEn: DEMO_CREADA,
    completadoEn: DEMO_COMPLETADA,
    celebrado: true,
  },
  consentimientos: consentimientosDemo,
  microPreguntas: { ultimaEn: null, pospuestas: {}, descartadas: [] },
  respuestasLibres: {},
  borradorCampana: null,
  eventos: [],
}

/* ---------------------------------------------------------------------------
   Utilidades de presentación
   --------------------------------------------------------------------------- */

/** «Ana Ruiz» → «AR»; «clipealo» → «CL». Para el avatar sin foto. */
export function inicialesDe(nombre: string): string {
  const palabras = nombre.trim().split(/\s+/).filter(Boolean)
  if (!palabras.length) return ""
  const primera = (p: string) => Array.from(p)[0] ?? ""
  const letras =
    palabras.length > 1
      ? primera(palabras[0]) + primera(palabras[palabras.length - 1])
      : Array.from(palabras[0]).slice(0, 2).join("")
  return letras.toLocaleUpperCase()
}

/** «Ana Ruiz» → «Ana». Para saludar. */
export const primerNombre = (nombre: string) => nombre.trim().split(/\s+/)[0] ?? ""

/**
 * Nombre de canal inicial de una cuenta nueva a partir del nombre o del correo:
 * sin tildes, en minúsculas y con los caracteres de `validarCanal`. Vacío si
 * ninguno vale: Ajustes › Perfil pedirá uno.
 */
export function canalDesde(nombre: string, correo: string): string {
  const limpiar = (texto: string) =>
    texto
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ".")
      .replace(/[^a-z0-9._]/g, "")
      .slice(0, CANAL_MAX)
  for (const candidato of [limpiar(nombre), limpiar(correo.split("@")[0] ?? "")]) {
    if (!validarCanal(candidato)) return candidato
  }
  return ""
}

/* ---------------------------------------------------------------------------
   Migración: lo leído del localStorage se limpia contra los catálogos
   --------------------------------------------------------------------------- */

type Objeto = Record<string, unknown>
const esObjeto = (x: unknown): x is Objeto =>
  !!x && typeof x === "object" && !Array.isArray(x)

/** Deja en `obj` solo ids válidos: listas contra su catálogo y valores únicos que existan. */
function limpiarRespuestas(
  valor: unknown,
  listas: Record<string, readonly string[]>,
  unicos: Record<string, readonly string[]>
): Objeto {
  if (!esObjeto(valor)) return {}
  const r: Objeto = { ...valor }
  for (const [clave, catalogo] of Object.entries(listas))
    if (clave in r) r[clave] = idsValidos(catalogo, r[clave])
  for (const [clave, catalogo] of Object.entries(unicos))
    if (clave in r && !esId(catalogo, r[clave])) delete r[clave]
  return r
}

const esCreadorFan = (x: unknown) =>
  (typeof x === "string" && x.startsWith("cre_")) ||
  (esObjeto(x) && x.pendiente === true && typeof x.texto === "string")

function migrarClipero(valor: unknown): Partial<RespuestasClipero> {
  const r = limpiarRespuestas(
    valor,
    {
      juegos: JUEGOS,
      redes: REDES_PUBLICACION,
      plataformasQueVe: PLATAFORMAS_DIRECTO,
      motivaciones: MOTIVACIONES,
      tolerancia: ETIQUETAS_SEGURIDAD,
      herramientas: HERRAMIENTAS,
    },
    {
      objetivo: OBJETIVOS_USO,
      experiencia: EXPERIENCIA,
      disponibilidad: DISPONIBILIDAD,
      motivoPausa: MOTIVOS_PAUSA,
    }
  )
  if ("verticales" in r && r.verticales !== AUN_NO_SE)
    r.verticales = idsValidos(VERTICALES, r.verticales)
  if ("creadoresFan" in r)
    r.creadoresFan = Array.isArray(r.creadoresFan)
      ? r.creadoresFan.filter(esCreadorFan)
      : []
  return r as Partial<RespuestasClipero>
}

const migrarCreador = (valor: unknown) =>
  limpiarRespuestas(
    valor,
    { plataformasDirecto: PLATAFORMAS_DIRECTO_ONBOARDING, verticalesCanal: VERTICALES },
    {
      frecuencia: FRECUENCIAS_DIRECTO,
      duracion: DURACIONES_DIRECTO,
      espectadores: TRAMOS_ESPECTADORES,
      interesCampanaPropia: INTERES_CAMPANA_PROPIA,
    }
  ) as Partial<RespuestasCreador>

const migrarAgencia = (valor: unknown) =>
  limpiarRespuestas(
    valor,
    {
      verticalesMaterial: VERTICALES,
      redesObjetivo: SOCIAL_IDS,
      paisesObjetivo: COUNTRY_CODES,
      idiomasObjetivo: IDIOMAS_AUDIENCIA,
    },
    { tipoOrganizacion: TIPOS_ORGANIZACION, sector: SECTORES, rol: ROLES }
  ) as Partial<RespuestasAgencia>

function migrarPerfil(valor: unknown): PerfilCanal {
  if (!esObjeto(valor)) return perfilInicial
  const avatar = valor.avatarUrl
  return {
    canal: typeof valor.canal === "string" ? valor.canal : perfilInicial.canal,
    // Un blob: no sobrevive a la recarga ni pasa a otra pestaña
    avatarUrl: typeof avatar === "string" && !avatar.startsWith("blob:") ? avatar : null,
    plataformas: Array.isArray(valor.plataformas)
      ? idsValidos(PLATAFORMAS_DIRECTO, valor.plataformas)
      : [...perfilInicial.plataformas],
    pais: esId(COUNTRY_CODES, valor.pais) ? valor.pais : perfilInicial.pais,
    // Una zona guardada de otro dispositivo puede no existir aquí: se comprueba
    zona: zonaValida(valor.zona) ? valor.zona : perfilInicial.zona,
  }
}

/** ¿El navegador conoce esa zona? Una IANA inventada haría estallar a `Intl`. */
function zonaValida(valor: unknown): valor is string {
  if (typeof valor !== "string" || !valor) return false
  try {
    new Intl.DateTimeFormat("en", { timeZone: valor })
    return true
  } catch {
    return false
  }
}

function migrarPublico(valor: unknown): PublicoCanal {
  if (!esObjeto(valor)) return publicoInicial
  return {
    temas: idsValidos(TEMAS, valor.temas).slice(0, TEMAS_MAX),
    edades: idsValidos(EDADES, valor.edades),
    idioma: esId(IDIOMAS_AUDIENCIA, valor.idioma) ? valor.idioma : publicoInicial.idioma,
    tono: esId(TONOS, valor.tono) ? valor.tono : publicoInicial.tono,
    ocultarPalabrotas: valor.ocultarPalabrotas === true,
  }
}

/**
 * Lo guardado se limpia; lo ilegible se da por no hecho.
 *
 * Devolvía el progreso de la cuenta demo, que está COMPLETADO: una cuenta con
 * el campo corrupto o de una versión que no lo tenía pasaba a haber terminado
 * la bienvenida sin haberla visto, y ya no había vuelta —ni la pantalla, ni la
 * tarjeta que rescata, ni el modo exprés del invitado, que se apoyan justo en
 * este estado—. Ante la duda, nada hecho: eso se arregla solo, contestando.
 */
function migrarProgreso(valor: unknown): ProgresoOnboarding {
  if (!esObjeto(valor)) return PROGRESO_VACIO
  const o = { ...PROGRESO_VACIO, ...valor } as Objeto
  const fecha = (x: unknown) => (typeof x === "string" ? x : null)
  const ms = esObjeto(o.msPorPaso)
    ? Object.fromEntries(
        Object.entries(o.msPorPaso).filter(
          ([paso, n]) => esId(PASOS, paso) && typeof n === "number" && n >= 0
        )
      )
    : {}
  return {
    version: ONBOARDING_VERSION,
    taxonomia: TAXONOMIA_VERSION,
    flujo: esId(FLUJOS_ONBOARDING, o.flujo) ? o.flujo : null,
    modo: esId(MODOS_ONBOARDING, o.modo) ? o.modo : "normal",
    estado: esId(ESTADOS_ONBOARDING, o.estado) ? o.estado : "sin-empezar",
    pasoActual: esId(PASOS, o.pasoActual) ? o.pasoActual : null,
    pasosVistos: idsValidos(PASOS, o.pasosVistos),
    pasosRespondidos: idsValidos(PASOS, o.pasosRespondidos),
    pasosSaltados: idsValidos(PASOS, o.pasosSaltados),
    msPorPaso: ms,
    textoAcelerado: typeof o.textoAcelerado === "number" ? o.textoAcelerado : 0,
    animacionVista: o.animacionVista === true,
    iniciadoEn: fecha(o.iniciadoEn),
    completadoEn: fecha(o.completadoEn),
    pospuestoEn: fecha(o.pospuestoEn),
    pasoAbandono: esId(PASOS, o.pasoAbandono) ? o.pasoAbandono : null,
    celebrado: o.celebrado === true,
    celebradoAprobacion: o.celebradoAprobacion === true,
  }
}

/**
 * Lo guardado, limpio y completo: `{ ...CUENTA_VACIA, ...guardado }` con cada
 * id comprobado contra su catálogo y `onboarding.version` y `taxonomia` al día.
 * Los ids de la taxonomía nunca se borran (solo se marcan obsoletos), así que
 * esto solo descarta datos corruptos o escritos a mano.
 */
export function migrarCuenta(guardado: unknown): CuentaGuardada {
  if (!esObjeto(guardado)) return CUENTA_VACIA
  const c = { ...CUENTA_VACIA, ...guardado } as Objeto
  const texto = (x: unknown, porDefecto: string) =>
    typeof x === "string" ? x : porDefecto
  const micro = esObjeto(c.microPreguntas) ? c.microPreguntas : {}
  return {
    nombre: texto(c.nombre, CUENTA_VACIA.nombre),
    correo: texto(c.correo, CUENTA_VACIA.correo),
    tipo: esId(TIPOS_CUENTA, c.tipo) ? c.tipo : null,
    creadaEn: typeof c.creadaEn === "string" ? c.creadaEn : null,
    mayorDeEdad: c.mayorDeEdad === true,
    verificado: c.verificado === true,
    pais: c.pais === "otro" || esId(COUNTRY_CODES, c.pais) ? c.pais : null,
    idiomas: idsValidos(IDIOMAS_AUDIENCIA, c.idiomas),
    perfilCanal: migrarPerfil(c.perfilCanal),
    publico: migrarPublico(c.publico),
    clipero: migrarClipero(c.clipero),
    creador: migrarCreador(c.creador),
    agencia: migrarAgencia(c.agencia),
    meta: esObjeto(c.meta) ? (c.meta as Cuenta["meta"]) : {},
    onboarding: migrarProgreso(c.onboarding),
    consentimientos: Array.isArray(c.consentimientos)
      ? c.consentimientos.filter(
          (x): x is RegistroConsentimiento =>
            esObjeto(x) && esId(FINALIDADES, x.finalidad) && typeof x.valor === "boolean"
        )
      : [],
    microPreguntas: {
      ultimaEn: typeof micro.ultimaEn === "string" ? micro.ultimaEn : null,
      pospuestas: esObjeto(micro.pospuestas)
        ? (Object.fromEntries(
            Object.entries(micro.pospuestas).filter(([, v]) => typeof v === "string")
          ) as Record<string, string>)
        : {},
      descartadas: Array.isArray(micro.descartadas)
        ? micro.descartadas.filter((x): x is string => typeof x === "string")
        : [],
    },
    // Sin tipo que comprobar: solo que sea id → lista de cadenas
    respuestasLibres: esObjeto(c.respuestasLibres)
      ? (Object.fromEntries(
          Object.entries(c.respuestasLibres)
            .filter(([, v]) => Array.isArray(v))
            .map(([k, v]) => [
              k,
              (v as unknown[]).filter((x): x is string => typeof x === "string"),
            ])
        ) as Record<string, string[]>)
      : {},
    borradorCampana: esObjeto(c.borradorCampana)
      ? (c.borradorCampana as Partial<BorradorCampana>)
      : null,
    eventos: Array.isArray(c.eventos)
      ? (c.eventos as unknown[])
          .filter(
            (x): x is EventoRegistrado =>
              esObjeto(x) && typeof x.tipo === "string" && typeof x.en === "string"
          )
          .slice(-EVENTOS_MAX)
      : [],
  }
}

/* ---------------------------------------------------------------------------
   Transiciones puras: (cuenta, …, en) → cuenta nueva
   --------------------------------------------------------------------------- */

/** Datos del alta (`/login`) o de un OAuth nuevo (`tipo: null`). */
export interface DatosRegistro {
  nombre: string
  correo: string
  tipo: TipoCuenta | null
  mayorDeEdad: boolean
  /** Por defecto, `"registro"`. */
  origen?: Extract<OrigenConsentimiento, "registro" | "oauth">
  /** Lo que aceptó en el formulario, con la clave exacta del texto mostrado. */
  consentimientos?: { finalidad: Finalidad; valor: boolean; textoId: string }[]
}

const conEvento = (
  c: CuentaGuardada,
  evento: EventoOnboarding,
  en: string
): CuentaGuardada => ({
  ...c,
  eventos: [...c.eventos, { ...evento, en } as EventoRegistrado].slice(-EVENTOS_MAX),
})

const conProgreso = (
  c: CuentaGuardada,
  cambio: Partial<ProgresoOnboarding>
): CuentaGuardada => ({ ...c, onboarding: { ...c.onboarding, ...cambio } })

const sinRepetir = <T>(lista: readonly T[], x: T) =>
  lista.includes(x) ? [...lista] : [...lista, x]

const msEntre = (desde: string | null, hasta: string) => {
  const d = desde ? Date.parse(desde) : NaN
  const h = Date.parse(hasta)
  return Number.isFinite(d) && Number.isFinite(h) ? Math.max(0, h - d) : 0
}

/** Lo que una respuesta del onboarding escribe también en Ajustes (§3.3). */
function sincronizarAjustes(c: CuentaGuardada, campo: CampoId): CuentaGuardada {
  switch (campo) {
    case "pais":
      return esId(COUNTRY_CODES, c.pais)
        ? { ...c, perfilCanal: { ...c.perfilCanal, pais: c.pais } }
        : c
    case "idiomas":
      return c.idiomas.length && !c.idiomas.includes(c.publico.idioma)
        ? { ...c, publico: { ...c.publico, idioma: c.idiomas[0] } }
        : c
    case "clipero.verticales":
    case "creador.verticalesCanal": {
      const verticales =
        campo === "clipero.verticales" ? c.clipero.verticales : c.creador.verticalesCanal
      // «Aún no lo sé» no toca Público; el resto, solo los ids que son TEMAS
      if (!Array.isArray(verticales)) return c
      const temas = idsValidos(TEMAS, verticales).slice(0, TEMAS_MAX)
      return { ...c, publico: { ...c.publico, temas } }
    }
    case "creador.plataformasDirecto":
      return c.creador.plataformasDirecto
        ? {
            ...c,
            perfilCanal: {
              ...c.perfilCanal,
              plataformas: idsValidos(PLATAFORMAS_DIRECTO, c.creador.plataformasDirecto),
            },
          }
        : c
    case "creador.enlaceCanal": {
      const handle = c.creador.enlaceCanal?.handle
      // La marca de agua solo cambia si el handle es un nombre de canal válido
      return handle && !validarCanal(handle)
        ? { ...c, perfilCanal: { ...c.perfilCanal, canal: handle } }
        : c
    }
    default:
      return c
  }
}

export const transicionesCuenta = {
  /** Cuenta nueva `sin-empezar` con los consentimientos del formulario. */
  registrar(datos: DatosRegistro, locale: Locale, en: string): CuentaGuardada {
    const origen = datos.origen ?? "registro"
    const meta: Cuenta["meta"] = {}
    if (datos.tipo) meta.tipo = { fuente: "declarado", en }
    if (datos.mayorDeEdad) meta.mayorDeEdad = { fuente: "declarado", en }
    return {
      nombre: datos.nombre.trim(),
      correo: datos.correo.trim(),
      tipo: datos.tipo,
      creadaEn: en,
      mayorDeEdad: datos.mayorDeEdad,
      verificado: false,
      pais: null,
      idiomas: [],
      perfilCanal: {
        canal: canalDesde(datos.nombre, datos.correo),
        avatarUrl: null,
        plataformas: [],
        pais: perfilInicial.pais,
        zona: perfilInicial.zona,
      },
      publico: {
        temas: [],
        edades: [],
        idioma: esId(IDIOMAS_AUDIENCIA, locale) ? locale : publicoInicial.idioma,
        tono: TONOS[0],
        ocultarPalabrotas: false,
      },
      clipero: {},
      creador: {},
      agencia: {},
      meta,
      onboarding: { ...PROGRESO_VACIO, flujo: datos.tipo },
      consentimientos: (datos.consentimientos ?? []).reduce<RegistroConsentimiento[]>(
        (r, x) => registrarConsentimiento(r, { ...x, origen, locale, en }),
        []
      ),
      microPreguntas: { ultimaEn: null, pospuestas: {}, descartadas: [] },
      respuestasLibres: {},
      borradorCampana: null,
      eventos: [],
    }
  },

  /** Guarda una respuesta con su `meta` (fuente y fecha) y la refleja en Ajustes. */
  responder<C extends CampoId>(
    c: CuentaGuardada,
    campo: C,
    valor: ValorCampo<C>,
    en: string,
    opciones: { fuente?: Fuente; confianza?: "baja" } = {}
  ): CuentaGuardada {
    const [rama, clave] = campo.split(".") as [keyof Cuenta, string | undefined]
    let sig: CuentaGuardada
    if (!clave) {
      sig = { ...c, [rama]: valor }
    } else {
      const respuestas: Objeto = { ...(c[rama] as Objeto) }
      if (valor === undefined) delete respuestas[clave]
      else respuestas[clave] = valor
      sig = { ...c, [rama]: respuestas }
    }
    const meta = { ...c.meta }
    if (valor === undefined) delete meta[campo]
    else
      meta[campo] = {
        fuente: opciones.fuente ?? "declarado",
        en,
        ...(opciones.confianza ? { confianza: opciones.confianza } : {}),
      }
    return sincronizarAjustes({ ...sig, meta }, campo)
  },

  /**
   * Empieza o retoma el flujo (`onboarding_iniciado`). Idempotente si ya está en
   * curso con el mismo flujo y modo. Una cuenta completada no vuelve a «en curso»
   * («Ver la bienvenida otra vez» edita sin perder el estado). No cambia `tipo`.
   */
  iniciar(
    c: CuentaGuardada,
    datos: {
      flujo: FlujoOnboarding
      modo: ModoOnboarding
      origen: Extract<EventoOnboarding, { tipo: "onboarding_iniciado" }>["origen"]
      locale: Locale
    },
    en: string
  ): CuentaGuardada {
    const o = c.onboarding
    if (o.flujo === datos.flujo && o.modo === datos.modo) {
      if (o.estado === "en-curso" || o.estado === "completado") return c
    }
    if (o.estado === "completado")
      return conProgreso(c, { flujo: datos.flujo, modo: datos.modo })
    return conEvento(
      conProgreso(c, {
        flujo: datos.flujo,
        modo: datos.modo,
        estado: "en-curso",
        iniciadoEn: o.iniciadoEn ?? en,
      }),
      { tipo: "onboarding_iniciado", ...datos },
      en
    )
  },

  /** Toma en pantalla: `pasoActual` y, la primera vez, `pasosVistos` + `paso_visto`. */
  verPaso(c: CuentaGuardada, paso: PasoId, en: string): CuentaGuardada {
    const o = c.onboarding
    const visto = o.pasosVistos.includes(paso)
    if (visto && o.pasoActual === paso) return c
    const sig = conProgreso(c, {
      pasoActual: paso,
      pasosVistos: sinRepetir(o.pasosVistos, paso),
    })
    return visto
      ? sig
      : conEvento(
          sig,
          { tipo: "paso_visto", paso, ms_desde_inicio: msEntre(o.iniciadoEn, en) },
          en
        )
  },

  /** «Continuar» con la toma válida: `pasosRespondidos` + `paso_respondido`. */
  responderPaso(
    c: CuentaGuardada,
    paso: PasoId,
    datos: { opciones: number; acelerado: boolean },
    en: string
  ): CuentaGuardada {
    const o = c.onboarding
    return conEvento(
      conProgreso(c, {
        pasosRespondidos: sinRepetir(o.pasosRespondidos, paso),
        pasosSaltados: o.pasosSaltados.filter((p) => p !== paso),
      }),
      {
        tipo: "paso_respondido",
        paso,
        n_opciones: datos.opciones,
        ms_en_paso: o.msPorPaso[paso] ?? 0,
        texto_acelerado: datos.acelerado,
      },
      en
    )
  },

  /** «Saltar esta toma»: `pasosSaltados` + `paso_saltado`. */
  saltarPaso(c: CuentaGuardada, paso: PasoId, en: string): CuentaGuardada {
    const o = c.onboarding
    return conEvento(
      conProgreso(c, {
        pasosSaltados: sinRepetir(o.pasosSaltados, paso),
        pasosRespondidos: o.pasosRespondidos.filter((p) => p !== paso),
      }),
      { tipo: "paso_saltado", paso },
      en
    )
  },

  /** Suma tiempo con la pestaña visible. Ignora ceros y negativos. */
  sumarTiempo(c: CuentaGuardada, paso: PasoId, ms: number): CuentaGuardada {
    if (!(ms > 0)) return c
    const msPorPaso = { ...c.onboarding.msPorPaso }
    msPorPaso[paso] = (msPorPaso[paso] ?? 0) + Math.round(ms)
    return conProgreso(c, { msPorPaso })
  },

  /** Una toma completada a mano (métrica de «aprende la prisa»). */
  acelerarTexto: (c: CuentaGuardada): CuentaGuardada =>
    conProgreso(c, { textoAcelerado: c.onboarding.textoAcelerado + 1 }),

  /** «Saltar intro» o dos tomas seguidas completadas a mano: el resto sale completo. */
  marcarAnimacionVista: (c: CuentaGuardada): CuentaGuardada =>
    c.onboarding.animacionVista ? c : conProgreso(c, { animacionVista: true }),

  /** «Hacerlo luego». Una cuenta completada no pasa a pospuesta. */
  posponer(c: CuentaGuardada, paso: PasoId, en: string): CuentaGuardada {
    return conEvento(
      conProgreso(c, {
        estado: c.onboarding.estado === "completado" ? "completado" : "pospuesto",
        pospuestoEn: en,
        pasoAbandono: paso,
      }),
      { tipo: "onboarding_pospuesto", paso },
      en
    )
  },

  /** Fin del flujo (`onboarding_completado` con Σ `msPorPaso`). Idempotente. */
  completar(c: CuentaGuardada, en: string): CuentaGuardada {
    const o = c.onboarding
    if (o.estado === "completado") return c
    const msTotal = Object.values(o.msPorPaso).reduce<number>((n, ms) => n + (ms ?? 0), 0)
    return conEvento(
      conProgreso(c, { estado: "completado", completadoEn: en, pasoAbandono: null }),
      {
        tipo: "onboarding_completado",
        ms_total: msTotal,
        saltados: [...o.pasosSaltados],
      },
      en
    )
  },

  /**
   * Añade una entrada al registro (nunca sobrescribe). `consentimiento_cambiado`
   * solo si el valor vigente cambia.
   */
  consentir(
    c: CuentaGuardada,
    datos: {
      finalidad: Finalidad
      valor: boolean
      origen: OrigenConsentimiento
      textoId: string
      locale: Locale
    },
    en: string
  ): CuentaGuardada {
    const antes = vigente(c.consentimientos, datos.finalidad)
    const sig = {
      ...c,
      consentimientos: registrarConsentimiento(c.consentimientos, { ...datos, en }),
    }
    return antes === datos.valor
      ? sig
      : conEvento(
          sig,
          {
            tipo: "consentimiento_cambiado",
            finalidad: datos.finalidad,
            valor: datos.valor,
            origen: datos.origen,
          },
          en
        )
  },

  guardarBorrador: (
    c: CuentaGuardada,
    borrador: Partial<BorradorCampana> | null
  ): CuentaGuardada => ({ ...c, borradorCampana: borrador }),

  /** Envío de la solicitud de agencia: `agencia.solicitudEnviadaEn` y, si llega, el borrador. */
  marcarSolicitudEnviada(
    c: CuentaGuardada,
    en: string,
    borrador?: Partial<BorradorCampana>
  ): CuentaGuardada {
    const sig = transicionesCuenta.responder(c, "agencia.solicitudEnviadaEn", en, en)
    return borrador ? { ...sig, borradorCampana: borrador } : sig
  },

  /** Ajustes › Perfil. El país es el mismo dato que la toma `basicos`. */
  guardarPerfil(c: CuentaGuardada, perfil: PerfilCanal, en: string): CuentaGuardada {
    const sig = { ...c, perfilCanal: perfil }
    return perfil.pais === c.pais
      ? sig
      : {
          ...sig,
          pais: perfil.pais,
          meta: { ...c.meta, pais: { fuente: "declarado", en } },
        }
  },

  /** Ajustes › Público. */
  guardarPublico: (c: CuentaGuardada, publico: PublicoCanal): CuentaGuardada => ({
    ...c,
    publico,
  }),

  /**
   * «Borrar mis respuestas» (§6.8): vacía `clipero`, `creador` y su `meta`.
   * Conserva la cuenta, el país, los idiomas, la agencia, Ajustes, el progreso y
   * los consentimientos.
   */
  borrarRespuestas(c: CuentaGuardada): CuentaGuardada {
    const meta = Object.fromEntries(
      Object.entries(c.meta).filter(
        ([campo]) => !campo.startsWith("clipero.") && !campo.startsWith("creador.")
      )
    ) as Cuenta["meta"]
    return { ...c, clipero: {}, creador: {}, meta }
  },

  /** «Ver la bienvenida otra vez»: el texto vuelve a escribirse; las respuestas se quedan. */
  verBienvenidaOtraVez: (c: CuentaGuardada): CuentaGuardada =>
    conProgreso(c, { animacionVista: false, pasosVistos: [] }),

  /** Toast `celebrate` del render: `true` si es la primera vez. */
  celebrar: (c: CuentaGuardada): CuentaGuardada =>
    c.onboarding.celebrado ? c : conProgreso(c, { celebrado: true }),

  /** Toast «Ya eres agencia» en la visita siguiente a la aprobación. */
  celebrarAprobacion: (c: CuentaGuardada): CuentaGuardada =>
    c.onboarding.celebradoAprobacion ? c : conProgreso(c, { celebradoAprobacion: true }),

  /** Una micropregunta se ha enseñado (una por sesión y una cada 3 días). */
  verMicro: (c: CuentaGuardada, en: string): CuentaGuardada => ({
    ...c,
    microPreguntas: { ...c.microPreguntas, ultimaEn: en },
  }),

  /** «Ahora no»: vuelve pasados `DIAS_MICRO_POSPUESTA` días. */
  posponerMicro(c: CuentaGuardada, id: string, en: string): CuentaGuardada {
    const hasta = new Date(
      Date.parse(en) + DIAS_MICRO_POSPUESTA * 86_400_000
    ).toISOString()
    return {
      ...c,
      microPreguntas: {
        ...c.microPreguntas,
        ultimaEn: en,
        pospuestas: { ...c.microPreguntas.pospuestas, [id]: hasta },
      },
    }
  },

  /** «No volver a preguntar». */
  descartarMicro(c: CuentaGuardada, id: string, en: string): CuentaGuardada {
    const pospuestas = { ...c.microPreguntas.pospuestas }
    delete pospuestas[id]
    return {
      ...c,
      microPreguntas: {
        ultimaEn: en,
        pospuestas,
        descartadas: sinRepetir(c.microPreguntas.descartadas, id),
      },
    }
  },

  /**
   * Responder una pregunta escrita desde el backoffice.
   *
   * Sin selección se borra la entrada, no se guarda una lista vacía: «no
   * respondida» y «respondida con nada» no son lo mismo, y la segunda dejaría
   * de preguntarse para siempre sin haber recogido nada.
   */
  responderLibre(c: CuentaGuardada, id: string, valores: string[], en: string) {
    const respuestasLibres = { ...c.respuestasLibres }
    if (valores.length) respuestasLibres[id] = valores
    else delete respuestasLibres[id]
    return {
      ...c,
      respuestasLibres,
      microPreguntas: { ...c.microPreguntas, ultimaEn: en },
    }
  },

  /** Cualquier otro evento del funnel (p. ej. `solicitud_agencia`). */
  registrarEvento: (c: CuentaGuardada, evento: EventoOnboarding, en: string) =>
    conEvento(c, evento, en),
}

/* ---------------------------------------------------------------------------
   Almacén
   --------------------------------------------------------------------------- */

let crudoCache: string | null = null
let valorCache: CuentaGuardada = CUENTA_VACIA

function leer(): CuentaGuardada {
  let crudo: string | null = null
  try {
    crudo = window.localStorage.getItem(CLAVE_CUENTA)
  } catch {
    // Almacenamiento bloqueado: se trabaja en memoria
  }
  if (crudo === crudoCache) return valorCache
  crudoCache = crudo
  try {
    valorCache = crudo ? migrarCuenta(JSON.parse(crudo)) : CUENTA_VACIA
  } catch {
    valorCache = CUENTA_VACIA
  }
  return valorCache
}

/** `true` si se guardó en localStorage; `false` si solo vive en memoria hasta recargar. */
function escribir(cambio: (c: CuentaGuardada) => CuentaGuardada): boolean {
  const actual = leer()
  const nuevo = cambio(actual)
  if (nuevo === actual) return true
  const crudo = JSON.stringify(nuevo)
  let guardado = true
  try {
    window.localStorage.setItem(CLAVE_CUENTA, crudo)
  } catch {
    guardado = false
  }
  // Sin almacenamiento, la caché sigue al valor en memoria
  crudoCache = guardado ? crudo : crudoCache
  valorCache = nuevo
  window.dispatchEvent(new Event(EVENTO))
  return guardado
}

function suscribir(callback: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === CLAVE_CUENTA || e.key === null) callback()
  }
  window.addEventListener(EVENTO, callback)
  window.addEventListener("storage", onStorage)
  return () => {
    window.removeEventListener(EVENTO, callback)
    window.removeEventListener("storage", onStorage)
  }
}

const ahora = () => new Date().toISOString()

/** Estado actual fuera de React (en un manejador): p. ej. el destino tras el OAuth. */
export const leerCuenta = (): CuentaGuardada => leer()

/** Vuelve a la cuenta demo. Lo llama también «Reiniciar demo» de `use-campanas`. */
export function reiniciarCuenta() {
  try {
    window.localStorage.removeItem(CLAVE_CUENTA)
  } catch {
    // Nada que borrar
  }
  crudoCache = null
  valorCache = CUENTA_VACIA
  window.dispatchEvent(new Event(EVENTO))
}

/** Añade un evento del funnel desde fuera del hook (p. ej. `use-campanas` al resolver la agencia). */
export function registrarEventoCuenta(evento: EventoOnboarding) {
  escribir((c) => transicionesCuenta.registrarEvento(c, evento, ahora()))
}

/**
 * ¿Se puede guardar en este navegador? Llamar en un efecto o manejador, nunca en
 * el render. Con `false`, el flujo avisa una vez (`onboarding.errors.guardadoFallido`).
 */
export function almacenamientoDisponible(): boolean {
  try {
    const prueba = `${CLAVE_CUENTA}:prueba`
    window.localStorage.setItem(prueba, "1")
    window.localStorage.removeItem(prueba)
    return true
  } catch {
    return false
  }
}

const noSuscribir = () => () => {}

/**
 * `false` en el render de servidor y en la hidratación; `true` después. Hasta
 * entonces, `useCuenta` devuelve la cuenta demo: el onboarding pinta su
 * esqueleto y no decide el paso inicial.
 */
export function useCuentaLista(): boolean {
  return React.useSyncExternalStore(
    noSuscribir,
    () => true,
    () => false
  )
}

/** Solo el nombre (se vuelve a pintar solo si cambia): saludo del panel, envíos y retiros. */
export function useNombreCuenta(): string {
  return React.useSyncExternalStore(
    suscribir,
    () => leer().nombre,
    () => CUENTA_VACIA.nombre
  )
}

export function useCuenta() {
  const c = React.useSyncExternalStore(suscribir, leer, () => CUENTA_VACIA)
  const locale = useLocale()
  const { cuentas: cuentasSociales } = useCuentasSociales()
  // Las cuentas conectadas viven en su propio almacén: el perfil las mira al
  // calcular en vez de guardarlas dos veces y que se desincronicen
  const conectadas = React.useMemo(
    () => cuentasDelPerfil(cuentasSociales.filter(cuentaActiva)),
    [cuentasSociales]
  )
  const detalle = React.useMemo(() => completitudDetalle(c, conectadas), [c, conectadas])

  const acciones = React.useMemo(() => {
    const T = transicionesCuenta
    return {
      /** Alta o primer OAuth: sustituye la cuenta por una nueva `sin-empezar`. */
      registrar: (datos: DatosRegistro) =>
        escribir(() => T.registrar(datos, locale, ahora())),
      responder: <C extends CampoId>(
        campo: C,
        valor: ValorCampo<C>,
        fuente: Fuente = "declarado",
        opciones: { confianza?: "baja" } = {}
      ) =>
        escribir((s) => T.responder(s, campo, valor, ahora(), { ...opciones, fuente })),
      iniciar: (datos: {
        flujo: FlujoOnboarding
        modo: ModoOnboarding
        origen: Extract<EventoOnboarding, { tipo: "onboarding_iniciado" }>["origen"]
      }) => escribir((s) => T.iniciar(s, { ...datos, locale }, ahora())),
      verPaso: (paso: PasoId) => escribir((s) => T.verPaso(s, paso, ahora())),
      responderPaso: (paso: PasoId, datos: { opciones: number; acelerado: boolean }) =>
        escribir((s) => T.responderPaso(s, paso, datos, ahora())),
      saltarPaso: (paso: PasoId) => escribir((s) => T.saltarPaso(s, paso, ahora())),
      sumarTiempo: (paso: PasoId, ms: number) =>
        escribir((s) => T.sumarTiempo(s, paso, ms)),
      acelerarTexto: () => escribir(T.acelerarTexto),
      marcarAnimacionVista: () => escribir(T.marcarAnimacionVista),
      posponer: (paso: PasoId) => escribir((s) => T.posponer(s, paso, ahora())),
      completar: () => escribir((s) => T.completar(s, ahora())),
      consentir: (
        finalidad: Finalidad,
        valor: boolean,
        origen: OrigenConsentimiento,
        textoId: string
      ) =>
        escribir((s) =>
          T.consentir(s, { finalidad, valor, origen, textoId, locale }, ahora())
        ),
      guardarBorrador: (borrador: Partial<BorradorCampana> | null) =>
        escribir((s) => T.guardarBorrador(s, borrador)),
      /** Devuelve la fecha ISO usada, para `SolicitudAgenciaDatos.enviadaEn`. */
      marcarSolicitudEnviada: (borrador?: Partial<BorradorCampana>) => {
        const en = ahora()
        escribir((s) => T.marcarSolicitudEnviada(s, en, borrador))
        return en
      },
      guardarPerfil: (perfil: PerfilCanal) =>
        escribir((s) => T.guardarPerfil(s, perfil, ahora())),
      guardarPublico: (publico: PublicoCanal) =>
        escribir((s) => T.guardarPublico(s, publico)),
      borrarRespuestas: () => escribir(T.borrarRespuestas),
      verBienvenidaOtraVez: () => escribir(T.verBienvenidaOtraVez),
      /** `true` solo la primera vez: `if (celebrar()) toast.celebrate(…)`. */
      celebrar: () => {
        if (leer().onboarding.celebrado) return false
        escribir(T.celebrar)
        return true
      },
      /** `true` solo la primera vez tras la aprobación. */
      celebrarAprobacion: () => {
        if (leer().onboarding.celebradoAprobacion) return false
        escribir(T.celebrarAprobacion)
        return true
      },
      verMicro: () => escribir((s) => T.verMicro(s, ahora())),
      posponerMicro: (id: string) => escribir((s) => T.posponerMicro(s, id, ahora())),
      descartarMicro: (id: string) => escribir((s) => T.descartarMicro(s, id, ahora())),
      responderLibre: (id: string, valores: string[]) =>
        escribir((s) => T.responderLibre(s, id, valores, ahora())),
      registrarEvento: (evento: EventoOnboarding) =>
        escribir((s) => T.registrarEvento(s, evento, ahora())),
      /** Vuelve a la cuenta demo «Ana Ruiz». */
      reiniciar: reiniciarCuenta,
    }
  }, [locale])

  return {
    cuenta: c as Cuenta,
    eventos: c.eventos,
    completitud: detalle.total,
    completitudDetalle: detalle,
    precision: precision(detalle.total),
    ...acciones,
  }
}
