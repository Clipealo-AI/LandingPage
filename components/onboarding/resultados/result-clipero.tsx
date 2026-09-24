"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"
import { LOCALE_TAG } from "@/i18n/routing"
import { cn } from "@/lib/utils"
import { pagoPorVideo, topePorVideo, vistasEjemplo } from "@/lib/campanas"
import { COUNTRY_CODES } from "@/lib/countries"
import { CREADORES, creadorPorId } from "@/lib/creadores"
import {
  dimensionesDe,
  esRender,
  precision,
  completitud,
  cuentasDelPerfil,
  type Cuenta,
  type PasoId,
} from "@/lib/onboarding"
import { PLAN_MINIMO, puedeParticipar } from "@/lib/pricing"
import { SOCIAL_IDS, SOCIAL_NETWORKS, cuentaActiva, type SocialId } from "@/lib/social"
import { AUN_NO_SE, JUEGO_NOMBRE, esId, tieneNombreJuego } from "@/lib/taxonomia"
import { metodosDe } from "@/lib/wallet"
import { useCuentasSociales } from "@/hooks/use-cuentas-sociales"
import { useFormat } from "@/hooks/use-format"
import { usePlan } from "@/hooks/use-plan"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useCountryName } from "@/components/shared/country-flag"
import { CampaignCard, cpmTexto } from "@/components/campanas/campaign-card"
import { PayoutCalculator } from "@/components/campanas/payout-calculator"
import { PorQueLaVes } from "@/components/campanas/por-que-la-ves"
import { AvisoPlan } from "@/components/planes/aviso-plan"
import { useNombrePlan } from "@/components/planes/nombre-plan"
import { useFlujo, type ItemCampana } from "@/components/onboarding/contexto"
import { ListaMisiones, useMisiones } from "@/components/onboarding/misiones"
import { VerTusClips } from "@/components/onboarding/resultados/ver-tus-clips"
import { Permisos } from "@/components/onboarding/permisos"
import { ComoLlegaste } from "@/components/onboarding/resultados/como-llegaste"
import { ProfileCard } from "@/components/onboarding/profile-card"
import {
  RenderLog,
  type LineaRender,
} from "@/components/onboarding/resultados/render-log"

/** Campañas «Para ti» del resultado. */
const PARA_TI = 3

/** Escritorio (64 rem o más): «Dos cosas más» sale abierto. Nunca en el render de servidor. */
function useEscritorio() {
  return React.useSyncExternalStore(
    (avisar) => {
      const mq = window.matchMedia("(min-width: 64rem)")
      mq.addEventListener("change", avisar)
      return () => mq.removeEventListener("change", avisar)
    },
    () => window.matchMedia("(min-width: 64rem)").matches,
    () => false
  )
}

function useNombreIdioma() {
  const locale = useLocale()
  return React.useMemo(() => {
    const nombres = new Intl.DisplayNames([LOCALE_TAG[locale]], { type: "language" })
    return (codigo: string) => nombres.of(codigo) ?? codigo
  }, [locale])
}

/**
 * Render y resultado del clipero (§6.1): el registro que se escribe solo con
 * datos reales, «Tu primer corte está listo.» y, en este orden, «Para ti» (3
 * campañas con su motivo), la acción naranja, cómo se cobra con la regla real
 * (`PayoutCalculator`), la primera misión, la tarjeta sellada, «Dos cosas más» y
 * lo que nos contaste.
 *
 * Al terminar el registro: `terminar()` (completa y celebra una sola vez) y un
 * único anuncio en la región viva.
 */
export function ResultClipero() {
  const ctx = useFlujo()
  const t = useTranslations("onboarding")
  const tt = useTranslations("taxonomy")
  const tc = useTranslations("campaigns.withdrawal.method")
  const f = useFormat()
  const nombrePais = useCountryName()
  const nombreIdioma = useNombreIdioma()
  const { cuenta, recomendacion } = ctx

  const [listo, setListo] = React.useState(ctx.completo)
  const [yaCompletado] = React.useState(cuenta.onboarding.estado === "completado")

  const anunciarFin = () => {
    if (yaCompletado) return
    ctx.anunciar(t("render.ready", { count: recomendacion.encajan }), { espera: 0 })
  }
  // Render ya visto (o aprendida la prisa): se completa y celebra al montar, si no se había hecho
  const alMontar = React.useEffectEvent(() => {
    if (!listo) return
    ctx.terminar()
    anunciarFin()
  })
  React.useEffect(() => {
    alMontar()
  }, [])

  const alTerminar = () => {
    setListo(true)
    ctx.terminar()
    anunciarFin()
  }

  /* Registro: datos reales de lo respondido */
  const verticales = cuenta.clipero.verticales
  const redes = (cuenta.clipero.redes ?? []).filter((r): r is SocialId =>
    esId(SOCIAL_IDS, r)
  )
  const fans = cuenta.clipero.creadoresFan ?? []
  const conCampana = dimensionesDe(fans, CREADORES, (id) =>
    ctx.campanas.some((x) => x.campana.id === id && x.estado === "activa")
  ).conCampana.length
  const pais = cuenta.pais
  const metodos = f.list(metodosDe(pais).map((m) => tc(`${m}.name`)))

  const lineas: LineaRender[] = [
    {
      id: "temas",
      codigo: "T01",
      paso: "nichos",
      texto:
        Array.isArray(verticales) && verticales.length
          ? t("render.log.temas", {
              nichos: f.list(verticales.map((v) => tt(`verticales.${v}`))),
            })
          : t("render.log.temasSinElegir"),
      resultado: t("render.log.listo"),
    },
    {
      id: "campanas",
      codigo: "T02",
      paso: "redes",
      texto: t("render.log.campanas", {
        idiomas: f.list(cuenta.idiomas.map(nombreIdioma), "disjunction"),
        redes: redes.length
          ? f.list(
              redes.map((r) => SOCIAL_NETWORKS[r].name),
              "disjunction"
            )
          : t("render.log.redesTodas"),
      }),
      resultado: t("render.log.campanasResultado", { count: recomendacion.encajan }),
    },
    {
      id: "radar",
      codigo: "T03",
      paso: "fandom",
      texto: fans.length
        ? t("render.log.radar", { n: conCampana })
        : t("render.log.radarVacio"),
      resultado: t("render.log.listo"),
    },
    {
      id: "wallet",
      codigo: "T04",
      paso: "basicos",
      texto:
        pais && pais !== "otro"
          ? t("render.log.wallet", { pais: nombrePais(pais), metodos })
          : t("render.log.walletOtro", { metodos }),
      resultado: t("render.log.listo"),
    },
  ].filter((l) => ctx.pasos.includes(l.paso as PasoId)) as LineaRender[]

  return (
    <div className="flex flex-col gap-12 @5xl/bienvenida:gap-16">
      <header className="w-full max-w-3xl space-y-8 @6xl/bienvenida:max-w-6xl">
        <h1
          id="toma-titulo"
          tabIndex={-1}
          className="scroll-mt-28 text-[clamp(1.75rem,1rem+1.6cqi,2.75rem)] leading-tight font-bold tracking-tight text-balance outline-none @5xl/bienvenida:scroll-mt-10"
        >
          {t("resultado.title")}
        </h1>
        <RenderLog
          lineas={lineas}
          listo={listo}
          onTerminado={alTerminar}
          onEditar={ctx.editar}
          puedeEditar={ctx.puedeEditar}
        />
      </header>

      {listo && <Resultado />}
    </div>
  )
}

function Resultado() {
  const ctx = useFlujo()
  const t = useTranslations("onboarding")
  const tv = useTranslations("taxonomy.verticales")
  const tc = useTranslations("campaigns")
  const { plan } = usePlan()
  const nombrePlan = useNombrePlan()
  const { cuentas: cuentasSociales } = useCuentasSociales()
  const { cuenta, recomendacion } = ctx
  const escritorio = useEscritorio()
  const [abierto, setAbierto] = React.useState<boolean | null>(null)

  const hayEncaje = recomendacion.encajan > 0 && recomendacion.verticales.length > 0
  const adyacentes = !hayEncaje ? recomendacion.adyacentes : null
  const paraTi = (adyacentes ? adyacentes.items : recomendacion.recomendadas).slice(
    0,
    PARA_TI
  )
  const primera = paraTi[0]?.item as ItemCampana | undefined
  const misiones = useMisiones()
  // Conectar una red sí sube el perfil: se cuentan las cuentas vivas, no solo
  // las declaradas, que es lo que hacía mentir a «Sube al conectar tu cuenta»
  const conectadas = cuentasDelPerfil(cuentasSociales.filter(cuentaActiva))
  const pct = completitud(cuenta, conectadas)
  /**
   * Con el plan Prueba no se entra en ninguna campaña
   * (`PLAN_MINIMO.participarCampanas`). La puerta existe y está bien escrita,
   * pero tres pantallas más tarde: aquí se le vendían tres campañas, se le
   * calculaba lo que cobraría y se le mandaba a unirse a una. Se dice ahora.
   */
  const participa = puedeParticipar(plan)

  return (
    <>
      {/* 1. Para ti */}
      <section aria-labelledby="resultado-para-ti" className="space-y-5">
        <div className="space-y-1">
          <h2 id="resultado-para-ti" className="text-xl font-bold">
            {t("resultado.paraTi.title")}
          </h2>
          {adyacentes ? (
            <p className="text-muted-foreground">
              {t("resultado.paraTi.adyacentes", {
                vertical: tv(adyacentes.vertical),
                adyacente: tv(adyacentes.adyacente),
              })}
            </p>
          ) : (
            !hayEncaje && (
              <p className="text-muted-foreground">{t("resultado.paraTi.sinCampanas")}</p>
            )
          )}
        </div>
        {paraTi.length > 0 && (
          <ul className="grid gap-x-5 gap-y-8 @4xl/bienvenida:grid-cols-2 @6xl/bienvenida:grid-cols-3">
            {paraTi.map((r) => {
              const item = r.item as ItemCampana
              return (
                <li key={item.campana.id} className="flex flex-col gap-2">
                  <PorQueLaVes motivos={r.motivos} />
                  <CampaignCard
                    preview
                    campana={item.campana}
                    liquidacion={item.liquidacion}
                    estado={item.estado}
                    clips={item.clips}
                  />
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {!participa && (
        <AvisoPlan
          motivo={tc("participation.errors.planInsuficiente", {
            plan: nombrePlan(PLAN_MINIMO.participarCampanas),
          })}
        />
      )}

      {/* 2. La acción naranja de la vista */}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="brand" size="xl" asChild>
          <Link href={ctx.next ?? { pathname: "/campanas", query: { orden: "para-ti" } }}>
            {ctx.next
              ? t("resultado.acciones.continuar")
              : t("resultado.acciones.campanas")}
          </Link>
        </Button>
        {/* Quien eligió «las dos cosas» venía por sus videos también, y hasta
            aquí solo se le preparaba la mitad de campañas */}
        {cuenta.clipero.objetivo === "ambos" && (
          <Button variant="outline" size="xl" asChild>
            <Link href="/subir">{t("resultado.acciones.subir")}</Link>
          </Button>
        )}
        {/* Con clips hechos, aquí están: la bienvenida no enseñaba ninguno */}
        <VerTusClips />
        <Button variant="outline" size="xl" asChild>
          <Link href="/dashboard">{t("resultado.acciones.panel")}</Link>
        </Button>
      </div>

      <div className="grid gap-10 @4xl/bienvenida:grid-cols-2 @4xl/bienvenida:gap-12">
        {/* 3. Cómo se cobra */}
        {primera && (
          <section aria-labelledby="resultado-cobro" className="space-y-5">
            <h2 id="resultado-cobro" className="text-xl font-bold">
              {t("resultado.cobro.title")}
            </h2>
            <ComoSeCobra item={primera} />
          </section>
        )}

        {/* 4. Primera misión. Quien solo recorta sus videos no tiene ninguna
            de campañas: antes se le enseñaban las tres igual */}
        {misiones.length > 0 && (
          <section aria-labelledby="resultado-mision" className="space-y-5">
            <h2 id="resultado-mision" className="text-xl font-bold">
              {t("resultado.mision.title")}
            </h2>
            <ListaMisiones misiones={misiones} />
          </section>
        )}
      </div>

      <div className="grid gap-10 @4xl/bienvenida:grid-cols-2 @4xl/bienvenida:gap-12 @6xl/bienvenida:grid-cols-[minmax(0,20rem)_minmax(0,1fr)_minmax(0,1fr)]">
        {/* 5. Tarjeta sellada */}
        <section aria-labelledby="resultado-tarjeta" className="space-y-5">
          <h2 id="resultado-tarjeta" className="text-xl font-bold">
            {t("resultado.tarjeta.title")}
          </h2>
          <ProfileCard
            cuenta={cuenta}
            rama="clipero"
            encajan={recomendacion.encajan}
            feed={recomendacion.recomendadas.map((r) => r.item.campana)}
            sellada
            className="max-w-72"
          />
          <p className="text-sm text-pretty text-muted-foreground">
            {t("resultado.tarjeta.precision", { nivel: precision(pct) })}
          </p>
        </section>

        {/* 6. Dos cosas más */}
        <Collapsible
          open={abierto ?? escritorio}
          onOpenChange={setAbierto}
          className="space-y-4"
        >
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="-ml-3 h-auto max-w-full gap-2 px-3 py-1.5 text-left text-xl font-bold whitespace-normal"
            >
              {t("resultado.extra.title")}
              <ChevronDown
                aria-hidden
                className={cn(
                  "size-5! transition-[rotate]",
                  (abierto ?? escritorio) && "rotate-180"
                )}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-6">
            <Permisos
              origen="onboarding"
              className="divide-y"
              items={[
                {
                  finalidad: "informes-sector",
                  label: t("resultado.permisos.informesSector.label"),
                  description: t("resultado.permisos.informesSector.description"),
                  textoId: "onboarding.resultado.permisos.informesSector.label",
                },
                {
                  finalidad: "novedades-correo",
                  label: t("resultado.permisos.novedades.label"),
                  description: t("resultado.permisos.novedades.description"),
                  textoId: "onboarding.resultado.permisos.novedades.label",
                },
              ]}
            />
            <ComoLlegaste
              campo="clipero.comoNosConociste"
              titulo="onboarding.resultado.extra.comoLlegaste"
            />
          </CollapsibleContent>
        </Collapsible>

        {/* 7. Lo que nos contaste */}
        <Resumen />
      </div>
    </>
  )
}

/** «En «{campaña}» pagan…» con la calculadora real sobre la primera recomendada. */
function ComoSeCobra({ item }: { item: ItemCampana }) {
  const t = useTranslations("onboarding.resultado.cobro")
  const f = useFormat()
  const c = item.campana
  const vistas = vistasEjemplo(c)
  const { pago } = pagoPorVideo(c, vistas, item.liquidacion.restante)

  return (
    <div className="space-y-5">
      <p className="text-pretty">
        {t.rich("texto", {
          campana: c.titulo,
          cpm: cpmTexto(f, c.cpm),
          minimo: c.minimoVistas,
          vistas,
          pago: f.money(pago, { decimals: 2 }),
          tope: f.money(topePorVideo(c)),
          pct: f.percent(c.topePorVideoPct),
          b: (chunks) => <strong className="font-semibold">{chunks}</strong>,
        })}
      </p>
      <PayoutCalculator
        reglas={c}
        restante={item.liquidacion.restante}
        vistasIniciales={vistas}
        className="rounded-xl border bg-card p-5"
      />
    </div>
  )
}

/** «¿Cómo llegaste a Clipealo? (opcional)»: texto corto y chips en orden fijo por usuario. */
/** «Lo que nos contaste»: cada toma con su respuesta y «Editar». */
function Resumen() {
  const ctx = useFlujo()
  const t = useTranslations("onboarding")
  const tt = useTranslations("taxonomy")
  const f = useFormat()
  const nombrePais = useCountryName()
  const nombreIdioma = useNombreIdioma()
  const { cuenta } = ctx
  const saltados = cuenta.onboarding.pasosSaltados

  const respuesta = (p: PasoId, c: Cuenta): string | null => {
    const cl = c.clipero
    switch (p) {
      case "cuenta":
        return c.tipo ? t(`cuenta.options.${c.tipo}.title`) : null
      case "objetivo":
        return cl.objetivo ? tt(`objetivosUso.${cl.objetivo}`) : null
      case "nichos": {
        if (cl.verticales === AUN_NO_SE) return tt("aunNoSe")
        const partes = [
          ...(cl.verticales ?? []).map((v) => tt(`verticales.${v}`)),
          ...(cl.juegos ?? []).map((j) =>
            tieneNombreJuego(j) ? JUEGO_NOMBRE[j] : tt(`juegos.${j}`)
          ),
        ]
        return partes.length ? f.list(partes) : null
      }
      case "fandom": {
        const nombres = (cl.creadoresFan ?? []).map((x) =>
          typeof x === "string" ? (creadorPorId(x)?.nombre ?? x) : x.texto
        )
        return nombres.length ? f.list(nombres) : null
      }
      case "redes":
        return cl.redes?.length
          ? f.list(
              cl.redes.map((r) =>
                esId(SOCIAL_IDS, r)
                  ? SOCIAL_NETWORKS[r].name
                  : tt(`redesPublicacion.${r}`)
              )
            )
          : null
      case "basicos": {
        const partes = [
          c.pais && esId(COUNTRY_CODES, c.pais) ? nombrePais(c.pais) : null,
          c.idiomas.length ? f.list(c.idiomas.map(nombreIdioma)) : null,
        ].filter((x): x is string => !!x)
        return partes.length ? partes.join(" · ") : null
      }
      default:
        return null
    }
  }

  return (
    <section aria-labelledby="resultado-resumen" className="space-y-5">
      <h2 id="resultado-resumen" className="text-xl font-bold">
        {t("resultado.resumen.title")}
      </h2>
      <dl className="divide-y rounded-xl border bg-card">
        {ctx.pasos
          .filter((p) => !esRender(p))
          .map((p) => {
            const valor = respuesta(p, cuenta)
            return (
              <div key={p} className="flex items-start gap-3 p-4">
                <div className="min-w-0 flex-1 space-y-0.5">
                  <dt className="text-sm text-muted-foreground">
                    {t(`chrome.pasos.${p}`)}
                  </dt>
                  <dd className={cn("text-pretty", !valor && "text-muted-foreground")}>
                    {valor ??
                      (saltados.includes(p)
                        ? t("resultado.resumen.saltada")
                        : t("resultado.resumen.sinRespuesta"))}
                  </dd>
                </div>
                {ctx.puedeEditar(p) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="shrink-0"
                    onClick={() => ctx.editar(p)}
                  >
                    {t("chrome.actions.edit")}
                    <span className="sr-only">{t(`chrome.pasos.${p}`)}</span>
                  </Button>
                )}
              </div>
            )
          })}
      </dl>
    </section>
  )
}
