import {
  aceptaEnvios,
  estadoVisible,
  liquidar,
  pideVerificacion,
  type Campana,
  type EstadoVisto,
  type Envio,
  type Liquidacion,
} from "@/lib/campanas"
import { CREADORES, type Creador, type CreadorId } from "@/lib/creadores"
import type { IdiomaAudiencia } from "@/lib/ajustes"
import type { CountryCode } from "@/lib/countries"
import { dimensionesDe, type Cuenta } from "@/lib/onboarding"
import type { SocialId } from "@/lib/social"
import {
  AUN_NO_SE,
  SIN_CUENTA,
  adyacentesDe,
  type EtiquetaSeguridad,
  type Vertical,
} from "@/lib/taxonomia"

/**
 * «Para ti» (§6.4): qué campañas enseñar a un clipero y por qué.
 *
 * Función pura: mismas campañas y misma cuenta, mismo resultado, en servidor y
 * en cliente. Los motivos son datos (ids), no frases: la interfaz pinta
 * «Por qué la ves: Gaming · TikTok · español» con `taxonomy.verticales`,
 * `SOCIAL_NETWORKS[red].name` e `Intl.DisplayNames`.
 */

/** Lo que recibe la recomendación: una vista de campaña ya liquidada. */
export interface ItemRecomendable {
  campana: Campana
  liquidacion: Pick<Liquidacion, "restante">
  /** Estado visible (una activa sin presupuesto es «agotada»). Sin él, se calcula. */
  estado?: EstadoVisto
}

/** Lo que usa de la cuenta. Una `Cuenta` de `hooks/use-cuenta.ts` vale tal cual. */
export type CuentaRecomendacion = Pick<Cuenta, "pais" | "idiomas" | "verificado"> & {
  clipero: Pick<
    Partial<Cuenta["clipero"]>,
    "verticales" | "creadoresFan" | "redes" | "tolerancia"
  >
}

export interface OpcionesRecomendacion {
  /** Privadas desbloqueadas con su código. */
  desbloqueadas?: readonly string[]
  /** Verticales inferidas de otras fuentes (envíos aprobados). Se suman a las del fandom. */
  verticalesInferidas?: readonly Vertical[]
  /** Catálogo de creadores para deducir verticales del fandom. */
  catalogo?: readonly Creador[]
  /** Incluir también las ocultas por etiquetas de seguridad («Mostrar»). */
  mostrarOcultas?: boolean
}

/** Por qué sale una campaña. `puntos` es lo que sumó (0 en los que solo describen el encaje). */
export type MotivoRecomendacion =
  | { tipo: "vertical"; vertical: Vertical; puntos: 3 }
  | { tipo: "creador"; creadorId: CreadorId; puntos: 2 }
  | { tipo: "red"; red: SocialId; puntos: 1 }
  | { tipo: "destacada"; puntos: 1 }
  | { tipo: "presupuesto"; puntos: 1 }
  | { tipo: "idioma"; idioma: IdiomaAudiencia; puntos: 0 }
  | { tipo: "pais"; pais: CountryCode; puntos: 0 }

export const PUNTOS_RECOMENDACION = {
  vertical: 3,
  creador: 2,
  red: 1,
  maxRedes: 2,
  destacada: 1,
  presupuesto: 1,
  /** Presupuesto restante mínimo (0–1) para sumar el punto de presupuesto. */
  restanteMin: 0.5,
} as const

export interface Recomendacion<T extends ItemRecomendable = ItemRecomendable> {
  item: T
  puntos: number
  /** En orden: vertical, creador, redes, destacada, presupuesto, idioma, país. */
  motivos: MotivoRecomendacion[]
  /** Con «Aún no tengo cuenta»: redes que necesita para participar. */
  necesitaCuenta: SocialId[]
  /** Tiene la vertical de la cuenta (declarada o inferida). */
  encaja: boolean
  /** Solo si `mostrarOcultas`: estaba oculta por una etiqueta de seguridad. */
  oculta: boolean
}

export interface ResultadoRecomendacion<T extends ItemRecomendable = ItemRecomendable> {
  /** Las que pasan los filtros duros, de más a menos puntos. */
  recomendadas: Recomendacion<T>[]
  /** Cuántas encajan con sus verticales; sin verticales conocidas, todas las recomendadas. */
  encajan: number
  /** Verticales con las que se ha puntuado (declaradas + inferidas). */
  verticales: Vertical[]
  /** Ocultas por etiquetas de seguridad que no tolera: «1 campaña oculta · Mostrar». */
  ocultasPorEtiqueta: number
  /**
   * Sin ninguna que encaje, pero con verticales conocidas: las de verticales
   * vecinas («Mientras llegan campañas de {vertical}, estas de {adyacente}…»).
   * `null` si hay encaje o si tampoco hay vecinas.
   */
  adyacentes: {
    vertical: Vertical
    adyacente: Vertical
    items: Recomendacion<T>[]
  } | null
}

const interseca = <T>(a: readonly T[], b: readonly T[]) => a.some((x) => b.includes(x))

/**
 * Filtros duros:
 * - acepta envíos (estado visible «activa»);
 * - no es privada, salvo que esté desbloqueada;
 * - comparte alguna red con la cuenta (con «Aún no tengo cuenta» no filtra y
 *   devuelve `necesitaCuenta`; sin redes respondidas tampoco filtra);
 * - sus idiomas y países objetivo, si los tiene;
 * - sus etiquetas de seguridad están en la tolerancia (si no, cuenta como oculta);
 * - regulada o solo para verificados → solo con la cuenta verificada.
 *
 * Puntuación: +3 vertical (principal o secundaria) en las declaradas o
 * inferidas · +2 su creador está en el fandom · +1 por red en común (máx. 2) ·
 * +1 destacada · +1 presupuesto restante del 50 % o más. Desempate: más
 * presupuesto restante y, después, el id.
 */
export function recomendarCampanas<T extends ItemRecomendable>(
  items: readonly T[],
  cuenta: CuentaRecomendacion,
  opciones: OpcionesRecomendacion = {}
): ResultadoRecomendacion<T> {
  const {
    desbloqueadas = [],
    verticalesInferidas = [],
    catalogo = CREADORES,
    mostrarOcultas = false,
  } = opciones
  const c = cuenta.clipero
  const redesCuenta = c.redes ?? []
  const sinCuenta = redesCuenta.includes(SIN_CUENTA)
  const tolerancia: readonly EtiquetaSeguridad[] = c.tolerancia ?? []
  const fandom = (c.creadoresFan ?? []).filter(
    (x): x is CreadorId => typeof x === "string"
  )

  const declaradas = Array.isArray(c.verticales) ? c.verticales : []
  const delFandom =
    c.verticales === AUN_NO_SE || declaradas.length === 0
      ? dimensionesDe(c.creadoresFan ?? [], catalogo).verticales
      : []
  const verticales = [...new Set([...declaradas, ...verticalesInferidas, ...delFandom])]

  let ocultasPorEtiqueta = 0
  const puntuadas: Recomendacion<T>[] = []

  for (const item of items) {
    const campana = item.campana
    const estado = item.estado ?? estadoVisible(campana, item.liquidacion)
    if (!aceptaEnvios(estado)) continue
    if (campana.privada && !desbloqueadas.includes(campana.id)) continue

    const redesComunes = campana.redes.filter((r) => redesCuenta.includes(r))
    if (redesCuenta.length > 0 && !sinCuenta && redesComunes.length === 0) continue

    const idiomasCampana = campana.idiomas ?? []
    if (
      idiomasCampana.length > 0 &&
      cuenta.idiomas.length > 0 &&
      !interseca(idiomasCampana, cuenta.idiomas)
    )
      continue
    const paisesCampana = campana.paisesObjetivo ?? []
    if (
      paisesCampana.length > 0 &&
      cuenta.pais &&
      (cuenta.pais === "otro" || !paisesCampana.includes(cuenta.pais))
    )
      continue

    if (pideVerificacion(campana) && !cuenta.verificado) continue

    const oculta = (campana.etiquetas ?? []).some((e) => !tolerancia.includes(e))
    if (oculta) {
      ocultasPorEtiqueta += 1
      if (!mostrarOcultas) continue
    }

    const motivos: MotivoRecomendacion[] = []
    const P = PUNTOS_RECOMENDACION
    const verticalCampana = [
      campana.vertical,
      ...(campana.verticalesSecundarias ?? []),
    ].find((v): v is Vertical => !!v && verticales.includes(v))
    if (verticalCampana)
      motivos.push({ tipo: "vertical", vertical: verticalCampana, puntos: 3 })
    if (campana.creadorId && fandom.includes(campana.creadorId))
      motivos.push({ tipo: "creador", creadorId: campana.creadorId, puntos: 2 })
    for (const red of redesComunes.slice(0, P.maxRedes))
      motivos.push({ tipo: "red", red, puntos: 1 })
    if (campana.destacada) motivos.push({ tipo: "destacada", puntos: 1 })
    if (item.liquidacion.restante >= campana.presupuesto * P.restanteMin)
      motivos.push({ tipo: "presupuesto", puntos: 1 })
    const idioma = idiomasCampana.find((i) => cuenta.idiomas.includes(i))
    if (idioma) motivos.push({ tipo: "idioma", idioma, puntos: 0 })
    if (cuenta.pais && cuenta.pais !== "otro" && paisesCampana.includes(cuenta.pais))
      motivos.push({ tipo: "pais", pais: cuenta.pais, puntos: 0 })

    puntuadas.push({
      item,
      puntos: motivos.reduce((n, m) => n + m.puntos, 0),
      motivos,
      necesitaCuenta: sinCuenta ? [...campana.redes] : [],
      encaja: !!verticalCampana,
      oculta,
    })
  }

  const recomendadas = puntuadas.sort(
    (a, b) =>
      b.puntos - a.puntos ||
      b.item.liquidacion.restante - a.item.liquidacion.restante ||
      a.item.campana.id.localeCompare(b.item.campana.id)
  )
  const conEncaje = recomendadas.filter((r) => r.encaja).length

  let adyacentes: ResultadoRecomendacion<T>["adyacentes"] = null
  if (verticales.length > 0 && conEncaje === 0) {
    for (const adyacente of adyacentesDe(verticales)) {
      const deEsa = recomendadas.filter(
        (r) =>
          r.item.campana.vertical === adyacente ||
          (r.item.campana.verticalesSecundarias ?? []).includes(adyacente)
      )
      if (deEsa.length > 0) {
        const vertical =
          verticales.find((v) => adyacentesDe([v]).includes(adyacente)) ?? verticales[0]
        adyacentes = { vertical, adyacente, items: deEsa }
        break
      }
    }
  }

  return {
    recomendadas,
    encajan: verticales.length > 0 ? conEncaje : recomendadas.length,
    verticales,
    ocultasPorEtiqueta,
    adyacentes,
  }
}

/** Vistas de campaña para `recomendarCampanas` a partir de campañas y envíos. */
export function itemsRecomendables(
  campanas: readonly Campana[],
  envios: readonly Envio[]
): (ItemRecomendable & { liquidacion: Liquidacion; estado: EstadoVisto })[] {
  return campanas.map((campana) => {
    const liquidacion = liquidar(campana, [...envios])
    return { campana, liquidacion, estado: estadoVisible(campana, liquidacion) }
  })
}

/** Id de campaña → puntos, para `ordenar(items, "para-ti", puntos)` de `lib/campanas.ts`. */
export const puntosPorCampana = (r: Pick<ResultadoRecomendacion, "recomendadas">) =>
  new Map(r.recomendadas.map((x) => [x.item.campana.id, x.puntos]))
