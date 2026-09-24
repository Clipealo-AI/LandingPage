"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { createParser, parseAsString, parseAsStringLiteral, useQueryState } from "nuqs"
import { Megaphone, Plus, RefreshCw, Search, Star } from "lucide-react"

import { Link } from "@/i18n/navigation"
import { LOCALE_TAG } from "@/i18n/routing"
import { cn } from "@/lib/utils"
import { toast } from "@/lib/toast"
import {
  CATEGORIAS,
  CATEGORIA_ANTERIOR,
  ORDENES,
  categoriaDesde,
  coincideBusqueda,
  estadoVisible,
  liquidar,
  ordenar,
  puedeCrearCampanas,
  type Campana,
  type EstadoVisto,
} from "@/lib/campanas"
import {
  puntosPorCampana,
  recomendarCampanas,
  type MotivoRecomendacion,
} from "@/lib/recomendacion"
import { redesDe } from "@/lib/planes"
import { SOCIAL_NETWORKS, type SocialId } from "@/lib/social"
import { useCampanas } from "@/hooks/use-campanas"
import { useCuenta } from "@/hooks/use-cuenta"
import { usePlan } from "@/hooks/use-plan"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MisCompromisos } from "@/components/campanas/mis-compromisos"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { SocialGlyph } from "@/components/brand/social"
import { AvisoPlan } from "@/components/planes/aviso-plan"
import { useNombrePlan } from "@/components/planes/nombre-plan"
import { PageHeader } from "@/components/shared/page-header"
import { AccessCodeDialog } from "@/components/campanas/access-code-dialog"
import { ICONO_CATEGORIA } from "@/components/campanas/campaign-bits"
import { CampaignCard } from "@/components/campanas/campaign-card"
import { MyCampaigns } from "@/components/campanas/my-campaigns"
import { MySubmissions } from "@/components/campanas/my-submissions"
import { PorQueLaVes } from "@/components/campanas/por-que-la-ves"
import { SubmitClipDialog } from "@/components/campanas/submit-clip-dialog"

const VISTAS = ["explorar", "participando", "mis-campanas"] as const
const FILTRO_CATEGORIA = ["todas", ...CATEGORIAS] as const
type FiltroCategoria = (typeof FILTRO_CATEGORIA)[number]
const FILTRO_ESTADO = ["cualquiera", "activa", "agotada", "finalizada"] as const

/**
 * `?categoria=` conserva los valores de siempre («Todas», «Música»): los enlaces
 * guardados siguen valiendo. Dentro, la categoría es su id.
 */
const parseAsCategoria = createParser<FiltroCategoria>({
  parse: (v) => (v === "Todas" ? "todas" : categoriaDesde(v)),
  serialize: (c) => (c === "todas" ? "Todas" : CATEGORIA_ANTERIOR[c]),
})

export interface CampanaVista {
  campana: Campana
  liquidacion: ReturnType<typeof liquidar>
  estado: EstadoVisto
  clips: number
}

/**
 * Campañas: explorar las públicas (y las privadas que se hayan desbloqueado con
 * su código), seguir los clips enviados y gestionar las propias.
 *
 * Explorar sigue la estructura de la app de referencia: categorías con su
 * contador, una fila de filtros y dos secciones, destacadas e individuales.
 */
export function CampaignsExplorer() {
  const t = useTranslations("campaigns.explorer")
  const tc = useTranslations("campaigns.category")
  const tEstado = useTranslations("campaigns.status")
  const tOrden = useTranslations("campaigns.sort")
  const locale = useLocale()
  const cuando = React.useMemo(
    () =>
      new Intl.DateTimeFormat(LOCALE_TAG[locale], { hour: "2-digit", minute: "2-digit" }),
    [locale]
  )
  const { campanas, envios, perfil, desbloqueadas } = useCampanas()
  const { cuenta } = useCuenta()
  const { plan } = usePlan()
  const nombrePlan = useNombrePlan()
  const [vista, setVista] = useQueryState(
    "vista",
    parseAsStringLiteral(VISTAS).withDefault("explorar")
  )
  const [categoria, setCategoria] = useQueryState(
    "categoria",
    parseAsCategoria.withDefault("todas")
  )
  const [q, setQ] = useQueryState("q", parseAsString.withDefault(""))
  const [red, setRed] = useQueryState("red", parseAsString.withDefault("todas"))
  const [estado, setEstado] = useQueryState(
    "estado",
    parseAsStringLiteral(FILTRO_ESTADO).withDefault("cualquiera")
  )
  const [orden, setOrden] = useQueryState(
    "orden",
    parseAsStringLiteral(ORDENES).withDefault("presupuesto")
  )

  const [subirA, setSubirA] = React.useState<Campana | null>(null)
  const [actualizado, setActualizado] = React.useState<Date | null>(null)
  const [refrescando, setRefrescando] = React.useState(false)

  const vistasCampana = React.useMemo<CampanaVista[]>(
    () =>
      campanas.map((campana) => {
        const liquidacion = liquidar(campana, envios)
        return {
          campana,
          liquidacion,
          estado: estadoVisible(campana, liquidacion),
          clips: envios.filter(
            (e) => e.campanaId === campana.id && e.estado !== "rechazado"
          ).length,
        }
      }),
    [campanas, envios]
  )

  // Explorar: las públicas y las privadas que se hayan desbloqueado con su código
  const publicas = vistasCampana.filter(
    (v) => !v.campana.privada || desbloqueadas.includes(v.campana.id)
  )
  /**
   * Y de esas, las que el plan puede atender: una campaña que solo paga por
   * Instagram no le sirve a quien únicamente puede conectar TikTok, y
   * enseñársela es hacerle perder el rato hasta el último paso. Lo que queda
   * fuera se dice con su número, nunca se recorta en silencio.
   */
  const redesPlan = redesDe(plan)
  const visibles = publicas.filter((v) =>
    v.campana.redes.some((r) => redesPlan.includes(r))
  )
  const fueraDelPlan = publicas.length - visibles.length
  // «Mis campañas» es de las agencias: un usuario que llegue con el enlace ve Explorar
  const creaCampanas = puedeCrearCampanas(perfil)
  const vistaActiva = vista === "mis-campanas" && !creaCampanas ? "explorar" : vista
  // «Para ti» (§6.4): lo que respondió en el onboarding ordena y explica cada campaña
  const paraTi = orden === "para-ti"
  const recomendacion = paraTi
    ? recomendarCampanas(visibles, cuenta, { desbloqueadas })
    : null
  const motivos = new Map<string, MotivoRecomendacion[]>(
    recomendacion?.recomendadas.map((r) => [r.item.campana.id, r.motivos]) ?? []
  )
  const filtradas = ordenar(
    visibles.filter(
      (v) =>
        (red === "todas" || v.campana.redes.includes(red as SocialId)) &&
        (estado === "cualquiera" || v.estado === estado) &&
        coincideBusqueda(v.campana, q)
    ),
    orden,
    recomendacion ? puntosPorCampana(recomendacion) : undefined
  )
  const enCategoria = filtradas.filter(
    (v) => categoria === "todas" || v.campana.categoria === categoria
  )
  const contador = (c: FiltroCategoria) =>
    c === "todas"
      ? filtradas.length
      : filtradas.filter((v) => v.campana.categoria === c).length
  const destacadas = enCategoria.filter((v) => v.campana.destacada)
  const privadas = enCategoria.filter((v) => v.campana.privada && !v.campana.destacada)
  const individuales = enCategoria.filter(
    (v) => !v.campana.destacada && !v.campana.privada
  )
  const hayFiltros =
    q !== "" ||
    red !== "todas" ||
    estado !== "cualquiera" ||
    orden !== "presupuesto" ||
    categoria !== "todas"

  const limpiar = () => {
    void setQ(null)
    void setRed(null)
    void setEstado(null)
    void setOrden(null)
    void setCategoria(null)
  }

  /**
   * Volver a mirar. Hoy las campañas viven en el navegador, así que mirar otra
   * vez no puede traer nada: el aviso lo dice y no suena, porque no ha habido
   * ningún éxito que celebrar. Cuando haya costura, aquí va su llamada y el
   * texto vuelve a hablar de presupuestos y clips.
   */
  const refrescar = async () => {
    setRefrescando(true)
    await new Promise((listo) => setTimeout(listo, 900))
    setRefrescando(false)
    setActualizado(new Date())
    toast(t("refreshed"), { description: t("refreshedDescription") })
  }

  const rejilla = (items: CampanaVista[]) => (
    <div className="grid gap-x-5 gap-y-8 @2xl/campanas:grid-cols-2 @5xl/campanas:grid-cols-3 @[100rem]/campanas:grid-cols-4">
      {items.map((v) => {
        const tarjeta = (
          <CampaignCard
            campana={v.campana}
            liquidacion={v.liquidacion}
            estado={v.estado}
            clips={v.clips}
            onSubir={() => setSubirA(v.campana)}
          />
        )
        const suyos = motivos.get(v.campana.id)
        return suyos?.length ? (
          <div key={v.campana.id} className="flex flex-col gap-2">
            <PorQueLaVes motivos={suyos} />
            {tarjeta}
          </div>
        ) : (
          <React.Fragment key={v.campana.id}>{tarjeta}</React.Fragment>
        )
      })}
    </div>
  )

  return (
    <>
      <PageHeader
        title={t("title")}
        // A quien crea campañas no se le promete que cobra por 1.000 vistas:
        // las paga
        description={t(creaCampanas ? "descriptionAgencia" : "description")}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="lg" onClick={refrescar} disabled={refrescando}>
              <RefreshCw className={cn(refrescando && "animate-spin")} /> {t("refresh")}
            </Button>
            <AccessCodeDialog />
            {creaCampanas ? (
              <Button variant="brand" size="lg" asChild>
                <Link href="/campanas/nueva">
                  <Plus /> {t("create")}
                </Link>
              </Button>
            ) : (
              <Button variant="ghost" size="lg" asChild>
                <Link href="/campanas/nueva">{t("areYouAgency")}</Link>
              </Button>
            )}
          </div>
        }
      />

      <Tabs
        value={vistaActiva}
        onValueChange={(v) => void setVista(v as (typeof VISTAS)[number])}
        className="gap-6"
      >
        <div className="-mx-(--gutter-app) overflow-x-auto px-(--gutter-app) sm:mx-0 sm:px-0">
          <TabsList className="w-max p-1 group-data-horizontal/tabs:h-10">
            <TabsTrigger value="explorar" className="px-3.5">
              {t("tabs.explore")}
            </TabsTrigger>
            <TabsTrigger value="participando" className="px-3.5">
              {t("tabs.participating")}
            </TabsTrigger>
            {creaCampanas && (
              <TabsTrigger value="mis-campanas" className="px-3.5">
                {t("tabs.mine")}
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        <TabsContent value="explorar" className="space-y-8">
          {/* Categorías con su contador: el primer filtro, a todo el ancho */}
          <ToggleGroup
            type="single"
            variant="outline"
            spacing={3}
            value={categoria}
            onValueChange={(v) => v && void setCategoria(v as FiltroCategoria)}
            aria-label={t("categoryLabel")}
            className="grid w-full grid-cols-2 @2xl/campanas:grid-cols-3 @5xl/campanas:grid-cols-5"
          >
            {FILTRO_CATEGORIA.map((c) => {
              const Icono = ICONO_CATEGORIA[c]
              return (
                <ToggleGroupItem
                  key={c}
                  value={c}
                  data-sound="none"
                  className="h-auto justify-start gap-3 rounded-xl px-4 py-3 text-left data-[state=on]:border-primary data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
                >
                  <span className="hidden size-9 shrink-0 place-items-center rounded-lg bg-secondary text-secondary-foreground @md/campanas:grid">
                    <Icono className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">
                      {c === "todas" ? t("allCategories") : tc(c)}
                    </span>
                    <span className="block text-xs font-normal text-muted-foreground tabular-nums">
                      {t("count", { n: contador(c) })}
                    </span>
                  </span>
                </ToggleGroupItem>
              )
            })}
          </ToggleGroup>

          {/* Filtros: una fila, encima de lo que afectan */}
          <div className="flex flex-wrap items-center gap-3">
            <InputGroup className="h-10 w-full @3xl/campanas:max-w-md">
              <InputGroupAddon>
                <Search aria-hidden />
              </InputGroupAddon>
              <InputGroupInput
                value={q}
                onChange={(e) => void setQ(e.target.value || null)}
                placeholder={t("searchPlaceholder")}
                aria-label={t("searchLabel")}
              />
            </InputGroup>
            <Select
              value={red}
              onValueChange={(v) => void setRed(v === "todas" ? null : v)}
            >
              <SelectTrigger className="h-10 w-44" aria-label={t("networkLabel")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">{t("allNetworks")}</SelectItem>
                {/* Solo las del plan: filtrar por una red donde no se puede
                    cobrar devolvía siempre cero y parecía un fallo */}
                {redesPlan.map((r) => (
                  <SelectItem key={r} value={r}>
                    <SocialGlyph
                      network={r}
                      tone="official"
                      className="size-4"
                      aria-hidden
                    />
                    {SOCIAL_NETWORKS[r].name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={estado}
              onValueChange={(v) =>
                void setEstado(
                  v === "cualquiera" ? null : (v as (typeof FILTRO_ESTADO)[number])
                )
              }
            >
              <SelectTrigger className="h-10 w-44" aria-label={t("statusLabel")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cualquiera">{t("anyStatus")}</SelectItem>
                {FILTRO_ESTADO.slice(1).map((e) => (
                  <SelectItem key={e} value={e}>
                    {tEstado(e as EstadoVisto)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={orden}
              onValueChange={(v) =>
                void setOrden(
                  v === "presupuesto" ? null : (v as (typeof ORDENES)[number])
                )
              }
            >
              <SelectTrigger className="h-10 w-60" aria-label={t("sortLabel")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORDENES.map((o) => (
                  <SelectItem key={o} value={o}>
                    {tOrden(o)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" onClick={limpiar} disabled={!hayFiltros}>
              {t("clear")}
            </Button>
            {actualizado && (
              <span className="ml-auto text-xs text-muted-foreground" aria-live="polite">
                {t("updatedAt", { time: cuando.format(actualizado) })}
              </span>
            )}
          </div>

          {/* Lo que el plan deja fuera, antes de la rejilla: una lista más
              corta sin decir por qué se lee como que no hay campañas */}
          {fueraDelPlan > 0 && (
            <AvisoPlan
              motivo={t("fueraDelPlan", {
                plan: nombrePlan(plan),
                red: SOCIAL_NETWORKS[redesPlan[0]].name,
                n: fueraDelPlan,
              })}
            />
          )}

          <div
            className={cn(
              "space-y-10 transition-opacity duration-(--duration-base)",
              refrescando && "opacity-60"
            )}
          >
            {enCategoria.length === 0 ? (
              <Empty className="rounded-xl ring-1 ring-border">
                <EmptyHeader>
                  <EmptyTitle>{t("empty.title")}</EmptyTitle>
                  <EmptyDescription>{t("empty.description")}</EmptyDescription>
                </EmptyHeader>
                <Button variant="outline" onClick={limpiar}>
                  {t("empty.clear")}
                </Button>
              </Empty>
            ) : paraTi ? (
              // Un solo listado: separar destacadas y privadas rompería el orden por encaje
              <Seccion titulo={t("sections.forYou")} icono={Star}>
                {rejilla(enCategoria)}
              </Seccion>
            ) : (
              <>
                {destacadas.length > 0 && (
                  <Seccion titulo={t("sections.featured")} icono={Star}>
                    {rejilla(destacadas)}
                  </Seccion>
                )}
                {privadas.length > 0 && (
                  <Seccion titulo={t("sections.unlocked")} icono={Megaphone}>
                    {rejilla(privadas)}
                  </Seccion>
                )}
                {individuales.length > 0 && (
                  <Seccion titulo={t("sections.individual")} icono={Megaphone}>
                    {rejilla(individuales)}
                  </Seccion>
                )}
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="participando" className="space-y-8">
          {/* Primero lo que debe: compromisos con su plazo; debajo, lo ya enviado */}
          <MisCompromisos />
          <MySubmissions vistas={vistasCampana} />
        </TabsContent>

        {creaCampanas && (
          <TabsContent value="mis-campanas">
            <MyCampaigns vistas={vistasCampana} />
          </TabsContent>
        )}
      </Tabs>

      <SubmitClipDialog
        campana={subirA}
        open={subirA !== null}
        onOpenChange={(v) => !v && setSubirA(null)}
      />
    </>
  )
}

function Seccion({
  titulo,
  icono: Icono,
  children,
}: {
  titulo: string
  icono: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <section className="space-y-4" aria-label={titulo}>
      <h2 className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
        <Icono className="size-4" aria-hidden /> {titulo}
      </h2>
      {children}
    </section>
  )
}
