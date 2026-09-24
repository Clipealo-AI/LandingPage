"use client"

import * as React from "react"
import { Check, ShieldAlert } from "lucide-react"
import { useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"
import {
  borradorDeSolicitud,
  campanaDeBorrador,
  datosSolicitudDe,
  decisionAntesDe,
  indicePresupuesto,
  MINIMOS_SIMULADOR,
  ofertaEstimada,
  PRESUPUESTOS_SIMULADOR,
  simulacionAgencia,
  vistaRenderAgencia,
  type EstadoSolicitudAgencia,
} from "@/lib/agencia"
import { umbralPublicoValor } from "@/lib/onboarding"
import { SECTOR_REGULADO } from "@/lib/taxonomia"
import { toast } from "@/lib/toast"
import { useCampanas } from "@/hooks/use-campanas"
import { useCuenta } from "@/hooks/use-cuenta"
import { useFormat } from "@/hooks/use-format"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Slider } from "@/components/ui/slider"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { SOCIAL_NETWORKS } from "@/lib/social"
import { useCountryName } from "@/components/shared/country-flag"
import { CampaignCard } from "@/components/campanas/campaign-card"
import { useFlujo } from "@/components/onboarding/contexto"
import { Permisos } from "@/components/onboarding/permisos"
import { ComoLlegaste } from "@/components/onboarding/resultados/como-llegaste"

const CHIPS_REGULADO = ["verificados", "menores", "aviso"] as const

/**
 * Formato `agrupado` de los mensajes (`{n, number, agrupado}`): agrupa siempre
 * los millares, como ya hace `money` en `lib/format.ts`. Sin él, `es-ES` deja
 * las cifras de cuatro dígitos sin punto y en la misma pantalla convivían
 * «1000 vistas» y «10.000 vistas».
 */
const FORMATOS = { number: { agrupado: { useGrouping: "always" } } } as const

/**
 * Render de la agencia (§6.3): «Tu primera campaña, casi lista».
 *
 * Es el único sitio del onboarding donde se toca dinero, así que todas las
 * cifras salen de las funciones reales de pago (`simulacionAgencia` llama a
 * `simularBorrador`, que usa `vistasCompradas` y `videosAlTope`): lo que
 * promete aquí es lo que cobrará un clipero.
 *
 * Llegar aquí completa el onboarding pero NO envía nada: la solicitud es
 * explícita («Enviar solicitud»). Después, la vista pasa a la revisión con el
 * borrador en solo lectura, y el admin la concede o la rechaza con motivo.
 */
export function ResultAgencia() {
  const ctx = useFlujo()
  const t = useTranslations("onboarding.agencia.render")
  const te = useTranslations("onboarding.errors")
  const tt = useTranslations("taxonomy")
  const f = useFormat()
  const nombrePais = useCountryName()
  const { cuenta, marcarSolicitudEnviada, guardarBorrador } = useCuenta()
  const { solicitarAgencia, perfil, datosSolicitud, motivoRechazo } = useCampanas()

  const a = cuenta.agencia
  const sector = a.sector ?? null
  const regulado = sector ? SECTOR_REGULADO[sector] : false

  const [presupuesto, setPresupuesto] = React.useState(
    cuenta.borradorCampana?.presupuesto ?? 500
  )
  const [cpm, setCpm] = React.useState<number | undefined>(cuenta.borradorCampana?.cpm)
  const [minimo, setMinimo] = React.useState<number | undefined>(
    cuenta.borradorCampana?.minimoVistas
  )
  const sim = simulacionAgencia(sector, { presupuesto, cpm, minimoVistas: minimo })

  const solicitud: EstadoSolicitudAgencia = a.solicitudEnviadaEn
    ? perfil === "agencia"
      ? "aprobada"
      : motivoRechazo
        ? "rechazada"
        : "pendiente"
    : "ninguna"
  const vista = vistaRenderAgencia(solicitud)

  // Llegar al render completa el onboarding; la solicitud va aparte y sin celebrar
  const alMontar = React.useEffectEvent(() => ctx.terminar({ celebrar: false }))
  React.useEffect(() => {
    alMontar()
  }, [])

  const enviar = () => {
    const en = marcarSolicitudEnviada(borradorDeSolicitud(a, sim))
    const datos = datosSolicitudDe(cuenta, sim.presupuesto, en)
    if (!datos) {
      toast.error(te("solicitudFallida.title"), {
        description: te("solicitudFallida.description"),
      })
      return
    }
    solicitarAgencia(datos)
    toast.success(t("sent.title"), { description: t("sent.description") })
    ctx.anunciar(t("sent.announce"))
  }

  const guardarSimulacion = (cambio: {
    presupuesto?: number
    cpm?: number
    minimo?: number
  }) => {
    const siguiente = simulacionAgencia(sector, {
      presupuesto: cambio.presupuesto ?? presupuesto,
      cpm: cambio.cpm ?? cpm,
      minimoVistas: cambio.minimo ?? minimo,
    })
    guardarBorrador(borradorDeSolicitud(a, siguiente))
  }

  const cliperos = ofertaEstimada({
    verticales: a.verticalesMaterial,
    sector,
    paises: a.paisesObjetivo ?? [],
    idiomas: a.idiomasObjetivo ?? [],
    redes: a.redesObjetivo ?? [],
  })
  const umbral = umbralPublicoValor(cliperos)
  const nichos = f.list((a.verticalesMaterial ?? []).map((v) => tt(`verticales.${v}`)))
  const paises = f.list((a.paisesObjetivo ?? []).map((p) => nombrePais(p)))
  const redes = f.list((a.redesObjetivo ?? []).map((r) => SOCIAL_NETWORKS[r].name))

  const borrador = borradorDeSolicitud(a, sim)
  const campana = campanaDeBorrador(borrador, {
    titulo: t("resumen.title"),
    marca: a.organizacion ?? cuenta.nombre,
  })

  return (
    <div className="space-y-10 @4xl/bienvenida:space-y-12">
      <header className="space-y-2">
        <h1
          tabIndex={-1}
          className="text-2xl font-bold text-balance @3xl/bienvenida:text-3xl"
        >
          {vista === "borrador" ? t("title") : t(`${vista}.title`)}
        </h1>
        <p className="max-w-2xl text-pretty text-muted-foreground">
          {vista === "borrador" ? t("intro") : t(`${vista}.description`)}
        </p>
        {vista === "rechazada" && (
          <p className="font-medium">
            {motivoRechazo
              ? t("rechazada.motivo", { motivo: tt(`motivosRechazo.${motivoRechazo}`) })
              : t("rechazada.sinMotivo")}
          </p>
        )}
        {vista === "enviada" && a.solicitudEnviadaEn && (
          <p className="text-sm text-muted-foreground">
            {t("enviada.decision", {
              fecha: f.date(decisionAntesDe(a.solicitudEnviadaEn)),
            })}
          </p>
        )}
      </header>

      <div className="grid gap-8 @5xl/bienvenida:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] @5xl/bienvenida:gap-12">
        <div className="space-y-8">
          {/* Simulador: solo mientras la solicitud no está en revisión */}
          {(vista === "borrador" || vista === "rechazada") && (
            <section aria-labelledby="sim-titulo" className="max-w-2xl space-y-5">
              <h2 id="sim-titulo" className="text-lg font-bold">
                {t("simulador.title")}
              </h2>

              <div className="space-y-2">
                <div className="flex items-baseline justify-between gap-3">
                  <label htmlFor="sim-presupuesto" className="text-sm font-semibold">
                    {t("simulador.presupuesto")}
                  </label>
                  <span className="font-bold tabular-nums">
                    {f.money(sim.presupuesto)}
                  </span>
                </div>
                <Slider
                  id="sim-presupuesto"
                  min={0}
                  max={PRESUPUESTOS_SIMULADOR.length - 1}
                  step={1}
                  value={[indicePresupuesto(presupuesto)]}
                  aria-label={t("simulador.presupuesto")}
                  aria-valuetext={f.money(sim.presupuesto)}
                  onValueChange={([i]) => setPresupuesto(PRESUPUESTOS_SIMULADOR[i])}
                  onValueCommit={([i]) =>
                    guardarSimulacion({ presupuesto: PRESUPUESTOS_SIMULADOR[i] })
                  }
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-baseline justify-between gap-3">
                  <label htmlFor="sim-cpm" className="text-sm font-semibold">
                    {t("simulador.cpm")}
                  </label>
                  <span className="font-bold tabular-nums">
                    {f.money(sim.cpm, { decimals: 2 })}
                  </span>
                </div>
                <Slider
                  id="sim-cpm"
                  min={sim.rango.min}
                  max={sim.rango.max}
                  step={0.05}
                  value={[sim.cpm]}
                  aria-label={t("simulador.cpm")}
                  aria-valuetext={f.money(sim.cpm, { decimals: 2 })}
                  onValueChange={([v]) => setCpm(v)}
                  onValueCommit={([v]) => guardarSimulacion({ cpm: v })}
                />
                <p className="text-xs text-muted-foreground">
                  {sim.rango.referencia
                    ? t("simulador.cpmReferencia", {
                        min: f.money(sim.rango.min, { decimals: 2 }),
                        max: f.money(sim.rango.max, { decimals: 2 }),
                      })
                    : t("simulador.cpmSinReferencia")}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold">{t("simulador.minimo")}</p>
                <ToggleGroup
                  type="single"
                  variant="outline"
                  spacing={2}
                  value={String(sim.minimoVistas)}
                  onValueChange={(v) => {
                    if (!v) return
                    setMinimo(Number(v))
                    guardarSimulacion({ minimo: Number(v) })
                  }}
                  className="flex-wrap justify-start"
                >
                  {MINIMOS_SIMULADOR.filter((m) => sim.minimosPermitidos.includes(m)).map(
                    (m) => (
                      <ToggleGroupItem
                        key={m}
                        value={String(m)}
                        data-sound="tap"
                        className="group/minimo data-[state=on]:border-primary data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
                      >
                        <Check
                          aria-hidden
                          className="size-4 text-primary opacity-0 group-data-[state=on]/minimo:opacity-100"
                        />
                        {t("simulador.minimoOpcion", { n: m }, FORMATOS)}
                      </ToggleGroupItem>
                    )
                  )}
                </ToggleGroup>
              </div>

              <p className="rounded-xl bg-secondary p-4 text-pretty text-secondary-foreground">
                {t.rich(
                  "simulador.resumen",
                  {
                    b: (c) => <b className="font-bold">{c}</b>,
                    presupuesto: f.money(sim.presupuesto),
                    cpm: f.money(sim.cpm, { decimals: 2 }),
                    pct: f.percent(sim.topePorVideoPct),
                    vistas: sim.vistas,
                    videos: sim.videos,
                    minimo: sim.minimoVistas,
                  },
                  FORMATOS
                )}
              </p>
            </section>
          )}

          {/* Mercado: cuántos cliperos pueden participar */}
          <section aria-labelledby="mercado-titulo" className="space-y-2">
            <h2 id="mercado-titulo" className="text-lg font-bold">
              {t("mercado.title")}
            </h2>
            <p className="text-pretty">
              {umbral
                ? t("mercado.oferta", { umbral, nichos, paises, redes }, FORMATOS)
                : t("mercado.pocos", { nichos, paises })}
            </p>
            <p className="text-sm text-muted-foreground">
              {sim.rango.referencia && sector
                ? t("mercado.cpm", {
                    sector: tt(`sectores.${sector}`),
                    min: f.money(sim.rango.min, { decimals: 2 }),
                    max: f.money(sim.rango.max, { decimals: 2 }),
                  })
                : sector
                  ? t("mercado.sinCpm", { sector: tt(`sectores.${sector}`) })
                  : null}
            </p>
          </section>

          {/* Sector regulado: qué implica */}
          {regulado && sector && (
            <section aria-labelledby="regulado-titulo" className="space-y-3">
              <h2
                id="regulado-titulo"
                className="flex items-center gap-2 text-lg font-bold"
              >
                <ShieldAlert className="size-5 text-warning" aria-hidden />
                {t("regulado.title")}
              </h2>
              <div className="flex flex-wrap gap-2">
                {CHIPS_REGULADO.map((c) => (
                  <Badge key={c} variant="warning">
                    {t(`regulado.chips.${c}`)}
                  </Badge>
                ))}
              </div>
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="link" size="sm" className="h-auto p-0">
                    {t("regulado.queImplica")}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2 text-sm text-pretty text-muted-foreground">
                  {t("regulado.explicacion", { sector: tt(`sectores.${sector}`) })}
                </CollapsibleContent>
              </Collapsible>
            </section>
          )}

          {/* Permisos y «cómo llegaste»: solo antes de enviar */}
          {(vista === "borrador" || vista === "rechazada") && (
            <section aria-labelledby="extra-titulo" className="max-w-2xl space-y-4">
              <h2 id="extra-titulo" className="text-lg font-bold">
                {t("extra.title")}
              </h2>
              <Permisos
                origen="onboarding"
                className="divide-y"
                items={[
                  {
                    finalidad: "contacto-comercial",
                    label: t("extra.permisos.contacto.label"),
                    description: t("extra.permisos.contacto.description"),
                    textoId: "onboarding.agencia.render.extra.permisos.contacto.label",
                  },
                  {
                    finalidad: "novedades-marcas",
                    label: t("extra.permisos.novedades.label"),
                    description: t("extra.permisos.novedades.description"),
                    textoId: "onboarding.agencia.render.extra.permisos.novedades.label",
                  },
                ]}
              />
              <ComoLlegaste
                campo="agencia.comoNosConociste"
                titulo="onboarding.agencia.render.extra.comoLlegaste"
              />
            </section>
          )}

          {/* Acciones */}
          <div className="space-y-3">
            {vista === "borrador" || vista === "rechazada" ? (
              <>
                <Button variant="brand" size="xl" onClick={enviar}>
                  {vista === "rechazada" ? t("rechazada.submit") : t("submit")}
                </Button>
                <p className="text-sm text-muted-foreground">{t("note")}</p>
              </>
            ) : vista === "aprobada" ? (
              <Button variant="brand" size="xl" asChild>
                <Link href="/campanas/nueva">{t("aprobada.crear")}</Link>
              </Button>
            ) : (
              <Button variant="brand" size="xl" asChild>
                <Link href="/campanas">{t("explore")}</Link>
              </Button>
            )}
            <Button variant="ghost" size="lg" asChild className="ml-2">
              <Link href="/dashboard">{t("panel")}</Link>
            </Button>
          </div>
        </div>

        {/* Vista previa del borrador: lo que verá un clipero en Explorar */}
        <aside className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">
            {t("vistaPrevia")}
          </h2>
          <CampaignCard
            campana={campana}
            liquidacion={{ consumidoPct: 0 }}
            estado="activa"
            clips={0}
            preview
          />
          {datosSolicitud && (
            <p className="text-xs text-muted-foreground">
              {datosSolicitud.dominioCoincide ? t("resumen.coincide") : null}
            </p>
          )}
        </aside>
      </div>
    </div>
  )
}
