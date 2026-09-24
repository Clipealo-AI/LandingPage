"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { parseAsNumberLiteral, parseAsStringLiteral, useQueryState } from "nuqs"
import { Eye, Heart, MessageCircle, RefreshCw, Repeat2, Timer } from "lucide-react"
import { useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import { toast } from "@/lib/toast"
import {
  INDEXADO_EN,
  PERIODOS,
  REDES_ANALITICA,
  fechasAnalitica,
  filasPublicaciones,
  ganado,
  hayLimiteAnaliticas,
  limitarAnaliticas,
  porRed,
  resumen,
  serieCrecimiento,
  todasLasPublicaciones,
  variacionPct,
  type FilaPublicacion,
} from "@/lib/analytics"
import { clipsEnAnaliticas, redesDe } from "@/lib/planes"
import { SOCIAL_NETWORKS } from "@/lib/social"
import { useAgenda } from "@/hooks/use-agenda"
import { useFormat } from "@/hooks/use-format"
import { usePlan } from "@/hooks/use-plan"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { SocialGlyph } from "@/components/brand/social"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { AnalyticsNetworkBars } from "@/components/app/analytics-network-bars"
import { Hueco } from "@/components/shared/hueco-grafica"
import { AnalyticsPublicationsTable } from "@/components/app/analytics-publications-table"
import { AvisoPlan } from "@/components/planes/aviso-plan"
import { useNombrePlan } from "@/components/planes/nombre-plan"

/**
 * El botón de refrescar, con su cuenta atrás.
 *
 * Vive en su propia hoja porque el segundo que baja no le importa a nadie más:
 * mientras el contador estaba en la página, cada tic repintaba /analiticas
 * entera —tabla de publicaciones, gráfica y tarjetas— treinta veces seguidas.
 */
function BotonRefrescar({
  onRefrescar,
  refrescando,
}: {
  onRefrescar: () => Promise<void>
  refrescando: boolean
}) {
  const t = useTranslations("analytics")
  const [espera, setEspera] = React.useState(0)

  React.useEffect(() => {
    if (espera <= 0) return
    const temporizador = setTimeout(() => setEspera((s) => s - 1), 1000)
    return () => clearTimeout(temporizador)
  }, [espera])

  return (
    <Button
      variant="outline"
      size="lg"
      onClick={async () => {
        await onRefrescar()
        setEspera(ESPERA_ENTRE_REFRESCOS_S)
      }}
      disabled={refrescando || espera > 0}
    >
      <RefreshCw className={cn(refrescando && "animate-spin")} />
      {refrescando
        ? t("refresh.busy")
        : espera > 0
          ? t("refresh.wait", { seconds: espera })
          : t("refresh.idle")}
    </Button>
  )
}

/**
 * Las dos piezas que usan recharts, fuera de la primera carga.
 *
 * Son 106 KB comprimidos —el segundo chunk del build— y basta con que una
 * quede estática para que vuelvan enteros, así que van las dos. El hueco mide
 * lo mismo que la gráfica para que no salte el layout; la hoja no lleva porque
 * no ocupa sitio hasta que se abre.
 */
const AnalyticsGrowthChart = dynamic(
  () =>
    import("@/components/app/analytics-growth-chart").then((m) => m.AnalyticsGrowthChart),
  { ssr: false, loading: () => <Hueco className="h-72 @7xl/analitica:h-80" /> }
)
const AnalyticsPublicationSheet = dynamic(
  () =>
    import("@/components/app/analytics-publication-sheet").then(
      (m) => m.AnalyticsPublicationSheet
    ),
  { ssr: false }
)

/** La actualización anterior del arquetipo: ayer por la tarde. */
const ANTERIOR_INICIAL = "2026-09-12T20:05:00.000Z"
/** Las redes limitan cuántas veces se les pide: entre dos refrescos, un respiro. */
const ESPERA_ENTRE_REFRESCOS_S = 30
/** Lo que tarda en volver con las cifras de todas las redes. */
const DURACION_REFRESCO_MS = 1_400

const FILTRO_RED = ["todas", ...REDES_ANALITICA] as const

/**
 * Analíticas de lo publicado. Nada es en tiempo real: todo se calcula para
 * `indexadoEn`, el instante de la última actualización, y solo cambia cuando el
 * usuario pulsa «Refrescar». Mientras se refresca, lo que hay se queda atenuado
 * en su sitio: sin esqueletos ni saltos.
 *
 * Lo que se mide son las semillas ya indexadas MÁS lo que Clipealo ha publicado
 * (`todasLasPublicaciones`): publicar un clip desde su ficha lo trae aquí solo,
 * sin pegar ningún enlace. Una recién salida entra con cero vistas y las gana
 * al refrescar.
 *
 * Y de todo eso, lo que el plan deja ver (`limitarAnaliticas`): el plan Prueba
 * mide TikTok y sus cinco últimos clips. El recorte se hace una vez, arriba,
 * para que la gráfica, las barras y la tabla no cuenten cosas distintas.
 *
 * Los filtros (período y red) viven en la URL y afectan a todo lo que hay debajo.
 */
export function AnalyticsDashboard() {
  const t = useTranslations("analytics")
  const f = useFormat()
  const { cuando } = fechasAnalitica(f.locale)
  const [periodo, setPeriodo] = useQueryState(
    "periodo",
    parseAsNumberLiteral(PERIODOS).withDefault(30)
  )
  const [red, setRed] = useQueryState(
    "red",
    parseAsStringLiteral(FILTRO_RED).withDefault("todas")
  )

  const { entradas } = useAgenda()
  const { plan } = usePlan()
  const nombrePlan = useNombrePlan()

  /**
   * Lo que el plan deja medir: sus redes y, si tiene tope, sus últimos clips.
   * Se recorta aquí y no en cada tarjeta para que la gráfica, las barras y la
   * tabla cuenten lo mismo; lo que queda fuera se dice debajo del título.
   */
  const limite = React.useMemo(
    () => ({ redes: redesDe(plan), clips: clipsEnAnaliticas(plan) }),
    [plan]
  )
  const publicadas = React.useMemo(() => todasLasPublicaciones(entradas), [entradas])
  const todas = React.useMemo(
    () => limitarAnaliticas(publicadas, limite),
    [publicadas, limite]
  )
  const fuera = publicadas.length - todas.length

  const [indexadoEn, setIndexadoEn] = React.useState(() => new Date(INDEXADO_EN))
  const [anterior, setAnterior] = React.useState<Date | null>(
    () => new Date(ANTERIOR_INICIAL)
  )
  const [refrescando, setRefrescando] = React.useState(false)
  const [abierta, setAbierta] = React.useState<FilaPublicacion | null>(null)

  const pubs = React.useMemo(
    () => (red === "todas" ? todas : todas.filter((p) => p.red === red)),
    [red, todas]
  )
  const r = React.useMemo(
    () => resumen(pubs, indexadoEn, periodo),
    [pubs, indexadoEn, periodo]
  )
  const serie = React.useMemo(
    () => serieCrecimiento(pubs, indexadoEn, periodo),
    [pubs, indexadoEn, periodo]
  )
  const redes = React.useMemo(
    () => porRed(pubs, indexadoEn, periodo),
    [pubs, indexadoEn, periodo]
  )
  const filas = React.useMemo(
    () => filasPublicaciones(pubs, indexadoEn, periodo, anterior),
    [pubs, indexadoEn, periodo, anterior]
  )
  const redesConPublicaciones = REDES_ANALITICA.filter((x) =>
    todas.some((p) => p.red === x)
  )

  const refrescar = async () => {
    setRefrescando(true)
    await new Promise((listo) => setTimeout(listo, DURACION_REFRESCO_MS))
    // Siempre hacia delante: el reloj del equipo puede ir por detrás del índice
    const ahora = new Date(Math.max(Date.now(), indexadoEn.getTime() + 3_600_000))
    const nuevas = ganado(todas, indexadoEn, ahora).vistas
    setAnterior(indexadoEn)
    setIndexadoEn(ahora)
    setRefrescando(false)
    toast.success(t("refresh.toast.title"), {
      description: t("refresh.toast.description", { n: nuevas, views: f.number(nuevas) }),
    })
  }

  const delta = (actual: number, previo: number) => {
    const v = variacionPct(actual, previo)
    return v === null ? {} : { delta: v, deltaLabel: f.delta(v) }
  }
  const retencionDelta =
    r.retencion !== null && r.retencionAnterior !== null
      ? r.retencion - r.retencionAnterior
      : null
  const nombreRed = red === "todas" ? null : SOCIAL_NETWORKS[red].name

  return (
    <>
      <PageHeader
        title={t("page.title")}
        description={t("page.description")}
        actions={
          <div className="flex flex-col items-start gap-1 sm:items-end">
            <BotonRefrescar onRefrescar={refrescar} refrescando={refrescando} />
            <p className="text-xs text-muted-foreground" aria-live="polite">
              {t.rich("refresh.updatedAt", {
                date: () => (
                  <span suppressHydrationWarning>{cuando.format(indexadoEn)}</span>
                ),
              })}
            </p>
          </div>
        }
      />

      {/* Lo que el plan deja fuera se dice antes de enseñar ninguna cifra: un
          panel recortado en silencio se lee como el panel entero */}
      {hayLimiteAnaliticas(limite) && (
        <AvisoPlan
          motivo={[
            t("plan.limite", {
              plan: nombrePlan(plan),
              red: SOCIAL_NETWORKS[limite.redes[0]].name,
              clips: limite.clips ?? 0,
            }),
            fuera > 0 ? t("plan.fuera", { n: fuera }) : null,
          ]
            .filter(Boolean)
            .join(" ")}
        />
      )}

      {/* Filtros: una fila, encima de todo lo que afectan. Sin sonido: filtrar no se celebra */}
      <div className="flex flex-wrap items-center gap-3">
        <ToggleGroup
          type="single"
          variant="outline"
          spacing={0}
          value={String(periodo)}
          onValueChange={(v) =>
            v && void setPeriodo(Number(v) as (typeof PERIODOS)[number])
          }
          aria-label={t("filters.period")}
        >
          {PERIODOS.map((d) => (
            <ToggleGroupItem
              key={d}
              value={String(d)}
              data-sound="none"
              className="h-9 px-3.5"
            >
              {t("filters.periodOption", { days: d })}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <Select
          value={red}
          onValueChange={(v) => void setRed(v as (typeof FILTRO_RED)[number])}
        >
          <SelectTrigger className="h-9 w-48" aria-label={t("filters.network")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">{t("filters.allNetworks")}</SelectItem>
            {redesConPublicaciones.map((x) => (
              <SelectItem key={x} value={x}>
                <SocialGlyph network={x} tone="official" className="size-4" aria-hidden />
                {SOCIAL_NETWORKS[x].name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div
        aria-busy={refrescando}
        className={cn(
          "space-y-6 transition-opacity duration-(--duration-base)",
          refrescando && "opacity-60"
        )}
      >
        {filas.length === 0 ? (
          <Card>
            <CardContent>
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>
                    {nombreRed
                      ? t("empty.titleNetwork", { network: nombreRed })
                      : t("empty.title")}
                  </EmptyTitle>
                  <EmptyDescription>{t("empty.description")}</EmptyDescription>
                </EmptyHeader>
                <Button variant="outline" asChild>
                  <Link href="/proyectos">{t("empty.cta")}</Link>
                </Button>
              </Empty>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 @3xl/analitica:grid-cols-3 @6xl/analitica:grid-cols-5">
              <StatCard
                featured
                className="col-span-2 @3xl/analitica:col-span-1"
                label={t("kpi.views", { days: periodo })}
                value={f.compact(r.actual.vistas)}
                icon={Eye}
                trend={r.tendencia}
                hint={t("kpi.viewsHint", { days: periodo })}
                {...delta(r.actual.vistas, r.anterior.vistas)}
              />
              <StatCard
                label={t("kpi.likes")}
                value={f.compact(r.actual.likes)}
                icon={Heart}
                {...delta(r.actual.likes, r.anterior.likes)}
              />
              <StatCard
                label={t("kpi.comments")}
                value={f.compact(r.actual.comentarios)}
                icon={MessageCircle}
                {...delta(r.actual.comentarios, r.anterior.comentarios)}
              />
              <StatCard
                label={t("kpi.shares")}
                value={f.compact(r.actual.compartidos)}
                icon={Repeat2}
                {...delta(r.actual.compartidos, r.anterior.compartidos)}
              />
              <StatCard
                label={t("kpi.retention")}
                value={r.retencion === null ? "—" : f.percent(r.retencion, 0)}
                icon={Timer}
                {...(retencionDelta === null
                  ? {}
                  : {
                      delta: retencionDelta,
                      deltaLabel: t("kpi.retentionDelta", {
                        sign: retencionDelta >= 0 ? "+" : "−",
                        value: Math.abs(retencionDelta),
                      }),
                    })}
              />
            </div>

            <div className="grid gap-6 @5xl/analitica:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t("growth.title")}</CardTitle>
                  <CardDescription>
                    {nombreRed
                      ? t("growth.descriptionNetwork", { network: nombreRed })
                      : t("growth.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AnalyticsGrowthChart data={serie} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t("networks.title")}</CardTitle>
                  <CardDescription>
                    {r.publicadasEnPeriodo > 0
                      ? t("networks.newPublications", {
                          count: r.publicadasEnPeriodo,
                          days: periodo,
                        })
                      : t("networks.noNewPublications", { days: periodo })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AnalyticsNetworkBars totales={redes} />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("published.title")}</CardTitle>
                <CardDescription>
                  {t("published.description", { count: filas.length })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AnalyticsPublicationsTable
                  filas={filas}
                  indexadoEn={indexadoEn}
                  onOpen={setAbierta}
                />
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <AnalyticsPublicationSheet
        fila={abierta && (filas.find((f) => f.pub.id === abierta.pub.id) ?? abierta)}
        indexadoEn={indexadoEn}
        onOpenChange={(open) => !open && setAbierta(null)}
      />
    </>
  )
}
