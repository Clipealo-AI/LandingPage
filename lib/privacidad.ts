import type { Locale } from "@/i18n/routing"

/**
 * Privacidad desde el diseño (§3.5 y §3.6 de `docs/onboarding-2026-09.md`).
 *
 * - Cada finalidad se consiente (o se opone) por separado.
 * - El registro de consentimientos solo crece: cambiar de opinión añade una
 *   entrada nueva y lo vigente es la última de cada finalidad.
 * - Nada de aquí lee la hora: `en` lo pone quien llama, dentro del manejador.
 *
 * Todo esto hay que validarlo con un abogado en PE, MX, CO, CL, BR y ES antes de
 * lanzar. Las etiquetas están en `taxonomy.finalidades` y `taxonomy.conservacion`.
 */

export const FINALIDADES = [
  "terminos",
  "privacidad",
  "mayor-edad",
  "estadisticas",
  "informes-sector",
  "perfil-visible",
  "novedades-correo",
  "novedades-marcas",
  "alertas-correo",
  "contacto-comercial",
  "datos-cobro",
] as const
export type Finalidad = (typeof FINALIDADES)[number]

/** Enlazada al texto publicado del aviso de privacidad. */
export const VERSION_AVISO = "privacidad-2026-10-v1"

export const ORIGENES_CONSENTIMIENTO = [
  "registro",
  "oauth",
  "onboarding",
  "ajustes",
  "retiro",
  "gate",
] as const
export type OrigenConsentimiento = (typeof ORIGENES_CONSENTIMIENTO)[number]

export interface RegistroConsentimiento {
  finalidad: Finalidad
  valor: boolean
  version: string
  locale: Locale
  origen: OrigenConsentimiento
  /** Clave exacta mostrada, p. ej. "onboarding.resultado.permisos.informesSector". */
  textoId: string
  /** ISO; se lee en el manejador, nunca durante el render. */
  en: string
}

/**
 * Lo que vale cada finalidad sin ninguna entrada en el registro.
 * - Términos, privacidad y mayoría de edad hay que aceptarlos: `false`.
 * - Estadísticas de plataforma (N2) está activa por el aviso informado del
 *   registro; el usuario puede oponerse en Ajustes › Tus datos.
 * - Todo lo opcional (informes, perfil visible, correos, contacto) viene apagado.
 */
export const VALOR_POR_DEFECTO: Record<Finalidad, boolean> = {
  terminos: false,
  privacidad: false,
  "mayor-edad": false,
  estadisticas: true,
  "informes-sector": false,
  "perfil-visible": false,
  "novedades-correo": false,
  "novedades-marcas": false,
  "alertas-correo": false,
  "contacto-comercial": false,
  "datos-cobro": false,
}

/** Nivel de §3.5. N0 servicio · N1 recomendaciones · N2 estadísticas · N3 informes · N4 perfil visible. */
export type NivelPrivacidad = "N0" | "N1" | "N2" | "N3" | "N4" | "OPT" | "LEG"

/** Base legal propuesta de cada finalidad (a validar). */
export type BaseLegal = "contrato" | "legal" | "aviso-oposicion" | "consentimiento"

export const FINALIDAD_INFO: Record<
  Finalidad,
  { nivel: NivelPrivacidad; base: BaseLegal }
> = {
  terminos: { nivel: "N0", base: "contrato" },
  privacidad: { nivel: "N0", base: "legal" },
  "mayor-edad": { nivel: "LEG", base: "legal" },
  estadisticas: { nivel: "N2", base: "aviso-oposicion" },
  "informes-sector": { nivel: "N3", base: "consentimiento" },
  "perfil-visible": { nivel: "N4", base: "consentimiento" },
  "novedades-correo": { nivel: "OPT", base: "consentimiento" },
  "novedades-marcas": { nivel: "OPT", base: "consentimiento" },
  "alertas-correo": { nivel: "OPT", base: "consentimiento" },
  "contacto-comercial": { nivel: "OPT", base: "consentimiento" },
  // Obligación legal + contrato; en México, consentimiento expreso
  "datos-cobro": { nivel: "LEG", base: "legal" },
}

/**
 * Añade una entrada al registro y devuelve uno nuevo: nunca modifica ni
 * sobrescribe las anteriores. Sin `version`, la del aviso vigente.
 */
export function registrar(
  registro: readonly RegistroConsentimiento[],
  entrada: Omit<RegistroConsentimiento, "version"> & { version?: string }
): RegistroConsentimiento[] {
  return [...registro, { ...entrada, version: entrada.version ?? VERSION_AVISO }]
}

/** Valor vigente de una finalidad: la última entrada o, si no hay, el valor por defecto. */
export const vigente = (r: readonly RegistroConsentimiento[], f: Finalidad): boolean =>
  [...r].reverse().find((x) => x.finalidad === f)?.valor ?? VALOR_POR_DEFECTO[f]

/** Todas las finalidades con su valor vigente. */
export function vigentes(
  r: readonly RegistroConsentimiento[]
): Record<Finalidad, boolean> {
  return Object.fromEntries(FINALIDADES.map((f) => [f, vigente(r, f)])) as Record<
    Finalidad,
    boolean
  >
}

/** Historial de una finalidad (o de todas), del más reciente al más antiguo. */
export function historial(
  r: readonly RegistroConsentimiento[],
  f?: Finalidad
): RegistroConsentimiento[] {
  return [...r].reverse().filter((x) => !f || x.finalidad === f)
}

/* ---------------------------------------------------------------------------
   Umbrales de los agregados (§1, §4.6)
   --------------------------------------------------------------------------- */

/** Fuera del admin (agencias, reacciones del onboarding): grupos de 50 o más, redondeados. */
export const UMBRAL_PUBLICO = 50
/** Dentro del admin: 10 o más por celda, sin bajar a personas. */
export const UMBRAL_ADMIN = 10
/** En el admin, por debajo de esto la celda lleva la marca «muestra baja». */
export const MUESTRA_BAJA_ADMIN = 20

/* ---------------------------------------------------------------------------
   Conservación (§3.6, plazos propuestos a validar)
   --------------------------------------------------------------------------- */

export const DATOS_CONSERVADOS = [
  "respuestas-perfil",
  "registro-consentimientos",
  "tramo-declarado",
  "texto-como-llegaste",
  "eventos-onboarding",
] as const
export type DatoConservado = (typeof DATOS_CONSERVADOS)[number]

/**
 * `meses: null` = no caduca por tiempo sino por el hecho de `desde`.
 * El texto de cada plazo está en `taxonomy.conservacion.<id>`.
 */
export const PLAZOS_CONSERVACION: Record<
  DatoConservado,
  {
    meses: number | null
    desde: "inactividad" | "fin-cuenta" | "medicion" | "respuesta" | "evento"
    /** Lo que sobrevive al borrado. */
    conserva?: readonly string[]
  }
> = {
  // Se borran a los 18 meses sin actividad; se conservan país y consentimientos
  "respuestas-perfil": {
    meses: 18,
    desde: "inactividad",
    conserva: ["pais", "consentimientos"],
  },
  // Mientras dure la cuenta + plazo de prescripción de cada país
  "registro-consentimientos": { meses: null, desde: "fin-cuenta" },
  // Se borra al medir la cuenta
  "tramo-declarado": { meses: null, desde: "medicion" },
  // 12 meses; después solo queda la categoría normalizada
  "texto-como-llegaste": { meses: 12, desde: "respuesta", conserva: ["chips"] },
  // 24 meses; solo ids y recuentos, sin el contenido de las respuestas
  "eventos-onboarding": { meses: 24, desde: "evento" },
}

/** Lo que nunca se pregunta en Clipealo (§3.6). */
export const NUNCA_SE_PREGUNTA = [
  "fecha-nacimiento",
  "genero",
  "ingresos",
  "ciudad-direccion-telefono",
  "religion",
  "politica",
  "salud",
  "familia",
] as const
