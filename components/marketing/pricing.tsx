"use client"

import { usePrecio } from "@/components/planes/precio"
import * as React from "react"
import { ArrowRight, Check } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import { useFormat } from "@/hooks/use-format"
import { useMotionGroup } from "@/hooks/use-motion-group"
import { DESCUENTO_ANUAL_PCT, type PricingPlanId } from "@/lib/pricing"
import { PLANES_SEMILLA, planesVisibles, puntosDe, type PlanCatalogo } from "@/lib/planes"
import { useCatalogoPlanes } from "@/hooks/use-catalogo-planes"
import { useLemaPlan, useNombrePlan } from "@/components/planes/nombre-plan"
import { planCatalog as catalogoClipealo } from "@/src/data/pricing"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

/*
 * Movimiento (AGENTS.md, reglas 5 a 8; CSS en app/motion/pricing.css):
 * - Respuesta al gesto (E14): al cambiar de ciclo el precio y su línea de
 *   facturación ruedan (`.m-price`) y, al pasar a anual, el ahorro destella
 *   (`.m-flash`). Viven en PlanCards y BillingToggle, así que ocurren igual en
 *   la landing y en /precios: el mismo interruptor responde igual en las dos.
 *   La comparativa de /precios no rueda sus cifras: es una tabla densa con la
 *   cabecera fija, y al tocar el interruptor queda fuera de la vista.
 * - Entrada al hacer scroll (E5 y E14): el encabezado y las tarjetas solo
 *   entran en la landing. En /precios no hay grupos (`entrada` sin activar) y
 *   todo se ve terminado desde el primer fotograma.
 */

/**
 * `true` desde el primer cambio de `valor`. El primer render, y con él la
 * hidratación, nunca anima: lo que pinta el servidor no se oculta para rodarlo.
 * Es un ajuste de estado durante el render (sin efecto), así que la clase llega
 * en el mismo commit que el valor nuevo y no hay un fotograma sin animar.
 */
function useHaCambiado<T>(valor: T) {
  const [inicial] = React.useState(valor)
  const [cambiado, setCambiado] = React.useState(false)
  if (!cambiado && !Object.is(valor, inicial)) setCambiado(true)
  return cambiado
}

/**
 * Conmutador mensual/anual. Controlado desde fuera para compartirlo con la tabla.
 *
 * Al pasar a anual, el badge del ahorro se remonta con `.m-flash`: un anillo en
 * `primary` aparece y se va en su sitio. Es luz, así que se ve igual con
 * «reducir movimiento». El interruptor ya suena: no se añade sonido.
 */
export function BillingToggle({
  yearly,
  onChange,
  id = "ciclo",
  descuento = DESCUENTO_ANUAL_PCT,
}: {
  yearly: boolean
  onChange: (yearly: boolean) => void
  id?: string
  descuento?: number
}) {
  const t = useTranslations("pricing.billing")
  const f = useFormat()
  const cambiado = useHaCambiado(yearly)

  return (
    <div className="flex items-center justify-center gap-3">
      <Label htmlFor={id} className="text-sm text-muted-foreground">
        {t("monthly")}
      </Label>
      <Switch
        id={id}
        checked={yearly}
        onCheckedChange={onChange}
        aria-label={t("yearlyLabel")}
      />
      <Label htmlFor={id} className="text-sm">
        {t("yearly")}
        <Badge
          // Remontar reinicia el destello aunque se cambie de ciclo muy seguido
          key={String(yearly)}
          variant="brand-subtle"
          className={cn("ml-1.5", cambiado && yearly && "m-flash")}
        >
          −{f.percent(descuento)}
        </Badge>
      </Label>
    </div>
  )
}

/**
 * Escalonado de las tarjetas cuando van en fila (lg). En una columna no hay
 * escalonado: cada tarjeta es su propio grupo y entra al llegar. Clases literales.
 */
const ESCALONADO_TARJETAS = ["lg:[--i:0]", "lg:[--i:1]", "lg:[--i:2]"] as const

type MonedaLanding = "PEN" | "USD"

const PLANES_PRECIO_LANDING: {
  id: string
  base: PricingPlanId
  name: string
  monthlyPEN: number
  annualPEN: number
  monthlyUSD: number
  annualUSD: number
  credits: number
  featured: boolean
}[] = [
  {
    id: "landing-free",
    base: "free",
    ...catalogoClipealo.free,
    featured: false,
  },
  {
    id: "landing-basico",
    base: "creator",
    ...catalogoClipealo.basico,
    featured: false,
  },
  {
    id: "landing-estandar",
    base: "business",
    ...catalogoClipealo.estandar,
    featured: true,
  },
  {
    id: "landing-premium",
    base: "business",
    ...catalogoClipealo.premium,
    featured: false,
  },
]

const DESCUENTO_CATALOGO = Math.round(
  (1 - catalogoClipealo.basico.annualPEN / catalogoClipealo.basico.monthlyPEN) * 100
)

function formatearPrecioLanding(amount: number, currency: MonedaLanding, locale: string) {
  const number = new Intl.NumberFormat(currency === "USD" ? "en-US" : locale, {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
    useGrouping: false,
  }).format(amount)
  return currency === "PEN" ? `S/${number}` : `US$${number}`
}

/**
 * Las tarjetas: los planes visibles del catálogo (`lib/planes.ts`), que son los
 * tres de la web más los que el backoffice haya creado y enseñado. Las lee la
 * landing y la página /precios: una sola fuente y un solo diseño.
 *
 * `entrada`: cada tarjeta entra al hacer scroll (grupo de movimiento propio).
 * Solo la landing lo activa; sin él, las tarjetas se ven terminadas.
 */
export function PlanCards({
  yearly,
  compact = false,
  entrada = false,
  preciosClipealo = false,
  moneda = "PEN",
}: {
  yearly: boolean
  compact?: boolean
  entrada?: boolean
  /** Usa las cifras actuales de Clipealo y conserva el contenido visual del mockup. */
  preciosClipealo?: boolean
  moneda?: MonedaLanding
}) {
  const cambiado = useHaCambiado(yearly)
  const locale = useLocale()
  const catalogo = useCatalogoPlanes()
  const planes = planesVisibles(catalogo)
  const cards = preciosClipealo
    ? PLANES_PRECIO_LANDING.flatMap((precio) => {
        const plan =
          catalogo.find((item) => item.id === precio.base) ??
          PLANES_SEMILLA.find((item) => item.id === precio.base)
        return plan ? [{ key: precio.id, plan, precio }] : []
      })
    : planes.map((plan) => ({ key: plan.id, plan, precio: undefined }))
  const priceFormatter = React.useCallback(
    (amount: number) => formatearPrecioLanding(amount, moneda, locale),
    [locale, moneda]
  )

  return (
    <div
      className={cn(
        "grid items-start gap-5",
        // Con tres, la fila de siempre; con más, dos por fila y cuatro en pantallas anchas
        cards.length <= 3 ? "lg:grid-cols-3" : "md:grid-cols-2 xl:grid-cols-4"
      )}
    >
      {cards.map(({ key, plan, precio }, indice) => (
        <TarjetaPlan
          key={key}
          plan={plan}
          yearly={yearly}
          compact={compact}
          cambiado={cambiado}
          entrada={entrada}
          escalonado={ESCALONADO_TARJETAS[indice % ESCALONADO_TARJETAS.length]}
          nombreVisible={precio?.name}
          destacado={precio?.featured}
          mensual={precio ? (moneda === "PEN" ? precio.monthlyPEN : precio.monthlyUSD) : undefined}
          anual={precio ? (moneda === "PEN" ? precio.annualPEN : precio.annualUSD) : undefined}
          minutos={precio?.credits}
          formatoPrecio={preciosClipealo ? priceFormatter : undefined}
        />
      ))}
    </div>
  )
}

function TarjetaPlan({
  plan,
  yearly,
  compact,
  cambiado,
  entrada,
  escalonado,
  nombreVisible,
  destacado,
  mensual,
  anual,
  minutos,
  formatoPrecio: formatoPrecioOverride,
}: {
  plan: PlanCatalogo
  yearly: boolean
  compact: boolean
  /** El ciclo ya ha cambiado alguna vez: el precio nuevo rueda. */
  cambiado: boolean
  entrada: boolean
  escalonado?: string
  nombreVisible?: string
  destacado?: boolean
  mensual?: number
  anual?: number
  minutos?: number
  formatoPrecio?: (amount: number) => string
}) {
  const t = useTranslations("pricing")
  const f = useFormat()
  const formatoPrecio = usePrecio()
  const nombrePlan = useNombrePlan()
  const lemaPlan = useLemaPlan()
  const tarjeta = React.useRef<HTMLDivElement>(null)
  // Sin `entrada` la ref no se engancha y el hook no observa nada
  useMotionGroup(tarjeta)

  const featured = destacado ?? plan.featured
  const monthlyPrice = mensual ?? plan.monthly
  const yearlyPrice = anual ?? plan.yearly
  const price = yearly ? yearlyPrice : monthlyPrice
  const showPrice = formatoPrecioOverride ?? formatoPrecio
  const visibleName = nombreVisible ?? nombrePlan(plan)
  // El precio solo rueda si cambia de verdad (el gratuito vale 0 en los dos ciclos)
  const rueda = cambiado && monthlyPrice !== yearlyPrice

  return (
    <div
      ref={entrada ? tarjeta : undefined}
      data-motion-group={entrada ? "client" : undefined}
      // Luz bajo el puntero (E11). Sin PointerLight montado (/precios) no hace nada
      data-light="claro"
      className={cn(
        "relative flex flex-col rounded-frame p-6 sm:p-8",
        entrada && ["m-anim m-rise", escalonado],
        featured
          ? "bg-card shadow-lg ring-2 ring-brand lg:-my-4 lg:py-12"
          : "bg-card ring-1 ring-border"
      )}
    >
      {featured && (
        <Badge
          variant="brand"
          className="absolute -top-2.5 left-1/2 h-6 -translate-x-1/2 px-3"
        >
          {t("mostPopular")}
        </Badge>
      )}

      <h3 className="text-lg font-bold tracking-tight">{visibleName}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{lemaPlan(plan)}</p>
      {nombreVisible && (
        <p className="mt-2 text-xs font-semibold text-primary">
          {f.number(minutos ?? plan.minutos)} créditos al mes
        </p>
      )}

      <p className="mt-6 flex flex-wrap items-baseline gap-x-1.5">
        {/* `key` por ciclo: el precio nuevo es otro nodo y su animación empieza de cero */}
        <span
          key={`${plan.id}-${yearly}`}
          // En 320-360 px «US$19.50» en la display no cabía en la tarjeta: baja un poco solo ahí
          className={cn(
            "display text-[clamp(1.75rem,9vw,2.25rem)] tabular-nums",
            rueda && "m-price"
          )}
        >
          {showPrice(price)}
        </span>
        <span className="text-sm text-muted-foreground">
          {price === 0 ? t("forever") : t("perMonth")}
        </span>
      </p>
      {price > 0 && (
        <p
          key={`${plan.id}-${yearly}`}
          className={cn("mt-1 text-xs text-muted-foreground", cambiado && "m-price")}
        >
          {yearly
            ? t.rich("billedYearly", {
                total: showPrice(price * 12),
                before: showPrice(monthlyPrice),
                s: (chunks) => <s>{chunks}</s>,
              })
            : t("orYearly", { price: showPrice(yearlyPrice) })}
        </p>
      )}

      {/* Única acción brand de /precios y de la sección #precios de la landing
          (regla 2): la cabecera y la comparativa van en contorno */}
      <Button
        variant={featured ? "brand" : "outline"}
        size="lg"
        asChild
        className="mt-6 w-full"
      >
        <Link href="/subir">
          {nombreVisible
            ? plan.base === "free"
              ? t("plans.free.cta")
              : t("choose", { plan: visibleName })
            : plan.origen === "semilla"
            ? t(`plans.${plan.base}.cta`)
            : t("choose", { plan: nombrePlan(plan) })}
        </Link>
      </Button>

      {!compact && (
        <ul className="mt-8 space-y-3 text-sm">
          {/* Los puntos son los de su escalón; los minutos, los suyos */}
          {puntosDe(plan).map((clave) => (
            <li key={clave} className="flex gap-2.5">
              <Check
                className={cn(
                  "mt-0.5 size-4 shrink-0",
                  featured ? "text-brand" : "text-primary"
                )}
                aria-hidden
              />
              <span className="text-muted-foreground">
                {t(clave, { minutes: f.number(minutos ?? plan.minutos) })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Sección de precios de la landing: resumen, con enlace a la comparativa completa. */
export function Pricing() {
  const t = useTranslations("marketing.pricing")
  const [yearly, setYearly] = React.useState(false)
  const [moneda, setMoneda] = React.useState<MonedaLanding>("PEN")
  const encabezado = React.useRef<HTMLDivElement>(null)
  // E5: antetítulo, titular cortado a 12 fps, entradilla y conmutador, al entrar
  useMotionGroup(encabezado)

  return (
    <section id="precios" className="container-page scroll-mt-24 py-20 md:py-28">
      <div
        ref={encabezado}
        data-motion-group="client"
        className="mx-auto max-w-2xl text-center"
      >
        <p className="m-anim m-rise text-sm font-semibold tracking-wide text-brand uppercase">
          {t("eyebrow")}
        </p>
        {/* El corte empieza en el borde de la caja: dar por descubierto el margen
            del centrado dejaba trozos de letras a la vista mientras espera */}
        <h2 className="m-anim m-cut mt-3 display text-[clamp(2rem,5vw,3.25rem)] [--i:1]">
          {t.rich("title", { br: () => <br /> })}
        </h2>
        <p className="m-anim m-rise mt-5 text-lg text-pretty text-muted-foreground [--i:2]">
          {t("lead")}
        </p>

        <div className="m-anim m-rise mt-8 [--i:3]">
          <BillingToggle yearly={yearly} onChange={setYearly} descuento={DESCUENTO_CATALOGO} />
        </div>
        <div className="m-anim m-rise mt-3 flex justify-center [--i:4]">
          <div role="group" aria-label="Moneda" className="inline-flex rounded-full border border-border bg-background/70 p-1">
            {(["PEN", "USD"] as const).map((currency) => (
              <button
                key={currency}
                type="button"
                aria-pressed={moneda === currency}
                onClick={() => setMoneda(currency)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                  moneda === currency
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {currency === "PEN" ? "S/ Soles" : "US$ Dólares"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-14">
        <PlanCards yearly={yearly} entrada preciosClipealo moneda={moneda} />
      </div>

      <div className="mt-10 flex flex-col items-center gap-3 text-center">
        {/* En móvil el texto largo (es, pt) parte en dos líneas en vez de desbordar la página */}
        <Button
          variant="ghost"
          size="lg"
          asChild
          className="h-auto min-h-9 max-w-full py-1.5 whitespace-normal"
        >
          <Link href="/precios">
            {t("compare")} <ArrowRight />
          </Link>
        </Button>
        <p className="max-w-2xl text-xs text-balance text-muted-foreground">
          {t("footnote")}
        </p>
      </div>
    </section>
  )
}
