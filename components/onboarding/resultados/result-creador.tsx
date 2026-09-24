"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"
import { LOCALE_TAG } from "@/i18n/routing"
import { cn } from "@/lib/utils"
import { PLATAFORMA_LABEL, validarCanal } from "@/lib/ajustes"
import { COUNTRY_CODES } from "@/lib/countries"
import {
  HORAS_DIRECTO_POR_DEFECTO,
  LIMITES_ONBOARDING,
  completitud,
  cuentasDelPerfil,
  esRender,
  minutosPrevistos,
  type Cuenta,
  type PasoId,
  type RespuestasAgencia,
} from "@/lib/onboarding"
import { planParaMinutos, type PlanCatalogo } from "@/lib/planes"
import { SOCIAL_IDS, SOCIAL_NETWORKS, cuentaActiva, type SocialId } from "@/lib/social"
import { NO_TRANSMITO, esId } from "@/lib/taxonomia"
import { useCampanas } from "@/hooks/use-campanas"
import { useCuentasSociales } from "@/hooks/use-cuentas-sociales"
import { useCatalogoPlanes } from "@/hooks/use-catalogo-planes"
import { leerCuenta } from "@/hooks/use-cuenta"
import { useFormat } from "@/hooks/use-format"
import { Button } from "@/components/ui/button"
import { useCountryName } from "@/components/shared/country-flag"
import { useFlujo } from "@/components/onboarding/contexto"
import { Permisos } from "@/components/onboarding/permisos"
import { ProfileCard } from "@/components/onboarding/profile-card"
import { VerTusClips } from "@/components/onboarding/resultados/ver-tus-clips"
import {
  RenderLog,
  type LineaRender,
} from "@/components/onboarding/resultados/render-log"
import { plataformasReales } from "@/components/onboarding/tomas/directo"

/**
 * Nombre del plan en esta zona: el escrito, si es uno creado en el backoffice;
 * si no, el del escalón en `onboarding.creador.resultado.prevision.planes`, que
 * es la copia que vive aquí porque el espacio `pricing` no viaja al onboarding.
 */
const nombreEnOnboarding = (
  plan: PlanCatalogo,
  tc: (clave: `planes.${PlanCatalogo["base"]}`) => string
) => plan.nombre ?? tc(`planes.${plan.base}`)

/** Minutos que subiría al mes con lo que respondió (0 si no transmite o sin frecuencia). */
export function minutosDelCreador(c: Pick<Cuenta, "creador">): number {
  const cr = c.creador
  return plataformasReales(cr.plataformasDirecto).length && cr.frecuencia
    ? minutosPrevistos(cr.frecuencia, cr.duracion)
    : 0
}

/** Respuestas de agencia que se pueden adelantar desde la rama «mis videos». */
export type PrecargaAgencia = Partial<
  Pick<
    RespuestasAgencia,
    "tipoOrganizacion" | "organizacion" | "canal" | "verticalesMaterial"
  >
>

/**
 * «Pide el perfil de agencia» (§6.2): la rama agencia se abre con el tipo
 * «Soy streamer o creador», el nombre, el canal y los temas ya puestos. Solo
 * adelanta lo que la agencia aún no tiene: nunca pisa una respuesta suya.
 */
export function precargaAgenciaDesdeCreador(
  c: Pick<Cuenta, "nombre" | "creador" | "agencia">
): PrecargaAgencia {
  const a = c.agencia
  const cr = c.creador
  const precarga: PrecargaAgencia = {}
  if (!a.tipoOrganizacion) precarga.tipoOrganizacion = "streamer-creador"
  if (!a.organizacion?.trim() && c.nombre.trim().length >= LIMITES_ONBOARDING.orgMin)
    precarga.organizacion = c.nombre.trim().slice(0, LIMITES_ONBOARDING.orgMax)
  if (!a.canal && cr.enlaceCanal)
    precarga.canal = {
      plataforma: cr.enlaceCanal.plataforma,
      handle: cr.enlaceCanal.handle,
    }
  if (!a.verticalesMaterial?.length && cr.verticalesCanal?.length)
    precarga.verticalesMaterial = cr.verticalesCanal.slice(
      0,
      LIMITES_ONBOARDING.verticalesMaterial
    )
  return precarga
}

function useNombreIdioma() {
  const locale = useLocale()
  return React.useMemo(() => {
    const nombres = new Intl.DisplayNames([LOCALE_TAG[locale]], { type: "language" })
    return (codigo: string) => nombres.of(codigo) ?? codigo
  }, [locale])
}

const redesDe = (c: Pick<Cuenta, "clipero">): SocialId[] =>
  (c.clipero.redes ?? []).filter((r): r is SocialId => esId(SOCIAL_IDS, r))

/**
 * Render y resultado del creador · mis videos (§6.2, §5.6): el registro que se
 * escribe solo con lo que dejamos listo (importación, ritmo, plantillas y
 * formatos), «Tu primer corte está listo.» y, en este orden:
 *
 * 1. La acción naranja «Subir mi primer video» (a `/subir`, donde la fuente, el
 *    formato y el idioma ya vienen elegidos desde la cuenta) e «Ir al panel».
 * 2. La previsión honesta de minutos (`minutosPrevistos`) y el plan que la
 *    cubre, con el enlace a Precios sin insistir.
 * 3. Si respondió «Sí, cuéntame»: «Pide el perfil de agencia», que abre la rama
 *    agencia con nombre, canal y temas puestos.
 * 4. La tarjeta sellada, los permisos opcionales y lo que nos contaste.
 *
 * Al terminar el registro: `terminar()` (completa y celebra una sola vez) y un
 * único anuncio en la región viva.
 */
export function ResultCreador() {
  const ctx = useFlujo()
  const t = useTranslations("onboarding")
  const tc = useTranslations("onboarding.creador")
  const tt = useTranslations("taxonomy")
  const f = useFormat()
  const { cuenta } = ctx
  const cr = cuenta.creador

  const [listo, setListo] = React.useState(ctx.completo)
  const [yaCompletado] = React.useState(cuenta.onboarding.estado === "completado")

  const anunciarFin = () => {
    if (yaCompletado) return
    ctx.anunciar(t("resultado.creador.ready"), { espera: 0 })
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

  /* Registro: lo que dejamos listo con sus respuestas reales */
  const plataformas = plataformasReales(cr.plataformasDirecto)
  const temas = cr.verticalesCanal ?? []
  const handle = cr.enlaceCanal?.handle
  const redes = redesDe(cuenta)
  const formatos = [...new Set(redes.map((r) => SOCIAL_NETWORKS[r].aspects[0]))]
  const listoTexto = t("render.log.listo")

  type Linea = { id: string; paso: PasoId; texto: string }
  const candidatas: (Linea | null)[] = [
    {
      id: "importacion",
      paso: "directo",
      texto: plataformas.length
        ? tc("render.log.importacion", {
            plataformas: f.list(plataformas.map((p) => PLATAFORMA_LABEL[p])),
          })
        : tc("render.log.subida"),
    },
    plataformas.length && cr.frecuencia
      ? {
          id: "ritmo",
          paso: "directo",
          texto: tc("render.log.ritmo", { min: minutosDelCreador(cuenta) }),
        }
      : null,
    temas.length
      ? {
          id: "plantillas",
          paso: "canal",
          texto:
            handle && !validarCanal(handle)
              ? tc("render.log.plantillasMarca", {
                  temas: f.list(temas.map((v) => tt(`verticales.${v}`))),
                  handle,
                })
              : tc("render.log.plantillas", {
                  temas: f.list(temas.map((v) => tt(`verticales.${v}`))),
                }),
        }
      : null,
    redes.length
      ? {
          id: "formatos",
          paso: "redes",
          texto: tc("render.log.formatos", {
            redes: f.list(redes.map((r) => SOCIAL_NETWORKS[r].name)),
            formatos: f.list(formatos),
          }),
        }
      : null,
  ]
  const lineas = candidatas
    .filter((l): l is Linea => l !== null && ctx.pasos.includes(l.paso))
    .map((l, i): LineaRender => ({
      ...l,
      codigo: `T${String(i + 1).padStart(2, "0")}`,
      resultado: listoTexto,
    }))

  return (
    <div className="flex flex-col gap-12 @5xl/bienvenida:gap-16">
      <header className="w-full max-w-3xl space-y-8">
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
  const tc = useTranslations("onboarding.creador.resultado")
  const f = useFormat()
  const { cuentas: cuentasSociales } = useCuentasSociales()
  const { cuenta } = ctx
  const cr = cuenta.creador
  const plataformas = plataformasReales(cr.plataformasDirecto)
  const fuente = cr.enlaceCanal?.plataforma ?? plataformas[0] ?? null
  // Las cuentas vivas cuentan también aquí: si no, esta tarjeta enseñaba un
  // porcentaje distinto del de la rama campañas para la misma cuenta
  const pct = completitud(cuenta, cuentasDelPerfil(cuentasSociales.filter(cuentaActiva)))

  return (
    <>
      {/* 1. La acción naranja de la vista */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="brand" size="xl" asChild>
            <Link href={ctx.next ?? "/subir"}>
              {ctx.next
                ? t("resultado.acciones.continuar")
                : t("resultado.acciones.subir")}
            </Link>
          </Button>
          {/* Con clips hechos, aquí están: la bienvenida no enseñaba ninguno */}
          <VerTusClips />
          <Button variant="outline" size="xl" asChild>
            <Link href="/dashboard">{t("resultado.acciones.panel")}</Link>
          </Button>
        </div>
        <p
          data-fuente={fuente ?? undefined}
          className="text-pretty text-muted-foreground"
        >
          {fuente
            ? tc("fuente", { plataforma: PLATAFORMA_LABEL[fuente] })
            : tc("fuenteSinDirectos")}
        </p>
      </section>

      <div className="grid gap-10 @4xl/bienvenida:grid-cols-2 @4xl/bienvenida:gap-12">
        {/* 2. Previsión honesta */}
        <Prevision />

        {/* 3. Pide el perfil de agencia (solo con «Sí, cuéntame») */}
        {cr.interesCampanaPropia === "si" && <PideAgencia />}
      </div>

      <div className="grid gap-10 @4xl/bienvenida:grid-cols-2 @4xl/bienvenida:gap-12 @6xl/bienvenida:grid-cols-[minmax(0,20rem)_minmax(0,1fr)_minmax(0,1fr)]">
        {/* 4. Tarjeta sellada */}
        <section aria-labelledby="resultado-tarjeta" className="space-y-5">
          <h2 id="resultado-tarjeta" className="text-xl font-bold">
            {tc("tarjeta.title")}
          </h2>
          <ProfileCard cuenta={cuenta} rama="creador" sellada className="max-w-72" />
          <p className="text-sm text-pretty text-muted-foreground">
            {tc("tarjeta.completitud", { pct: f.percent(pct) })}
          </p>
        </section>

        {/* 5. Permisos opcionales */}
        <section aria-labelledby="resultado-extra" className="space-y-2">
          <h2 id="resultado-extra" className="text-xl font-bold">
            {t("resultado.extra.title")}
          </h2>
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
        </section>

        {/* 6. Lo que nos contaste */}
        <Resumen />
      </div>
    </>
  )
}

/** «Con {frecuencia}, de {duracion} cada uno, subirías unos {min} minutos al mes. El plan {plan} incluye…» */
function Prevision() {
  const ctx = useFlujo()
  const tc = useTranslations("onboarding.creador.resultado.prevision")
  const cr = ctx.cuenta.creador
  const minutos = minutosDelCreador(ctx.cuenta)
  // El plan que cubre los minutos sale del catálogo (`lib/planes.ts`): uno creado
  // en el backoffice y visible cuenta igual que los tres de la web
  const { plan, cubre } = planParaMinutos(minutos, useCatalogoPlanes())
  const incluidos = plan.minutos

  const ritmo =
    minutos > 0 && cr.frecuencia
      ? tc("directos", {
          frecuencia: tc(`frecuencia.${cr.frecuencia}`),
          duracion: cr.duracion
            ? tc(`duracion.${cr.duracion}`)
            : tc("duracionPorDefecto", { horas: HORAS_DIRECTO_POR_DEFECTO }),
          min: minutos,
        })
      : tc("sinDirectos")
  const cobertura = tc(cubre ? "plan" : "planAmpliable", {
    plan: nombreEnOnboarding(plan, tc),
    incluidos,
  })

  return (
    <section aria-labelledby="resultado-prevision" className="space-y-4">
      <h2 id="resultado-prevision" className="text-xl font-bold">
        {tc("title")}
      </h2>
      <p data-minutos={minutos} data-plan={plan} className="text-pretty">
        {ritmo} {cobertura}
      </p>
      <Button variant="link" className="h-auto p-0" asChild>
        <Link href="/precios">{tc("precios")}</Link>
      </Button>
    </section>
  )
}

/**
 * Tarjeta «Pide el perfil de agencia»: al pulsar, adelanta en la cuenta las
 * respuestas de la agencia (como `inferido`) y abre `/bienvenida?tipo=agencia`.
 * No sale si ya es agencia o tiene una solicitud en marcha.
 */
function PideAgencia() {
  const ctx = useFlujo()
  const tc = useTranslations("onboarding.creador.resultado.agencia")
  const { perfil, solicitudAgencia } = useCampanas()
  const { responder } = ctx
  if (perfil === "agencia" || solicitudAgencia === "pendiente") return null

  const preparar = () => {
    const p = precargaAgenciaDesdeCreador(leerCuenta())
    if (p.tipoOrganizacion)
      responder("agencia.tipoOrganizacion", p.tipoOrganizacion, "inferido")
    if (p.organizacion) responder("agencia.organizacion", p.organizacion, "inferido")
    if (p.canal) responder("agencia.canal", p.canal, "inferido")
    if (p.verticalesMaterial)
      responder("agencia.verticalesMaterial", p.verticalesMaterial, "inferido")
  }

  return (
    <section
      aria-labelledby="resultado-agencia"
      data-pide-agencia=""
      className="space-y-4 self-start rounded-2xl border bg-card p-6"
    >
      <h2 id="resultado-agencia" className="text-xl font-bold">
        {tc("title")}
      </h2>
      <p className="text-pretty text-muted-foreground">{tc("description")}</p>
      <Button variant="outline" size="lg" asChild>
        <Link
          href={{ pathname: "/bienvenida", query: { tipo: "agencia", origen: "gate" } }}
          onClick={preparar}
        >
          {tc("action")}
        </Link>
      </Button>
    </section>
  )
}

/** «Lo que nos contaste»: cada toma de la rama con su respuesta y «Editar». */
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
    const cr = c.creador
    switch (p) {
      case "cuenta":
        return c.tipo ? t(`cuenta.options.${c.tipo}.title`) : null
      case "objetivo":
        return c.clipero.objetivo ? tt(`objetivosUso.${c.clipero.objetivo}`) : null
      case "directo": {
        const seleccion = cr.plataformasDirecto ?? []
        const partes = [
          ...plataformasReales(seleccion).map((x) => PLATAFORMA_LABEL[x]),
          ...(seleccion.includes(NO_TRANSMITO)
            ? [tt("plataformasDirecto.no-transmito")]
            : []),
        ]
        if (!partes.length) return null
        return [
          f.list(partes),
          cr.frecuencia ? tt(`frecuenciasDirecto.${cr.frecuencia}`) : null,
          cr.duracion ? tt(`duracionesDirecto.${cr.duracion}`) : null,
        ]
          .filter((x): x is string => !!x)
          .join(" · ")
      }
      case "canal": {
        const partes = [
          cr.verticalesCanal?.length
            ? f.list(cr.verticalesCanal.map((v) => tt(`verticales.${v}`)))
            : null,
          cr.enlaceCanal
            ? `${PLATAFORMA_LABEL[cr.enlaceCanal.plataforma]} @${cr.enlaceCanal.handle}`
            : null,
          cr.interesCampanaPropia
            ? tt(`interesCampanaPropia.${cr.interesCampanaPropia}`)
            : null,
        ].filter((x): x is string => !!x)
        return partes.length ? partes.join(" · ") : null
      }
      case "redes":
        return c.clipero.redes?.length
          ? f.list(
              c.clipero.redes.map((r) =>
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
                  <dd
                    className={cn(
                      "text-pretty break-words",
                      !valor && "text-muted-foreground"
                    )}
                  >
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
