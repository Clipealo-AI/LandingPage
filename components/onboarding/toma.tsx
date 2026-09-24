"use client"

import * as React from "react"
import { ArrowLeft } from "lucide-react"
import { useTranslations } from "next-intl"

import { cn } from "@/lib/utils"
import {
  esPasoOpcional,
  esRender,
  pasoAnterior,
  retardosDe,
  retardosDeFrases,
  type CampoToma as IdCampo,
} from "@/lib/onboarding"
import { EASE_BRAND, prefiereMenosMovimiento } from "@/lib/preferencia-movimiento"
import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"
import { Kbd } from "@/components/ui/kbd"
import { CropFrame } from "@/components/brand/logo"
import {
  EVENTO_TOMA,
  useFlujo,
  type DetalleEventoToma,
} from "@/components/onboarding/contexto"
import { DataLabel, type QuienVe } from "@/components/onboarding/data-label"
import { ESPERA_ANUNCIO_MS } from "@/components/onboarding/region-viva"
import { PalabrasToma, finEscritura } from "@/components/onboarding/type-line"

// El motor de la línea que se escribe vive en type-line.tsx; se reexporta aquí
// porque el flujo y sus tests lo importan de la toma
export {
  DURACION_PALABRA_MS,
  PalabrasToma,
  finEscritura,
} from "@/components/onboarding/type-line"

/** La reacción se escribe una vez, deprisa (§5.3): sin pausa y en 500 ms como mucho. */
const RITMO_REACCION = { pausa: 0, tope: 500 } as const

/** Fundido de la toma que sale (§5.3: 160 ms; con la que entra, 320 ms como mucho). */
const SALIDA_TOMA_MS = 160

export interface TomaProps {
  /** Lo que se escribe: la pregunta. Va completa en el `sr-only` del `h1`. */
  pregunta: string
  /** Solo en la primera toma: «Hola, {nombre}…», escrito antes de la pregunta. */
  saludo?: string | null
  /** «Para qué»: una línea bajo la pregunta que no se escribe. */
  paraQue?: string
  /** Etiqueta de datos ⓘ: quién ve lo que se responde aquí. */
  datos?: QuienVe | null
  /**
   * Lo que cambia en pantalla al responder. Se ve 600 ms después del último
   * cambio (`aria-hidden`); la versión accesible va a la región viva.
   */
  reaccion?: string | null
  /** Lo que dice la región viva si no es la reacción («12 campañas encajan contigo»). */
  anuncio?: string | null
  children: React.ReactNode
}

/**
 * Cómo se ve la reacción:
 * - `fija`: ya estaba al entrar en la toma (se ve tal cual);
 * - `escribe`: la primera respuesta de esta toma, que se escribe una vez;
 * - `funde`: las siguientes, con fundido cruzado de 150 ms (`previa` sale).
 */
interface VistaReaccion {
  texto: string | null
  modo: "fija" | "escribe" | "funde"
  previa: string | null
  /** Cambia con cada texto nuevo: vuelve a montar la línea y su animación. */
  n: number
  /** Ya hubo una reacción en esta toma: la siguiente no se escribe. */
  escrita: boolean
}

/**
 * Una toma (§5.2): `section[data-toma]` › `fieldset` › `legend` con el `h1`
 * (`#toma-titulo`, `tabindex=-1`, encuadrado con la marca de recorte), el
 * «Para qué» con ⓘ, los controles, la reacción y las acciones «Atrás ·
 * Saltar esta toma · Continuar Enter ↵».
 *
 * La toma no navega ni valida: lo hace `OnboardingFlow` (`useFlujo`). Un clic o
 * un toque sobre la toma completa el texto que se escribe.
 *
 * Montaje (§5.3-§5.5, CSS en `app/motion/onboarding.css`):
 * - la pregunta (y el saludo) se escriben palabra a palabra con cursor; con
 *   «reducir movimiento», karaoke de color;
 * - las esquinas del título entran con `crop-in` (con reduce, `fade-soft`);
 * - «Para qué» y ⓘ funden al acabar la pregunta (`--toma-fin` + 80 ms);
 * - los controles entran escalonados (`[data-toma-entrada]`), usables desde el
 *   primer fotograma;
 * - la primera reacción se escribe; las siguientes funden.
 * Con `data-completo` (toma vista, acelerada o prisa aprendida) todo está en su
 * estado final desde el principio.
 */
export function Toma({
  pregunta,
  saludo,
  paraQue,
  datos,
  reaccion = null,
  anuncio,
  children,
}: TomaProps) {
  const ctx = useFlujo()
  const t = useTranslations("onboarding.chrome")
  const { registrarEscritura, anunciar } = ctx

  const frases = React.useMemo(
    () => (saludo ? retardosDeFrases([saludo, pregunta]) : [retardosDe(pregunta)]),
    [saludo, pregunta]
  )
  const fin = finEscritura(frases)
  React.useEffect(() => registrarEscritura(fin), [fin, registrarEscritura])

  // La reacción se ve 600 ms después del último cambio; lo que ya estaba, al instante
  const [vista, setVista] = React.useState<VistaReaccion>(() => ({
    texto: reaccion,
    modo: "fija",
    previa: null,
    n: 0,
    escrita: !!reaccion,
  }))
  const reaccionPrevia = React.useRef(reaccion)
  const decirReaccion = React.useEffectEvent((texto: string | null) => {
    const dicho = anuncio ?? texto
    if (dicho) anunciar(dicho)
  })
  // Con la prisa aprendida, la reacción tampoco se escribe: funde
  const prisaAprendida = React.useEffectEvent(() => ctx.cuenta.onboarding.animacionVista)
  React.useEffect(() => {
    if (reaccionPrevia.current === reaccion) return
    reaccionPrevia.current = reaccion
    decirReaccion(reaccion)
    const mostrar = window.setTimeout(() => {
      const rapida = prisaAprendida()
      setVista((v) => {
        if (v.texto === reaccion) return v
        if (!reaccion)
          return { ...v, texto: null, modo: "fija", previa: null, n: v.n + 1 }
        if (!v.escrita && !rapida)
          return {
            texto: reaccion,
            modo: "escribe",
            previa: null,
            n: v.n + 1,
            escrita: true,
          }
        return {
          texto: reaccion,
          modo: "funde",
          previa: v.texto,
          n: v.n + 1,
          escrita: true,
        }
      })
    }, ESPERA_ANUNCIO_MS)
    // La que sale se quita sola al acabar su fundido; esto es la red (sin CSS, jsdom)
    const limpiar = window.setTimeout(
      () => setVista((v) => (v.previa ? { ...v, previa: null } : v)),
      ESPERA_ANUNCIO_MS + 400
    )
    return () => {
      window.clearTimeout(mostrar)
      window.clearTimeout(limpiar)
    }
  }, [reaccion])

  const invalida = ctx.intento && ctx.errores.some((e) => e.bloquea)
  const anterior = pasoAnterior(ctx.pasos, ctx.paso)
  const primera = ctx.numero === 1

  return (
    <section
      data-toma={ctx.paso}
      data-completo={ctx.completo ? "" : undefined}
      aria-labelledby="toma-titulo"
      onPointerDown={ctx.completarTexto}
      className="flex flex-col"
      style={{ "--toma-fin": `${fin}ms` } as React.CSSProperties}
    >
      <fieldset
        data-invalid={invalida || undefined}
        className="min-w-0 space-y-6 rounded-2xl data-invalid:ring-2 data-invalid:ring-destructive/40 data-invalid:ring-offset-8 data-invalid:ring-offset-background"
      >
        <legend className="w-full">
          {saludo && (
            <span
              data-toma-saludo=""
              className="mb-3 block text-lg leading-snug font-medium text-pretty text-muted-foreground @3xl/bienvenida:text-xl"
            >
              <span className="sr-only">{saludo}</span>
              <PalabrasToma palabras={frases[0]} completo={ctx.completo} cursor="sigue" />
            </span>
          )}
          <CropFrame
            size="sm"
            animateIn={!ctx.completo}
            data-toma-marco=""
            className="-mx-3 w-fit max-w-[calc(100%+1.5rem)] px-3 py-2"
          >
            <h1
              id="toma-titulo"
              tabIndex={-1}
              className="scroll-mt-28 text-[clamp(1.75rem,1rem+1.6cqi,2.75rem)] leading-tight font-bold tracking-tight text-balance outline-none @5xl/bienvenida:scroll-mt-10"
            >
              <span className="sr-only">{pregunta}</span>
              <PalabrasToma
                palabras={frases[frases.length - 1]}
                completo={ctx.completo}
                cursor="fin"
              />
            </h1>
          </CropFrame>
        </legend>

        {(paraQue || datos) && (
          <div data-para-que-fila="" className="-mt-2 flex items-start gap-1.5">
            {paraQue && (
              <p data-para-que="" className="text-pretty text-muted-foreground">
                {paraQue}
              </p>
            )}
            {datos && <DataLabel quien={datos} />}
          </div>
        )}

        {primera && !ctx.completo && (
          <Button
            type="button"
            variant="link"
            size="sm"
            className="-mt-4 h-auto p-0 text-muted-foreground"
            onClick={ctx.saltarIntro}
          >
            {t("actions.skipIntro")}
          </Button>
        )}

        <div data-toma-controles="" className="space-y-8">
          {children}
        </div>

        <p
          data-reaccion=""
          aria-hidden="true"
          className={cn(
            "relative min-h-6 text-pretty text-foreground/80 @3xl/bienvenida:text-lg",
            !vista.texto && "invisible"
          )}
        >
          {vista.texto &&
            (vista.modo === "escribe" ? (
              <PalabrasToma
                key={vista.n}
                palabras={retardosDe(vista.texto, RITMO_REACCION)}
                completo={false}
                cursor="no"
              />
            ) : (
              <span
                key={vista.n}
                data-reaccion-texto=""
                data-funde={vista.modo === "funde" ? "" : undefined}
              >
                {vista.texto}
              </span>
            ))}
          {vista.texto && vista.previa && (
            <span
              key={`previa-${vista.n}`}
              data-reaccion-previa=""
              className="pointer-events-none absolute inset-x-0 top-0"
              onAnimationEnd={() => setVista((v) => ({ ...v, previa: null }))}
            >
              {vista.previa}
            </span>
          )}
        </p>
      </fieldset>

      <div
        data-acciones=""
        className="mt-8 flex flex-wrap items-center gap-2 border-t pt-6"
      >
        {anterior && (
          <Button
            type="button"
            variant="ghost"
            size="lg"
            className="-ml-2.5 h-11"
            onClick={ctx.atras}
          >
            <ArrowLeft /> {t("actions.back")}
          </Button>
        )}
        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          {esPasoOpcional(ctx.paso) && (
            <Button
              type="button"
              variant="ghost"
              size="lg"
              className="h-11"
              onClick={ctx.saltar}
            >
              {t("actions.skip")}
            </Button>
          )}
          <Button
            type="button"
            size="lg"
            className="h-11 gap-2.5 px-5"
            onClick={ctx.continuar}
          >
            {t("actions.continue")}
            <Kbd
              aria-hidden
              className="hidden bg-primary-foreground/15 text-primary-foreground pointer-fine:inline-flex"
            >
              {t("enter")}
            </Kbd>
          </Button>
        </div>
      </div>
    </section>
  )
}

/**
 * Un grupo de controles de la toma con su etiqueta, su ayuda y su error
 * (`data-campo`: ahí lleva el foco `OnboardingFlow` si no se puede continuar).
 * El error solo se ve tras intentar continuar y, desde ahí, en vivo.
 *
 * Los hijos reciben los ids para `aria-labelledby` y `aria-describedby`.
 */
export function CampoToma({
  campo,
  etiqueta,
  ayuda,
  htmlFor,
  className,
  children,
}: {
  campo: IdCampo
  /** Sin etiqueta, el grupo se nombra con la pregunta (`toma-titulo`). */
  etiqueta?: string
  ayuda?: string
  /** Si el control es un campo de formulario: la etiqueta es un `<label>`. */
  htmlFor?: string
  className?: string
  children: (a: {
    etiquetaId: string
    describedBy: string | undefined
    invalid: boolean
  }) => React.ReactNode
}) {
  const ctx = useFlujo()
  const id = React.useId()
  const error = ctx.error(campo)
  const etiquetaId = etiqueta ? `${id}-etiqueta` : "toma-titulo"
  const describedBy =
    [error ? `${id}-error` : null, ayuda ? `${id}-ayuda` : null]
      .filter(Boolean)
      .join(" ") || undefined

  return (
    <div
      data-campo={campo}
      data-invalid={error ? true : undefined}
      className={cn("space-y-3", className)}
    >
      {etiqueta &&
        (htmlFor ? (
          <label id={etiquetaId} htmlFor={htmlFor} className="block text-sm font-medium">
            {etiqueta}
          </label>
        ) : (
          <p id={etiquetaId} className="text-sm font-medium">
            {etiqueta}
          </p>
        ))}
      {children({ etiquetaId, describedBy, invalid: !!error })}
      {ayuda && (
        <p id={`${id}-ayuda`} className="text-sm text-muted-foreground">
          {ayuda}
        </p>
      )}
      {error && <FieldError id={`${id}-error`}>{ctx.textoError(error)}</FieldError>}
    </div>
  )
}

/* ---------------------------------------------------------------------------
   Cambio de toma (§5.3): la saliente se funde y sube 8 px; entra la siguiente
   --------------------------------------------------------------------------- */

/**
 * Atributos que no puede llevar la copia de la toma que sale: nadie debe
 * encontrarla. Era una lista de los enganches conocidos y se quedaba corta
 * —`data-reaccion` no estaba, y durante los 160 ms de la salida había dos
 * reacciones en la página—, así que fuera van TODOS los `data-` y los `aria-`:
 * la copia es decorativa y lo que la pinta son sus clases.
 */
const ATRIBUTOS_FUERA = [
  "id",
  "for",
  "name",
  "placeholder",
  "title",
  "alt",
  "role",
  "tabindex",
  "href",
]

const sobra = (nombre: string) =>
  nombre.startsWith("aria-") ||
  nombre.startsWith("data-") ||
  ATRIBUTOS_FUERA.includes(nombre)

/**
 * Copia decorativa de la toma que sale: sin ids, roles ni enganches (el foco,
 * las teclas 1-9 y `getElementById("toma-titulo")` solo encuentran la nueva),
 * `inert` y con el texto pasado a contenido generado (`::before`), para que ni
 * el lector de pantalla ni una búsqueda por texto la confundan con la real.
 */
function fantasmaDe(toma: HTMLElement) {
  const copia = toma.cloneNode(true) as HTMLElement
  const todos = [copia, ...Array.from(copia.querySelectorAll<HTMLElement>("*"))]
  for (const el of todos) {
    for (const nombre of el.getAttributeNames()) {
      if (sobra(nombre)) el.removeAttribute(nombre)
    }
  }
  const recorrido = document.createTreeWalker(copia, NodeFilter.SHOW_TEXT)
  const textos: Text[] = []
  for (let n = recorrido.nextNode(); n; n = recorrido.nextNode()) textos.push(n as Text)
  for (const nodo of textos) {
    if (!nodo.data || nodo.parentElement instanceof SVGElement) continue
    const sustituto = document.createElement("span")
    sustituto.setAttribute("data-texto-fantasma", nodo.data)
    nodo.replaceWith(sustituto)
  }
  copia.setAttribute("aria-hidden", "true")
  copia.setAttribute("data-toma-fantasma", "")
  copia.inert = true
  return copia
}

/**
 * Escena de las tomas: envuelve la toma en curso (`<Contenido key={paso} />`)
 * y, al cambiar de toma (`EVENTO_TOMA`, que el flujo emite ANTES del cambio),
 * deja encima una copia de la saliente que se funde y sube 8 px en 160 ms,
 * mientras la nueva entra escalonada con `[data-toma-entrada]`. Con «reducir
 * movimiento», fundido cruzado sin desplazamiento: se ve igual de claro que
 * la toma ha cambiado, que es para lo que está.
 *
 * La nueva toma se puede usar desde el primer fotograma: la copia es `inert`,
 * no recibe el puntero y se borra al terminar. Hacia el render no hay copia: la
 * composición cambia entera y el registro trae su propia entrada.
 */
export function EscenaToma({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const escena = ref.current
    if (!escena) return
    const alCambiar = (evento: Event) => {
      const d = (evento as CustomEvent<DetalleEventoToma>).detail
      if (!d?.siguiente || esRender(d.siguiente)) return
      const saliente = escena.querySelector<HTMLElement>(":scope > [data-toma]")
      if (!saliente || typeof saliente.animate !== "function") return

      const fantasma = fantasmaDe(saliente)
      Object.assign(fantasma.style, {
        position: "absolute",
        top: `${saliente.offsetTop}px`,
        left: `${saliente.offsetLeft}px`,
        width: `${saliente.offsetWidth}px`,
        margin: "0",
        pointerEvents: "none",
      })
      escena.appendChild(fantasma)
      const quitar = () => fantasma.remove()
      const fotogramas: Keyframe[] = prefiereMenosMovimiento()
        ? [{ opacity: 1 }, { opacity: 0 }]
        : [
            { opacity: 1, translate: "0 0" },
            { opacity: 0, translate: "0 -8px" },
          ]
      try {
        fantasma
          .animate(fotogramas, { duration: SALIDA_TOMA_MS, easing: EASE_BRAND })
          .finished.then(quitar, quitar)
      } catch {
        quitar()
      }
      // Red por si la animación no llega a terminar (pestaña en segundo plano)
      window.setTimeout(quitar, SALIDA_TOMA_MS + 400)
    }
    window.addEventListener(EVENTO_TOMA, alCambiar)
    return () => window.removeEventListener(EVENTO_TOMA, alCambiar)
  }, [])

  return (
    <div ref={ref} data-toma-escena="" className={cn("relative", className)}>
      {children}
    </div>
  )
}
