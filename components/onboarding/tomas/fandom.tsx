"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { Check, Search, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui"

import type { PlataformaDirecto } from "@/lib/ajustes"
import type { CountryCode } from "@/lib/countries"
import {
  CREADORES,
  creadorPorId,
  plataformaPrincipal,
  seguidoresPrincipales,
  sugerencias,
  type Creador,
  type CreadorId,
} from "@/lib/creadores"
import {
  LIMITES_ONBOARDING,
  dimensionesDe,
  umbralPublicoValor,
  type Cuenta,
  type Fuente,
  type PaisResidencia,
  type RespuestasClipero,
} from "@/lib/onboarding"
import { vigente } from "@/lib/privacidad"
import { AUN_NO_SE, VERTICALES_ELEGIBLES, esId, type Vertical } from "@/lib/taxonomia"
import { leerCuenta } from "@/hooks/use-cuenta"
import { useFormat } from "@/hooks/use-format"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { Switch } from "@/components/ui/switch"
import { CropFrame } from "@/components/brand/logo"
import { useCountryName } from "@/components/shared/country-flag"
import { atajosDe } from "@/components/onboarding/choice-cards"
import { useFlujo } from "@/components/onboarding/contexto"
import {
  AvatarCreador,
  claveFan,
  etiquetaFan,
  mismoFan,
  nombrePlataforma,
  type Fan,
} from "@/components/onboarding/creator-avatar"
import { CampoToma, Toma } from "@/components/onboarding/toma"
import { paisDelNavegador } from "@/components/onboarding/tomas/basicos"

/* ---------------------------------------------------------------------------
   Lo que se deduce del fandom sin preguntar (§4.1)
   --------------------------------------------------------------------------- */

const mismaLista = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((x, i) => x === b[i])

export interface DerivadosFandom {
  /** `clipero.plataformasQueVe`: plataformas de directo de sus creadores (`inferido`). */
  plataformasQueVe: PlataformaDirecto[] | undefined
  /**
   * `clipero.subverticales` con los formatos de directo de sus creadores (§4.3).
   * `null` si no cambia. Si ya hay ligas o géneros respondidos, conserva su fuente.
   */
  subverticales: {
    valor: RespuestasClipero["subverticales"] | undefined
    fuente: Fuente
  } | null
  /**
   * Verticales de sus creadores cuando en `nichos` marcó «Aún no lo sé» (o no
   * eligió ninguna). Se enseñan («Detectado») y el feed ya las usa
   * (`recomendarCampanas`), pero **no** sustituyen a lo declarado.
   */
  verticales: Vertical[]
}

/**
 * Derivados del fandom, función pura: plataformas que ve, formatos de directo y
 * verticales inferidas. Los creadores `sugerible: false` no cuentan; de un
 * pendiente solo cuenta su plataforma (`dimensionesDe`).
 */
export function derivadosDelFandom(
  cuenta: Pick<Cuenta, "clipero" | "meta">,
  fans: readonly Fan[],
  catalogo: readonly Creador[] = CREADORES
): DerivadosFandom {
  const d = dimensionesDe(fans, catalogo)
  const c = cuenta.clipero
  const { formatos: formatosAntes = [], ...resto } = c.subverticales ?? {}

  let subverticales: DerivadosFandom["subverticales"] = null
  if (!mismaLista(formatosAntes, d.formatos)) {
    const conDeclaradas = Object.values(resto).some((v) => Array.isArray(v) && v.length)
    const valor = d.formatos.length ? { ...resto, formatos: d.formatos } : resto
    subverticales = {
      valor: Object.keys(valor).length ? valor : undefined,
      fuente: conDeclaradas
        ? (cuenta.meta["clipero.subverticales"]?.fuente ?? "declarado")
        : "inferido",
    }
  }

  const sinDeclarar = c.verticales === AUN_NO_SE || !c.verticales?.length
  return {
    plataformasQueVe: d.plataformas.length ? d.plataformas : undefined,
    subverticales,
    verticales: sinDeclarar
      ? d.verticales
          .filter((v) => esId(VERTICALES_ELEGIBLES, v))
          .slice(0, LIMITES_ONBOARDING.nichos)
      : [],
  }
}

/* ---------------------------------------------------------------------------
   País para ordenar antes de `basicos`
   --------------------------------------------------------------------------- */

const sinSuscripcion = () => () => {}

/**
 * País con el que se ordenan las sugerencias y los juegos antes de llegar a la
 * toma `basicos`: el respondido o, si aún no hay, la región del navegador
 * (`navigator.languages`, la misma pista que precarga `basicos`; aquí no se
 * guarda). En servidor e hidratación, `null`. «Otro país» → `null`.
 */
export function usePaisSugerido(pais: PaisResidencia | null): CountryCode | null {
  const delNavegador = React.useSyncExternalStore(
    sinSuscripcion,
    () => paisDelNavegador(navigator.languages ?? [navigator.language]),
    () => null
  )
  if (pais) return pais === "otro" ? null : pais
  return delNavegador
}

/* ---------------------------------------------------------------------------
   Buscador, cargado con dynamic()
   --------------------------------------------------------------------------- */

/** Misma geometría que la etiqueta y el campo del buscador: sin salto al cargar. */
function BuscadorCargando() {
  const t = useTranslations("onboarding.clipero.fandom.search")
  return (
    <div className="space-y-3" aria-hidden>
      <p className="text-sm font-medium">{t("label")}</p>
      <div className="flex h-11 items-center gap-2 rounded-xl border border-input bg-card px-2.5 text-base text-muted-foreground @[100rem]/bienvenida:h-12">
        <Search className="size-4 shrink-0" />
        <span className="truncate px-2">{t("placeholder")}</span>
      </div>
    </div>
  )
}

/**
 * `CreatorSearch` cargado aparte (§4.1): `cmdk` no entra en el paquete inicial
 * del flujo. La toma `nichos` precarga el trozo al montarse. Con el esqueleto
 * de la toma `fandom`; otra vista con otra etiqueta puede crear su propio
 * `dynamic()` sobre `@/components/onboarding/creator-search`.
 */
export const BuscadorCreadores = dynamic(
  () => import("@/components/onboarding/creator-search").then((m) => m.CreatorSearch),
  { loading: () => <BuscadorCargando /> }
)

/* ---------------------------------------------------------------------------
   Tarjetas de sugerencias
   --------------------------------------------------------------------------- */

/**
 * Las 8 sugerencias en tarjetas (§4.1): avatar con el logo de su plataforma
 * principal, seguidores (`compact`), vertical e insignia «Tiene campaña».
 * `ToggleGroup` múltiple de Radix (flechas y Espacio), grupo principal de la
 * toma (teclas 1-8 con `data-atajos`). En silencio: añadir o quitar un creador
 * no suena (§5.12), por eso no hay `data-sound`.
 */
function TarjetasCreadores({
  creadores,
  elegidos,
  lleno,
  conCampana,
  onAlternar,
  ...aria
}: {
  creadores: readonly Creador[]
  elegidos: readonly CreadorId[]
  lleno: boolean
  conCampana: (c: Creador) => boolean
  onAlternar: (id: CreadorId) => void
  "aria-labelledby"?: string
  "aria-describedby"?: string
}) {
  const t = useTranslations("onboarding.clipero.fandom")
  const tt = useTranslations("taxonomy")
  const f = useFormat()
  const id = React.useId()

  return (
    <ToggleGroupPrimitive.Root
      type="multiple"
      value={[...elegidos]}
      onValueChange={(siguiente) => {
        const cambiado =
          siguiente.find((x) => !elegidos.includes(x as CreadorId)) ??
          elegidos.find((x) => !siguiente.includes(x))
        if (cambiado) onAlternar(cambiado as CreadorId)
      }}
      data-atajos=""
      aria-keyshortcuts={atajosDe(creadores.length)}
      data-toma-entrada=""
      className="grid gap-2.5 @lg/fandom:grid-cols-2 @5xl/bienvenida:gap-2"
      {...aria}
    >
      {creadores.map((c, i) => {
        const plataforma = plataformaPrincipal(c)
        const pulsado = elegidos.includes(c.id)
        return (
          <ToggleGroupPrimitive.Item
            key={c.id}
            value={c.id}
            data-button=""
            data-opcion=""
            data-creador={c.id}
            data-lleno={(lleno && !pulsado) || undefined}
            aria-labelledby={`${id}-${i}-n`}
            aria-describedby={`${id}-${i}-d`}
            style={{ "--i": i } as React.CSSProperties}
            className="group/creador relative flex min-h-16 w-full min-w-0 items-center gap-3 rounded-xl border border-border bg-card p-3 text-left text-card-foreground outline-none [--press:0.99] hover:border-primary/40 hover:bg-surface-hover data-lleno:text-muted-foreground data-[state=on]:border-primary data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
          >
            <AvatarCreador nombre={c.nombre} semilla={c.id} plataforma={plataforma} />
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span
                  id={`${id}-${i}-n`}
                  className="min-w-0 truncate font-semibold @[100rem]/bienvenida:text-base"
                >
                  {c.nombre}
                </span>
                {conCampana(c) && (
                  <Badge variant="secondary" aria-hidden>
                    {t("hasCampaign")}
                  </Badge>
                )}
              </span>
              <span
                id={`${id}-${i}-d`}
                className="mt-0.5 block text-sm text-pretty text-muted-foreground"
              >
                {/* El «·» va pegado al dato anterior con un espacio duro
                    (U+00A0, invisible aquí): la línea corta después del
                    separador, nunca antes, así que ningún punto se queda
                    colgando al empezar la segunda línea */}
                {`${nombrePlataforma(plataforma)} · ${t("followers", {
                  seguidores: f.compact(seguidoresPrincipales(c)),
                })}`}
                {c.verticales[0] ? ` · ${tt(`verticales.${c.verticales[0]}`)}` : null}
                {conCampana(c) && <span className="sr-only"> · {t("hasCampaign")}</span>}
              </span>
            </span>
            {i < 9 && (
              <Kbd aria-hidden className="hidden pointer-fine:inline-flex">
                {i + 1}
              </Kbd>
            )}
            <span
              aria-hidden
              className="grid size-5 shrink-0 place-items-center rounded-md border border-input bg-background text-primary-foreground group-data-[state=on]/creador:border-primary group-data-[state=on]/creador:bg-primary"
            >
              <Check className="size-3.5 opacity-0 group-data-[state=on]/creador:opacity-100" />
            </span>
          </ToggleGroupPrimitive.Item>
        )
      })}
    </ToggleGroupPrimitive.Root>
  )
}

/* ---------------------------------------------------------------------------
   Toma
   --------------------------------------------------------------------------- */

/**
 * Toma 3 del clipero · campañas (§2.4, §4.1): de quién haría clips. Opcional
 * («Saltar esta toma»).
 *
 * - 8 sugerencias deterministas en tarjetas bajo «Populares entre cliperos de
 *   {pais}» (con campaña activa en su país, de sus verticales y el resto por
 *   fans; empates con un hash del correo). Teclas 1-8.
 * - Buscador en línea (`CreatorSearch`, `dynamic()`): nombre o handle sin
 *   tildes, enlaces que resuelven al catálogo o a un pendiente, «Añadir
 *   «{texto}»». Retroceso con el campo vacío quita el último.
 * - «Tu radar»: chips con avatar y esquinas de recorte, hasta 5, contador
 *   «{n} de 5». El sexto no entra: la región viva lo dice y no suena.
 * - Deriva sin preguntar (`derivadosDelFandom`): `plataformasQueVe` y los
 *   formatos de directo como `inferido`; con «Aún no lo sé», las verticales de
 *   sus creadores, que se enseñan con el rótulo «Detectado».
 * - Texto fijo y el interruptor apagado «Avisarme también por correo»
 *   (finalidad `alertas-correo`).
 */
export function TomaFandom() {
  const ctx = useFlujo()
  const t = useTranslations("onboarding.clipero.fandom")
  const te = useTranslations("onboarding.errors")
  const tt = useTranslations("taxonomy")
  const f = useFormat()
  const nombrePais = useCountryName()
  const { cuenta, responder, consentir, anunciar } = ctx
  const [anuncio, setAnuncio] = React.useState<string | null>(null)

  const fans: Fan[] = cuenta.clipero.creadoresFan ?? []
  const max = LIMITES_ONBOARDING.creadores
  const nichos = cuenta.clipero.verticales
  const verticales = React.useMemo(() => (Array.isArray(nichos) ? nichos : []), [nichos])
  const pais = usePaisSugerido(cuenta.pais)
  const campanas = ctx.campanas

  const sugeridos = React.useMemo(() => {
    try {
      return sugerencias({
        pais,
        verticales,
        semilla: cuenta.correo,
        // El estado visible (una campaña agotada ya no cuenta como activa)
        campanas: campanas.map((x) => ({ ...x.campana, estado: x.estado })),
      })
    } catch {
      return null
    }
  }, [pais, verticales, cuenta.correo, campanas])

  const conCampana = React.useCallback(
    (c: Creador) =>
      !!c.campanaId &&
      campanas.some((x) => x.campana.id === c.campanaId && x.estado === "activa"),
    [campanas]
  )

  const derivados = derivadosDelFandom(cuenta, fans)

  /* Escribir: el fandom y lo que se deduce de él */
  const guardar = (siguiente: Fan[]) => {
    const antes = leerCuenta()
    responder("clipero.creadoresFan", siguiente.length ? siguiente : undefined)
    const d = derivadosDelFandom(antes, siguiente)
    if (!mismaLista(antes.clipero.plataformasQueVe ?? [], d.plataformasQueVe ?? []))
      responder("clipero.plataformasQueVe", d.plataformasQueVe, "inferido")
    if (d.subverticales)
      responder("clipero.subverticales", d.subverticales.valor, d.subverticales.fuente)
  }

  const avisar = (texto: string) => {
    setAnuncio(texto)
    anunciar(texto)
  }

  const anadir = (fan: Fan): boolean => {
    const actuales = leerCuenta().clipero.creadoresFan ?? []
    if (actuales.some((x) => mismoFan(x, fan))) return true
    if (actuales.length >= max) {
      anunciar(te("limiteElegidos", { max }))
      return false
    }
    const siguiente = [...actuales, fan]
    guardar(siguiente)
    avisar(t("added", { creador: etiquetaFan(fan), n: siguiente.length, max }))
    return true
  }

  const quitar = (fan: Fan) => {
    const actuales = leerCuenta().clipero.creadoresFan ?? []
    const siguiente = actuales.filter((x) => !mismoFan(x, fan))
    if (siguiente.length === actuales.length) return
    guardar(siguiente)
    avisar(t("removed", { creador: etiquetaFan(fan), n: siguiente.length, max }))
  }

  const quitarUltimo = () => {
    const actuales = leerCuenta().clipero.creadoresFan ?? []
    const ultimo = actuales.at(-1)
    if (ultimo) quitar(ultimo)
  }

  /* Al quitar desde un chip, el foco pasa al chip siguiente (o al buscador) */
  const radar = React.useRef<HTMLUListElement>(null)
  const focoTrasQuitar = React.useRef<number | null>(null)
  React.useEffect(() => {
    const i = focoTrasQuitar.current
    if (i === null) return
    focoTrasQuitar.current = null
    const botones = radar.current?.querySelectorAll<HTMLElement>("button") ?? []
    const destino =
      botones[Math.min(i, botones.length - 1)] ??
      document.querySelector<HTMLElement>("[data-buscador-creadores] input") ??
      document.getElementById("toma-titulo")
    destino?.focus()
  }, [fans.length])

  const ultimo = fans.at(-1)
  const reaccion = (() => {
    if (!ultimo) return null
    const creador = etiquetaFan(ultimo)
    const fansDemo =
      typeof ultimo === "string" ? (creadorPorId(ultimo)?.fansDemo ?? 0) : 0
    const umbral = umbralPublicoValor(fansDemo)
    return umbral
      ? t("reaction.umbral", { umbral, creador })
      : t("reaction.primeros", { creador })
  })()

  const idsElegidos = fans.filter((x): x is CreadorId => typeof x === "string")
  const lleno = fans.length >= max

  return (
    <Toma
      pregunta={t("question")}
      paraQue={t("why")}
      datos="estadisticas"
      reaccion={reaccion}
      anuncio={anuncio}
    >
      {/* Es la toma más alta: desde @5xl los tres bloques van más juntos (y la
          rejilla más compacta) para que la reacción y «Continuar» entren en
          pantalla sin desplazarse */}
      <div className="space-y-8 @5xl/bienvenida:space-y-6">
        <CampoToma
          campo="creadoresFan"
          etiqueta={
            pais ? t("suggestions", { pais: nombrePais(pais) }) : t("suggestionsAny")
          }
          className="@container/fandom @5xl/bienvenida:space-y-2"
        >
          {(a) =>
            sugeridos ? (
              <TarjetasCreadores
                creadores={sugeridos}
                elegidos={idsElegidos}
                lleno={lleno}
                conCampana={conCampana}
                onAlternar={(id) => (idsElegidos.includes(id) ? quitar(id) : anadir(id))}
                aria-labelledby={a.etiquetaId}
                aria-describedby={a.describedBy}
              />
            ) : (
              <p className="text-sm text-muted-foreground">{te("sugerenciasFallidas")}</p>
            )
          }
        </CampoToma>

        <div className="space-y-4 @5xl/bienvenida:space-y-3">
          <BuscadorCreadores
            etiqueta={t("search.label")}
            placeholder={t("search.placeholder")}
            contador={t("counter", { n: fans.length, max })}
            pais={pais}
            verticales={verticales}
            elegidos={fans}
            conCampana={conCampana}
            onElegir={anadir}
            onQuitar={quitar}
            onQuitarUltimo={quitarUltimo}
            onEnterVacio={ctx.continuar}
          />

          {fans.length > 0 && (
            <ul
              ref={radar}
              data-radar=""
              aria-label={t("radar")}
              className="flex flex-wrap gap-2.5"
            >
              {fans.map((fan, i) => {
                const etiqueta = etiquetaFan(fan)
                const plataforma =
                  typeof fan === "string"
                    ? (() => {
                        const c = creadorPorId(fan)
                        return c ? plataformaPrincipal(c) : undefined
                      })()
                    : fan.plataforma
                return (
                  <li
                    key={claveFan(fan)}
                    data-fan={claveFan(fan)}
                    className="max-w-full min-w-0"
                  >
                    <CropFrame size="sm" className="max-w-full rounded-full">
                      <span className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-full border border-primary bg-accent py-1 pr-1 pl-1.5 text-sm font-medium text-accent-foreground @[100rem]/bienvenida:min-h-12 @[100rem]/bienvenida:text-base">
                        <AvatarCreador
                          size="sm"
                          nombre={etiqueta}
                          semilla={claveFan(fan)}
                          plataforma={plataforma}
                        />
                        <span className="min-w-0 truncate">{etiqueta}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="rounded-full hover:bg-primary/10"
                          aria-label={t("remove", { creador: etiqueta })}
                          onClick={() => {
                            focoTrasQuitar.current = i
                            quitar(fan)
                          }}
                        >
                          <X aria-hidden />
                        </Button>
                      </span>
                    </CropFrame>
                  </li>
                )
              })}
            </ul>
          )}

          {(derivados.plataformasQueVe || derivados.verticales.length > 0) && (
            <p
              data-detectado=""
              className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-pretty text-muted-foreground"
            >
              <Badge variant="outline">{t("detected.label")}</Badge>
              {derivados.plataformasQueVe && (
                <span>
                  {t("detected.platforms", {
                    plataformas: f.list(derivados.plataformasQueVe.map(nombrePlataforma)),
                  })}
                </span>
              )}
              {derivados.verticales.length > 0 && (
                <span>
                  {t("detected.verticals", {
                    verticales: f.list(
                      derivados.verticales.map((v) => tt(`verticales.${v}`))
                    ),
                  })}
                </span>
              )}
            </p>
          )}
        </div>

        <div className="space-y-3 rounded-xl bg-muted/60 p-4 @3xl/bienvenida:p-5 @5xl/bienvenida:p-4">
          <p className="text-sm text-pretty">{t("notice")}</p>
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="toma-alertas-correo" className="text-sm font-medium">
              {t("emailAlerts")}
            </label>
            <Switch
              id="toma-alertas-correo"
              checked={vigente(cuenta.consentimientos, "alertas-correo")}
              onCheckedChange={(v) =>
                consentir(
                  "alertas-correo",
                  v,
                  "onboarding",
                  "onboarding.clipero.fandom.emailAlerts"
                )
              }
            />
          </div>
        </div>
      </div>
    </Toma>
  )
}
