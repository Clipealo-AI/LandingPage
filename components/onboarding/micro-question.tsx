"use client"

import * as React from "react"
import { Globe } from "lucide-react"
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui"
import { useLocale, useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"
import { LOCALE_TAG } from "@/i18n/routing"
import { cn } from "@/lib/utils"
import { IDIOMAS_AUDIENCIA, type IdiomaAudiencia } from "@/lib/ajustes"
import { COUNTRY_CODES } from "@/lib/countries"
import {
  LIMITES_ONBOARDING,
  validarToma,
  type ErrorToma,
  type PaisResidencia,
} from "@/lib/onboarding"
import {
  REGLAS_MICRO,
  elegirMicro,
  enviosDeCuenta,
  esMicroId,
  type LugarMicro,
  type MicroCandidata,
  type MicroId,
  type RequisitoCampana,
} from "@/lib/micro-preguntas"
import { preguntaPorId, type PreguntaCatalogo } from "@/lib/micro-catalogo"
import { useCatalogoMicro } from "@/hooks/use-catalogo-micro"
import { SOCIAL_IDS, SOCIAL_NETWORKS } from "@/lib/social"
import {
  DISPONIBILIDAD,
  EXPERIENCIA,
  FORMATOS_DIRECTO,
  GENEROS_MUSICA,
  HERRAMIENTAS,
  LIGAS,
  LIGA_NOMBRE,
  MOTIVACIONES,
  MOTIVOS_PAUSA,
  SIN_CUENTA,
  esId,
  tieneNombreLiga,
  type Disponibilidad,
  type Experiencia,
  type FormatoDirecto,
  type GeneroMusica,
  type Herramienta,
  type LigaId,
  type Motivacion,
  type MotivoPausa,
  type RedPublicacion,
} from "@/lib/taxonomia"
import { leerCuenta, useCuenta, useCuentaLista } from "@/hooks/use-cuenta"
import { useCampanas } from "@/hooks/use-campanas"
import { useFormat } from "@/hooks/use-format"
import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SocialGlyph } from "@/components/brand/social"
import { CountryFlag, useCountryName } from "@/components/shared/country-flag"
import { ChipGroup } from "@/components/onboarding/chip-group"
import { DataLabel } from "@/components/onboarding/data-label"

/* ---------------------------------------------------------------------------
   Una por sesión: la que ya salió en esta pestaña
   --------------------------------------------------------------------------- */

const CLAVE_SESION = "clipealo-micro-sesion"
let sesionEnMemoria: string | null = null

/** Micropregunta que ya salió en esta sesión. Solo en efectos y manejadores. */
export function leerMicroSesion(): string | null {
  try {
    return window.sessionStorage.getItem(CLAVE_SESION) ?? sesionEnMemoria
  } catch {
    return sesionEnMemoria
  }
}

export function guardarMicroSesion(id: string | null) {
  sesionEnMemoria = id
  try {
    if (id) window.sessionStorage.setItem(CLAVE_SESION, id)
    else window.sessionStorage.removeItem(CLAVE_SESION)
  } catch {
    // Sin sessionStorage vale la memoria de la pestaña
  }
}

/**
 * La micropregunta que toca en un lugar (§6.6), ya pintada: nada en el servidor
 * ni en la hidratación, porque hasta que la cuenta del navegador no está lista
 * no se sabe qué preguntar (ni si toca preguntar algo).
 *
 * Es lo que se monta en el panel y dentro de «Enviar clip».
 */
export function MicroLugar({
  lugar,
  variante,
  className,
}: {
  lugar: LugarMicro
  variante?: "tarjeta" | "linea"
  className?: string
}) {
  const lista = useCuentaLista()
  if (!lista) return null
  return <MicroElegida lugar={lugar} variante={variante} className={className} />
}

/** Se monta con la cuenta ya lista: por eso puede decidir al primer render. */
function MicroElegida({
  lugar,
  variante,
  className,
}: {
  lugar: LugarMicro
  variante?: "tarjeta" | "linea"
  className?: string
}) {
  const candidata = useMicroPregunta(lugar)
  if (!candidata) return null
  return <MicroQuestion candidata={candidata} variante={variante} className={className} />
}

/**
 * La hora a la que se cargó la app en este navegador.
 *
 * Las reglas de las micropreguntas se miden en días —una cada 3, «Ahora no»
 * vuelve a los 7— contra el mismo reloj real con el que `hooks/use-cuenta.ts`
 * sella las respuestas, así que no vale `AHORA_DEMO`, que está parado. Y se
 * lee una vez al cargar el módulo y no en cada render: `new Date()` mientras
 * se pinta es impuro, y React lo avisa en desarrollo.
 */
const ARRANQUE = new Date().toISOString()

/**
 * Elige la micropregunta del lugar una sola vez, al montar, y la marca como
 * vista (`verMicro`) para que la regla «una cada 3 días» cuente desde que se
 * enseña. Solo vale dentro de un componente que se monte con la cuenta lista
 * (`useCuentaLista()`); si no, usa `MicroLugar`.
 *
 * La hora sale de `ARRANQUE`: se elige al pintar, y leer el reloj mientras se
 * pinta es impuro.
 */
export function useMicroPregunta(lugar: LugarMicro): MicroCandidata | null {
  const { verMicro } = useCuenta()
  const { envios, campanas, cuenta } = useCampanas()
  // Lo que el admin tenga encendido ahora mismo, con su orden y sus reglas
  const catalogo = useCatalogoMicro()
  const [elegida] = React.useState(() => {
    const verticales = new Map(campanas.map((c) => [c.id, c.vertical]))
    return (
      elegirMicro(
        {
          cuenta: leerCuenta(),
          envios: enviosDeCuenta(envios, cuenta),
          verticalDe: (id) => verticales.get(id),
          catalogo,
          ahora: ARRANQUE,
        },
        lugar,
        leerMicroSesion()
      ) ?? null
    )
  })

  React.useEffect(() => {
    if (!elegida?.nueva) return
    guardarMicroSesion(elegida.candidata.id)
    verMicro()
  }, [elegida, verMicro])

  return elegida?.candidata ?? null
}

/* ---------------------------------------------------------------------------
   Opciones
   --------------------------------------------------------------------------- */

interface Opcion {
  value: string
  label: string
}

const CHIP =
  "inline-flex min-h-11 max-w-full items-center rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-card-foreground outline-none hover:border-primary/40 hover:bg-surface-hover data-[state=on]:border-primary data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"

/**
 * Opción única en chips, en silencio (§6.6: las micropreguntas no suenan).
 * `ToggleGroup` de Radix con `role="radio"`: `data-sound="none"` evita el «tap»
 * automático de `InteractionFeedback`.
 */
function OpcionUnica({
  value,
  onValueChange,
  options,
  ...aria
}: {
  value: string | undefined
  onValueChange: (value: string) => void
  options: readonly Opcion[]
  "aria-labelledby"?: string
  "aria-describedby"?: string
}) {
  return (
    <ToggleGroupPrimitive.Root
      type="single"
      value={value ?? ""}
      onValueChange={(v) => v && onValueChange(v)}
      className="flex flex-wrap gap-2"
      {...aria}
    >
      {options.map((o) => (
        <ToggleGroupPrimitive.Item
          key={o.value}
          value={o.value}
          data-button=""
          data-sound="none"
          className={CHIP}
        >
          <span className="truncate">{o.label}</span>
        </ToggleGroupPrimitive.Item>
      ))}
    </ToggleGroupPrimitive.Root>
  )
}

type Control =
  | { tipo: "unica"; options: Opcion[] }
  | { tipo: "multiple"; options: Opcion[]; max?: number; excluyentes?: string[] }
  | { tipo: "confirmar" }

/** Respuesta actual de una micropregunta, como selección de chips. */
function seleccionActual(id: MicroId): string[] {
  const cl = leerCuenta().clipero
  switch (id) {
    case "experiencia":
      return cl.experiencia ? [cl.experiencia] : []
    case "disponibilidad":
      return cl.disponibilidad ? [cl.disponibilidad] : []
    case "motivo-pausa":
      return cl.motivoPausa ? [cl.motivoPausa] : []
    case "motivaciones":
      return [...(cl.motivaciones ?? [])]
    case "herramientas":
      return [...(cl.herramientas ?? [])]
    case "ligas":
      return [...(cl.subverticales?.ligas ?? [])]
    case "generos":
      return [...(cl.subverticales?.generos ?? [])]
    case "formatos":
      return [...(cl.subverticales?.formatos ?? [])]
    case "sigues-clipeando":
      return []
  }
}

type Estado = "abierta" | "respondida" | "pospuesta" | "descartada"

/**
 * Una micropregunta del perfilado progresivo (§6.5-§6.6): pregunta, «Para
 * qué» con la etiqueta de datos (ⓘ), opciones y «Guardar», «Ahora no» (vuelve
 * en 7 días) y «No volver a preguntar». Nada suena ni celebra: al cerrarse deja
 * una línea con lo que cambia y el foco en ella.
 *
 * - `variante="tarjeta"`: tarjeta del panel, con `h2`.
 * - `variante="linea"`: una línea dentro de otro diálogo («Enviar clip»).
 * - `modo="editar"`: desde Ajustes › Tus datos, sin «Ahora no» ni «No volver a
 *   preguntar» y con la respuesta actual marcada.
 */
export function MicroQuestion({
  candidata,
  variante = "tarjeta",
  modo = "preguntar",
  onTerminar,
  className,
}: {
  candidata: MicroCandidata
  variante?: "tarjeta" | "linea"
  modo?: "preguntar" | "editar"
  onTerminar?: (estado: Exclude<Estado, "abierta">) => void
  className?: string
}) {
  const catalogo = useCatalogoMicro()
  const delCatalogo = preguntaPorId(candidata.id, catalogo)

  // Las que escribió el admin llevan su texto y sus opciones dentro; las nueve
  // de siempre, en `messages/` y en el dominio. Son dos piezas distintas a
  // propósito: mezclarlas obligaría a castear el id en cada rama
  if (delCatalogo?.origen === "creada")
    return (
      <MicroCreada
        pregunta={delCatalogo}
        variante={variante}
        modo={modo}
        onTerminar={onTerminar}
        className={className}
      />
    )
  if (!esMicroId(candidata.id)) return null
  return (
    <MicroSemilla
      candidata={{ ...candidata, id: candidata.id }}
      variante={variante}
      modo={modo}
      onTerminar={onTerminar}
      className={className}
    />
  )
}

function MicroSemilla({
  candidata,
  variante = "tarjeta",
  modo = "preguntar",
  onTerminar,
  className,
}: {
  candidata: MicroCandidata & { id: MicroId }
  variante?: "tarjeta" | "linea"
  modo?: "preguntar" | "editar"
  onTerminar?: (estado: Exclude<Estado, "abierta">) => void
  className?: string
}) {
  const { id } = candidata
  const t = useTranslations("onboarding.micro")
  const tp = useTranslations(`onboarding.micro.preguntas.${id}`)
  const tt = useTranslations("taxonomy")
  const f = useFormat()
  const { responder, posponerMicro, descartarMicro } = useCuenta()
  const { campanas } = useCampanas()
  const uid = React.useId()
  const [seleccion, setSeleccion] = React.useState<string[]>(() =>
    modo === "editar" ? seleccionActual(id) : []
  )
  const [estado, setEstado] = React.useState<Estado>("abierta")
  const cierre = React.useRef<HTMLParagraphElement>(null)

  React.useEffect(() => {
    if (estado !== "abierta") cierre.current?.focus()
  }, [estado])

  const max = REGLAS_MICRO.maxSubverticales
  const control: Control = (() => {
    switch (id) {
      case "experiencia":
        return {
          tipo: "unica",
          options: EXPERIENCIA.map((v) => ({ value: v, label: tt(`experiencia.${v}`) })),
        }
      case "disponibilidad":
        return {
          tipo: "unica",
          options: DISPONIBILIDAD.map((v) => ({
            value: v,
            label: tt(`disponibilidad.${v}`),
          })),
        }
      case "motivo-pausa":
        return {
          tipo: "unica",
          options: MOTIVOS_PAUSA.map((v) => ({
            value: v,
            label: tt(`motivosPausa.${v}`),
          })),
        }
      case "motivaciones":
        return {
          tipo: "multiple",
          max: LIMITES_ONBOARDING.motivaciones,
          options: MOTIVACIONES.map((v) => ({
            value: v,
            label: tt(`motivaciones.${v}`),
          })),
        }
      case "herramientas":
        return {
          tipo: "multiple",
          excluyentes: ["ninguna"],
          options: HERRAMIENTAS.map((v) => ({
            value: v,
            label: tt(`herramientas.${v}`),
          })),
        }
      case "ligas":
        return {
          tipo: "multiple",
          max,
          options: LIGAS.map((v) => ({
            value: v,
            label: tieneNombreLiga(v) ? LIGA_NOMBRE[v] : tt(`ligas.${v}`),
          })),
        }
      case "generos":
        return {
          tipo: "multiple",
          max,
          options: GENEROS_MUSICA.map((v) => ({
            value: v,
            label: tt(`generosMusica.${v}`),
          })),
        }
      case "formatos":
        return {
          tipo: "multiple",
          max,
          options: FORMATOS_DIRECTO.map((v) => ({
            value: v,
            label: tt(`formatosDirecto.${v}`),
          })),
        }
      case "sigues-clipeando":
        return { tipo: "confirmar" }
    }
  })()

  /* Textos con sus datos */
  const verticales = leerVerticales()
  const campana = candidata.campanaId
    ? campanas.find((c) => c.id === candidata.campanaId)?.titulo
    : undefined
  const pregunta =
    id === "sigues-clipeando"
      ? t("preguntas.sigues-clipeando.question", {
          verticales: f.list(
            verticales.map((v) => tt(`verticales.${v}`)),
            "conjunction"
          ),
        })
      : tp("question")
  const paraQue = (() => {
    switch (id) {
      case "ligas":
      case "generos":
      case "formatos":
        return campana && modo === "preguntar"
          ? t(`preguntas.${id}.why`, { campana, max })
          : t(`preguntas.${id}.whyGeneric`, { max })
      case "motivo-pausa":
        return candidata.dias !== undefined && modo === "preguntar"
          ? t("preguntas.motivo-pausa.why", { dias: candidata.dias })
          : t("preguntas.motivo-pausa.whyGeneric")
      case "motivaciones":
        return t("preguntas.motivaciones.why", { max: LIMITES_ONBOARDING.motivaciones })
      default:
        return tp("why")
    }
  })()

  const cerrar = (siguiente: Exclude<Estado, "abierta">) => {
    setEstado(siguiente)
    onTerminar?.(siguiente)
  }

  const guardar = () => {
    const c = leerCuenta()
    const subverticales = c.clipero.subverticales ?? {}
    switch (id) {
      case "experiencia":
        responder("clipero.experiencia", seleccion[0] as Experiencia | undefined)
        break
      case "disponibilidad":
        responder("clipero.disponibilidad", seleccion[0] as Disponibilidad | undefined)
        break
      case "motivo-pausa":
        responder("clipero.motivoPausa", seleccion[0] as MotivoPausa | undefined)
        break
      case "motivaciones":
        responder(
          "clipero.motivaciones",
          seleccion.length ? (seleccion as Motivacion[]) : undefined
        )
        break
      case "herramientas":
        responder(
          "clipero.herramientas",
          seleccion.length ? (seleccion as Herramienta[]) : undefined
        )
        break
      case "ligas":
        responder("clipero.subverticales", {
          ...subverticales,
          ligas: seleccion as LigaId[],
        })
        break
      case "generos":
        responder("clipero.subverticales", {
          ...subverticales,
          generos: seleccion as GeneroMusica[],
        })
        break
      case "formatos":
        responder("clipero.subverticales", {
          ...subverticales,
          formatos: seleccion as FormatoDirecto[],
        })
        break
      case "sigues-clipeando":
        // Volver a guardar los mismos temas pone la fecha al día
        responder("clipero.verticales", c.clipero.verticales)
        break
    }
    cerrar("respondida")
  }

  const tarjeta = variante === "tarjeta"
  const Titulo = tarjeta ? "h2" : "p"
  const tituloId = `${uid}-pregunta`
  const paraQueId = `${uid}-para-que`

  if (estado !== "abierta") {
    const texto =
      estado === "respondida"
        ? tp("done")
        : estado === "pospuesta"
          ? t("cerrada.pospuesta")
          : t("cerrada.descartada")
    return (
      <div
        data-micro={id}
        data-estado={estado}
        className={cn(
          tarjeta
            ? "rounded-xl bg-card p-5 ring-1 ring-foreground/10"
            : "rounded-lg bg-muted/60 p-3",
          className
        )}
      >
        <p
          ref={cierre}
          tabIndex={-1}
          className="text-sm text-pretty outline-none motion-safe:animate-[fade-soft_240ms_var(--ease-brand)_backwards] motion-reduce:animate-[fade-soft_240ms_var(--ease-brand)_backwards]"
        >
          {texto}
        </p>
        {estado === "respondida" && id === "experiencia" && seleccion[0] === "nunca" && (
          <Button variant="link" size="sm" className="mt-1 h-auto px-0" asChild>
            <Link href="/ayuda">{t("preguntas.experiencia.guide")}</Link>
          </Button>
        )}
      </div>
    )
  }

  const puedeGuardar =
    control.tipo === "confirmar" || seleccion.length > 0 || modo === "editar"

  return (
    <section
      aria-labelledby={tituloId}
      data-micro={id}
      data-estado={estado}
      className={cn(
        "flex [animation:fade-soft_240ms_var(--ease-brand)_backwards] flex-col",
        tarjeta
          ? "gap-4 rounded-xl bg-card p-5 text-card-foreground ring-1 ring-foreground/10"
          : "gap-3 rounded-lg border border-dashed p-3",
        className
      )}
    >
      <div className="space-y-1.5">
        {modo === "preguntar" && (
          <p className="text-xs font-medium text-muted-foreground">{t("eyebrow")}</p>
        )}
        <Titulo
          id={tituloId}
          className={cn(
            "font-bold text-pretty",
            tarjeta ? "text-base leading-snug" : "text-sm"
          )}
        >
          {pregunta}
        </Titulo>
        <div className="flex items-start gap-1">
          <p id={paraQueId} className="text-sm text-pretty text-muted-foreground">
            {paraQue}
          </p>
          <DataLabel quien="estadisticas" />
        </div>
      </div>

      {control.tipo === "unica" && (
        <OpcionUnica
          value={seleccion[0]}
          onValueChange={(v) => setSeleccion([v])}
          options={control.options}
          aria-labelledby={tituloId}
          aria-describedby={paraQueId}
        />
      )}
      {control.tipo === "multiple" && (
        <ChipGroup<string>
          entrada={false}
          sonido={false}
          value={seleccion}
          max={control.max}
          excluyentes={control.excluyentes}
          onValueChange={(sel) => setSeleccion(sel)}
          options={control.options}
          aria-labelledby={tituloId}
          aria-describedby={paraQueId}
        />
      )}

      <div className="flex flex-wrap items-center gap-2">
        {control.tipo === "confirmar" ? (
          <>
            <Button type="button" size="sm" onClick={guardar}>
              {t("preguntas.sigues-clipeando.yes")}
            </Button>
            <Button type="button" size="sm" variant="outline" asChild>
              <Link href={{ pathname: "/bienvenida", query: { paso: "nichos" } }}>
                {t("preguntas.sigues-clipeando.change")}
              </Link>
            </Button>
          </>
        ) : (
          <Button type="button" size="sm" onClick={guardar} disabled={!puedeGuardar}>
            {t("save")}
          </Button>
        )}
        {modo === "preguntar" && (
          <>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                posponerMicro(id)
                cerrar("pospuesta")
              }}
            >
              {t("later")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-muted-foreground"
              onClick={() => {
                descartarMicro(id)
                cerrar("descartada")
              }}
            >
              {t("never")}
            </Button>
          </>
        )}
      </div>
    </section>
  )
}

/**
 * Una pregunta escrita desde el backoffice.
 *
 * Trae su título, su «para qué» y sus opciones dentro, en el idioma en que las
 * escribieron: es contenido, como el título de una clase, y por eso no pasa por
 * `messages/`. Lo único que se traduce es el armazón —«Guardar», «Ahora no»,
 * «No volver a preguntar»—, que es el mismo de siempre.
 *
 * Su respuesta va a `Cuenta.respuestasLibres`: no puede ir a un campo tipado
 * porque nadie sabía que esta pregunta iba a existir.
 */
function MicroCreada({
  pregunta,
  variante = "tarjeta",
  modo = "preguntar",
  onTerminar,
  className,
}: {
  pregunta: PreguntaCatalogo
  variante?: "tarjeta" | "linea"
  modo?: "preguntar" | "editar"
  onTerminar?: (estado: Exclude<Estado, "abierta">) => void
  className?: string
}) {
  const t = useTranslations("onboarding.micro")
  const { responderLibre, posponerMicro, descartarMicro } = useCuenta()
  const uid = React.useId()
  const [seleccion, setSeleccion] = React.useState<string[]>(() =>
    modo === "editar" ? (leerCuenta().respuestasLibres[pregunta.id] ?? []) : []
  )
  const [estado, setEstado] = React.useState<Estado>("abierta")
  const cierre = React.useRef<HTMLParagraphElement>(null)

  React.useEffect(() => {
    if (estado !== "abierta") cierre.current?.focus()
  }, [estado])

  const tarjeta = variante === "tarjeta"
  const Titulo = tarjeta ? "h2" : "p"
  const tituloId = `${uid}-pregunta`
  const paraQueId = `${uid}-para-que`
  const options = (pregunta.opciones ?? []).map((o) => ({ value: o, label: o }))

  const cerrar = (siguiente: Exclude<Estado, "abierta">) => {
    setEstado(siguiente)
    onTerminar?.(siguiente)
  }

  if (estado !== "abierta") {
    const texto =
      estado === "respondida"
        ? t("cerrada.respondida")
        : estado === "pospuesta"
          ? t("cerrada.pospuesta")
          : t("cerrada.descartada")
    return (
      <div
        data-micro={pregunta.id}
        data-estado={estado}
        className={cn(
          tarjeta
            ? "rounded-xl bg-card p-5 ring-1 ring-foreground/10"
            : "rounded-lg bg-muted/60 p-3",
          className
        )}
      >
        <p
          ref={cierre}
          tabIndex={-1}
          className="text-sm text-pretty outline-none motion-safe:animate-[fade-soft_240ms_var(--ease-brand)_backwards] motion-reduce:animate-[fade-soft_240ms_var(--ease-brand)_backwards]"
        >
          {texto}
        </p>
      </div>
    )
  }

  return (
    <section
      aria-labelledby={tituloId}
      data-micro={pregunta.id}
      data-estado={estado}
      className={cn(
        "flex [animation:fade-soft_240ms_var(--ease-brand)_backwards] flex-col",
        tarjeta
          ? "gap-4 rounded-xl bg-card p-5 text-card-foreground ring-1 ring-foreground/10"
          : "gap-3 rounded-lg border border-dashed p-3",
        className
      )}
    >
      <div className="space-y-1.5">
        {modo === "preguntar" && (
          <p className="text-xs font-medium text-muted-foreground">{t("eyebrow")}</p>
        )}
        <Titulo
          id={tituloId}
          className={cn(
            "font-bold text-pretty",
            tarjeta ? "text-base leading-snug" : "text-sm"
          )}
        >
          {pregunta.titulo}
        </Titulo>
        <div className="flex items-start gap-1">
          <p id={paraQueId} className="text-sm text-pretty text-muted-foreground">
            {pregunta.ayuda}
          </p>
          <DataLabel quien="estadisticas" />
        </div>
      </div>

      {pregunta.tipo === "multiple" ? (
        <ChipGroup<string>
          entrada={false}
          sonido={false}
          value={seleccion}
          max={pregunta.max}
          onValueChange={setSeleccion}
          options={options}
          aria-labelledby={tituloId}
          aria-describedby={paraQueId}
        />
      ) : (
        <OpcionUnica
          value={seleccion[0]}
          onValueChange={(v) => setSeleccion([v])}
          options={options}
          aria-labelledby={tituloId}
          aria-describedby={paraQueId}
        />
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          onClick={() => {
            responderLibre(pregunta.id, seleccion)
            cerrar("respondida")
          }}
          disabled={seleccion.length === 0 && modo !== "editar"}
        >
          {t("save")}
        </Button>
        {modo === "preguntar" && (
          <>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                posponerMicro(pregunta.id)
                cerrar("pospuesta")
              }}
            >
              {t("later")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-muted-foreground"
              onClick={() => {
                descartarMicro(pregunta.id)
                cerrar("descartada")
              }}
            >
              {t("never")}
            </Button>
          </>
        )}
      </div>
    </section>
  )
}

/** Temas elegidos (para «¿Sigues clipeando…?»), leídos del almacén. */
function leerVerticales() {
  const v = leerCuenta().clipero.verticales
  return Array.isArray(v) ? v : []
}

/* ---------------------------------------------------------------------------
   Requisitos para enviar un clip (M2)
   --------------------------------------------------------------------------- */

/** Nombre del idioma con la mayúscula de una opción, en el idioma de la interfaz. */
function useNombreIdioma() {
  const locale = useLocale()
  return React.useMemo(() => {
    const tag = LOCALE_TAG[locale]
    const nombres = new Intl.DisplayNames([tag], { type: "language" })
    return (codigo: IdiomaAudiencia) => {
      const nombre = nombres.of(codigo) ?? codigo
      return nombre.charAt(0).toLocaleUpperCase(tag) + nombre.slice(1)
    }
  }, [locale])
}

/**
 * Lo que falta para unirse a la primera campaña (§6.5): redes, país e idiomas.
 * Es obligatorio (requisito de la tarea), así que no tiene «Ahora no»: se
 * enseña dentro de «Enviar clip» antes del formulario. Valida con los mismos
 * códigos que las tomas `redes` y `basicos` y guarda con `responder`, así
 * Ajustes y el feed «Para ti» lo ven al momento. Sin sonidos.
 */
export function RequisitosCampana({
  faltan,
  onListo,
  className,
}: {
  faltan: readonly RequisitoCampana[]
  onListo: () => void
  className?: string
}) {
  const t = useTranslations("onboarding.micro.requisitos")
  const te = useTranslations("onboarding.errors")
  const tr = useTranslations("taxonomy.redesPublicacion")
  const locale = useLocale()
  const nombrePais = useCountryName()
  const nombreIdioma = useNombreIdioma()
  const { cuenta, responder } = useCuenta()
  const uid = React.useId()
  const raiz = React.useRef<HTMLFormElement>(null)
  // Los campos que se piden no cambian mientras se rellenan
  const [campos] = React.useState(() => [...faltan])
  const [intento, setIntento] = React.useState(false)
  const [borrador, setBorrador] = React.useState(() => ({
    redes: [...(cuenta.clipero.redes ?? [])],
    pais: cuenta.pais,
    idiomas: cuenta.idiomas.length
      ? [...cuenta.idiomas]
      : esId(IDIOMAS_AUDIENCIA, locale)
        ? [locale]
        : [],
  }))

  const respuestas = {
    ...cuenta,
    pais: borrador.pais,
    idiomas: borrador.idiomas,
    clipero: { ...cuenta.clipero, redes: borrador.redes },
  }
  const errores = [
    ...validarToma("redes", respuestas),
    ...validarToma("basicos", respuestas),
  ].filter(
    (e): e is ErrorToma => e.bloquea && campos.includes(e.campo as RequisitoCampana)
  )
  const errorDe = (campo: RequisitoCampana) =>
    intento ? errores.find((e) => e.campo === campo) : undefined
  const textoError = (e: ErrorToma) =>
    e.code === "orgCorto" || e.code === "orgLargo"
      ? te(e.code, e.values)
      : e.code === "limiteElegidos" || e.code === "maxIdiomas"
        ? te(e.code, e.values)
        : te(e.code)

  const enviar = (e: React.FormEvent) => {
    e.preventDefault()
    if (errores.length) {
      setIntento(true)
      const primero = errores[0].campo
      const campo = raiz.current?.querySelector<HTMLElement>(`[data-campo="${primero}"]`)
      campo
        ?.querySelector<HTMLElement>(
          'button[role="combobox"], [data-state="on"], button, [tabindex="0"]'
        )
        ?.focus()
      return
    }
    if (campos.includes("redes"))
      responder("clipero.redes", borrador.redes as RedPublicacion[])
    if (campos.includes("pais")) responder("pais", borrador.pais)
    if (campos.includes("idiomas")) responder("idiomas", borrador.idiomas)
    onListo()
  }

  const bloque = (campo: RequisitoCampana, contenido: React.ReactNode) => {
    const error = errorDe(campo)
    return (
      <div
        data-campo={campo}
        data-invalid={error ? true : undefined}
        className="space-y-2.5"
      >
        {contenido}
        {error && (
          <FieldError id={`${uid}-${campo}-error`}>{textoError(error)}</FieldError>
        )}
      </div>
    )
  }
  const describedBy = (campo: RequisitoCampana, extra?: string) =>
    [errorDe(campo) ? `${uid}-${campo}-error` : null, extra].filter(Boolean).join(" ") ||
    undefined

  return (
    <form
      ref={raiz}
      noValidate
      onSubmit={enviar}
      data-requisitos=""
      className={cn("space-y-6", className)}
    >
      {campos.includes("redes") &&
        bloque(
          "redes",
          <>
            <p id={`${uid}-redes`} className="text-sm font-medium">
              {t("redes")}
            </p>
            <ChipGroup<RedPublicacion>
              entrada={false}
              sonido={false}
              value={borrador.redes}
              excluyentes={[SIN_CUENTA]}
              onValueChange={(sel) => setBorrador((b) => ({ ...b, redes: sel }))}
              aria-labelledby={`${uid}-redes`}
              aria-describedby={describedBy("redes")}
              invalid={!!errorDe("redes")}
              options={[
                ...SOCIAL_IDS.map((red) => ({
                  value: red,
                  label: SOCIAL_NETWORKS[red].name,
                  icon: <SocialGlyph network={red} tone="official" />,
                })),
                { value: "otra" as const, label: tr("otra"), icon: <Globe /> },
                { value: SIN_CUENTA, label: tr("sin-cuenta") },
              ]}
            />
          </>
        )}

      {campos.includes("pais") &&
        bloque(
          "pais",
          <>
            <label htmlFor={`${uid}-pais`} className="block text-sm font-medium">
              {t("pais")}
            </label>
            <Select
              value={borrador.pais ?? ""}
              onValueChange={(v) =>
                setBorrador((b) => ({ ...b, pais: v as PaisResidencia }))
              }
            >
              <SelectTrigger
                id={`${uid}-pais`}
                aria-invalid={errorDe("pais") ? true : undefined}
                aria-describedby={describedBy("pais")}
                className="h-11 w-full sm:max-w-sm"
              >
                <SelectValue placeholder={t("paisPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {COUNTRY_CODES.map((code) => (
                  <SelectItem key={code} value={code}>
                    <CountryFlag code={code} className="h-3.5 w-[1.125rem]" />
                    {nombrePais(code)}
                  </SelectItem>
                ))}
                <SelectItem value="otro">
                  <Globe className="size-4" aria-hidden />
                  {t("paisOtro")}
                </SelectItem>
              </SelectContent>
            </Select>
          </>
        )}

      {campos.includes("idiomas") &&
        bloque(
          "idiomas",
          <>
            <p id={`${uid}-idiomas`} className="text-sm font-medium">
              {t("idiomas")}
            </p>
            <ChipGroup<IdiomaAudiencia>
              entrada={false}
              sonido={false}
              value={borrador.idiomas}
              max={LIMITES_ONBOARDING.idiomas}
              onValueChange={(sel) => setBorrador((b) => ({ ...b, idiomas: sel }))}
              aria-labelledby={`${uid}-idiomas`}
              aria-describedby={describedBy("idiomas", `${uid}-idiomas-ayuda`)}
              invalid={!!errorDe("idiomas")}
              options={IDIOMAS_AUDIENCIA.map((codigo) => ({
                value: codigo,
                label: nombreIdioma(codigo),
              }))}
            />
            <p id={`${uid}-idiomas-ayuda`} className="text-sm text-muted-foreground">
              {t("idiomasHelp", { max: LIMITES_ONBOARDING.idiomas })}
            </p>
          </>
        )}

      <div className="flex justify-end">
        <Button type="submit">{t("continue")}</Button>
      </div>
    </form>
  )
}
