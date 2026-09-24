"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"

import { cn } from "@/lib/utils"
import { LOCALE_TAG } from "@/i18n/routing"
import { COUNTRY_CODES, type CountryCode } from "@/lib/countries"
import type { Campana } from "@/lib/campanas"
import { creadorPorId } from "@/lib/creadores"
import { prefiereMenosMovimiento } from "@/lib/motion"
import {
  esRender,
  minutosPrevistos,
  type Cuenta,
  type RamaPerfil,
  type CreadorPendiente,
} from "@/lib/onboarding"
import { SOCIAL_IDS, SOCIAL_NETWORKS, type SocialId } from "@/lib/social"
import {
  NO_TRANSMITO,
  SECTORES,
  SECTOR_REGULADO,
  cpmMedioReferencia,
  esId,
  type Vertical,
} from "@/lib/taxonomia"
import { inicialesDe } from "@/hooks/use-cuenta"
import { useFormat } from "@/hooks/use-format"
import { CropFrame } from "@/components/brand/logo"
import { SocialGlyph } from "@/components/brand/social"
import { CountryFlag, useCountryName } from "@/components/shared/country-flag"
import { useFlujo } from "@/components/onboarding/contexto"
import { estadoSegmento } from "@/components/onboarding/timeline-tomas"
import {
  AvatarCreador,
  LogoPlataforma,
  claveFan,
  etiquetaFan,
  nombrePlataforma,
  type Fan,
} from "@/components/onboarding/creator-avatar"

/** Avatares del radar que caben; el resto se cuenta («+3»). */
const RADAR_MAX = 5
/** Campañas del mini feed de la tarjeta. */
const FEED_MAX = 3

/** Verticales que pinta la tarjeta según la rama. */
function verticalesDe(cuenta: Cuenta, rama: RamaPerfil): Vertical[] {
  if (rama === "agencia") return cuenta.agencia.verticalesMaterial ?? []
  if (rama === "creador") return cuenta.creador.verticalesCanal ?? []
  return Array.isArray(cuenta.clipero.verticales) ? cuenta.clipero.verticales : []
}

function redesDe(cuenta: Cuenta, rama: RamaPerfil): SocialId[] {
  const redes = rama === "agencia" ? cuenta.agencia.redesObjetivo : cuenta.clipero.redes
  return (redes ?? []).filter((r): r is SocialId => esId(SOCIAL_IDS, r))
}

/**
 * Nombre del idioma en el idioma activo («Español», «Portuguese»), con la
 * inicial en mayúscula: en la tarjeta nunca se pinta el código («ES»), que no
 * deja ver si es el país o el idioma.
 */
function useNombreIdioma() {
  const locale = useLocale()
  return React.useMemo(() => {
    const tag = LOCALE_TAG[locale]
    const nombres = new Intl.DisplayNames([tag], { type: "language" })
    return (codigo: string) => {
      const nombre = nombres.of(codigo) ?? codigo
      return nombre.charAt(0).toLocaleUpperCase(tag) + nombre.slice(1)
    }
  }, [locale])
}

/** Nombre y plataforma de un fan del radar, del catálogo o escrito a mano. */
function datosFan(fan: Fan) {
  if (typeof fan === "string") {
    const c = creadorPorId(fan)
    return {
      nombre: c?.nombre ?? fan,
      plataforma: c?.cuentas[0]?.plataforma,
      tieneCampana: Boolean(c?.campanaId),
    }
  }
  const p = fan as CreadorPendiente
  return {
    nombre: etiquetaFan(fan),
    plataforma: p.plataforma,
    tieneCampana: false,
  }
}

/**
 * Contador que cuenta hasta su valor en 600 ms (§5.11). Con «reducir
 * movimiento» no cuenta: enseña el valor final y el destello lo pone el CSS.
 * El estado solo existe mientras dura la cuenta, así que el valor de verdad
 * nunca depende de un efecto.
 */
function useContador(valor: number) {
  const [animado, setAnimado] = React.useState<number | null>(null)
  const anterior = React.useRef(valor)

  React.useEffect(() => {
    const desde = anterior.current
    anterior.current = valor
    if (
      desde === valor ||
      prefiereMenosMovimiento() ||
      typeof requestAnimationFrame !== "function"
    ) {
      return
    }
    let raf = 0
    const inicio = performance.now()
    const paso = (ahora: number) => {
      const p = Math.min(1, (ahora - inicio) / 600)
      setAnimado(p < 1 ? Math.round(desde + (valor - desde) * p) : null)
      if (p < 1) raf = requestAnimationFrame(paso)
    }
    raf = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(raf)
  }, [valor])

  return animado ?? valor
}

/**
 * Una capa de la tarjeta (§5.6). Entra al montarse, que es justo cuando su
 * respuesta llega: fundido y subida, o solo fundido con «reducir movimiento».
 */
function Capa({
  orden,
  className,
  children,
}: {
  orden: number
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      data-capa=""
      style={{ "--i": orden } as React.CSSProperties}
      className={cn("min-w-0", className)}
    >
      {children}
    </div>
  )
}

/** Rótulo de una capa, en la tinta del monitor. */
function Rotulo({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[0.6875rem] font-semibold tracking-wide text-stage-muted uppercase">
      {children}
    </p>
  )
}

export interface ProfileCardProps {
  cuenta: Cuenta
  rama: RamaPerfil
  /** Campañas que encajan ahora («12 campañas encajan contigo»). */
  encajan?: number
  /** Mini feed: las mejores campañas de ahora mismo (se pintan hasta 3). */
  feed?: readonly Campana[]
  /** Al terminar el render: esquinas de recorte e insignia «Lista». */
  sellada?: boolean
  className?: string
}

/**
 * Tarjeta de perfil 9:16 que se va montando con cada respuesta (§5.6): claqueta,
 * chips de temas, mini feed con las campañas que encajan, radar de creadores,
 * redes y, al final del render, el sello «Lista».
 *
 * Cada capa aparece cuando llega su dato, así que montarla ya es la animación;
 * nada bloquea la interacción y con «reducir movimiento» las capas se funden en
 * su sitio en vez de subir.
 *
 * Superficie siempre oscura (`bg-stage`, regla 1 de AGENTS.md): decorativa y
 * `aria-hidden`, lo útil está en la Mesa y en la región viva.
 */
export function ProfileCard({
  cuenta,
  rama,
  encajan,
  feed,
  sellada = false,
  className,
}: ProfileCardProps) {
  const t = useTranslations("onboarding.chrome.tarjeta")
  const tl = useTranslations("onboarding.chrome.live")
  const tt = useTranslations("taxonomy")
  const f = useFormat()
  const nombrePais = useCountryName()
  const nombreIdioma = useNombreIdioma()

  const verticales = verticalesDe(cuenta, rama)
  const redes = redesDe(cuenta, rama)
  const nombre = (rama === "agencia" && cuenta.agencia.organizacion) || cuenta.nombre
  const pais = cuenta.pais && esId(COUNTRY_CODES, cuenta.pais) ? cuenta.pais : null
  const fans = rama === "clipero" ? (cuenta.clipero.creadoresFan ?? []) : []
  // El mini feed es lo que la persona podría clipear: en la agencia no pinta nada
  const campanas = rama === "agencia" ? [] : (feed ?? []).slice(0, FEED_MAX)
  const minutos =
    rama === "creador"
      ? minutosPrevistos(cuenta.creador.frecuencia, cuenta.creador.duracion)
      : 0
  // «No transmito» no es una plataforma: no pinta logo
  const plataformas =
    rama === "creador"
      ? (cuenta.creador.plataformasDirecto ?? []).filter((p) => p !== NO_TRANSMITO)
      : []
  const encajanVisible = useContador(encajan ?? 0)
  // Capas de la agencia (§5.6): el sector con su marca de revisión y el CPM de
  // referencia, y el alcance (países e idiomas a los que apunta la campaña)
  const sector =
    rama === "agencia" && esId(SECTORES, cuenta.agencia.sector)
      ? cuenta.agencia.sector
      : null
  const cpmSector = sector ? cpmMedioReferencia(sector) : null
  const paisesObjetivo =
    rama === "agencia"
      ? (cuenta.agencia.paisesObjetivo ?? []).filter((p): p is CountryCode =>
          esId(COUNTRY_CODES, p)
        )
      : []
  const idiomasObjetivo = rama === "agencia" ? (cuenta.agencia.idiomasObjetivo ?? []) : []

  // El rótulo de la claqueta: el objetivo elegido o, si aún no lo hay, la rama
  const rotulo =
    rama === "clipero" && cuenta.clipero.objetivo
      ? tt(`objetivosUso.${cuenta.clipero.objetivo}`)
      : rama === "agencia" && cuenta.agencia.tipoOrganizacion
        ? tt(`tiposOrganizacion.${cuenta.agencia.tipoOrganizacion}`)
        : t(`rama.${rama}`)

  return (
    <CropFrame
      size="md"
      active={sellada}
      aria-hidden
      data-tarjeta-perfil=""
      data-sellada={sellada || undefined}
      className={cn(
        "aspect-[9/16] w-full max-w-[min(clamp(20rem,22cqi,34rem),calc(78svh*9/16))]",
        className
      )}
    >
      <div className="flex h-full flex-col gap-5 overflow-hidden rounded-3xl border border-stage-border bg-ink-900 p-6 text-stage-foreground shadow-2xl">
        {/* Claqueta: las barras se cierran una vez, como al empezar una toma.
            La fila va apretada (gap y relleno de la insignia) porque en
            portugués el rótulo es más largo y la insignia le comía el hueco */}
        <Capa orden={0} className="flex items-center gap-2.5">
          <span
            data-claqueta=""
            className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-primary text-base font-bold text-primary-foreground"
          >
            <span data-claqueta-barra="" aria-hidden className="absolute inset-x-0 top-0">
              <span className="flex h-2 w-full">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={cn(
                      "h-full flex-1",
                      i % 2 === 0 ? "bg-ink-900/80" : "bg-ink-50/80"
                    )}
                  />
                ))}
              </span>
            </span>
            {inicialesDe(nombre || "·")}
          </span>
          <div className="min-w-0">
            <p className="truncate font-bold text-ink-50">{nombre || t("sinNombre")}</p>
            <p className="truncate text-sm text-stage-muted">{rotulo}</p>
          </div>
          {sellada && (
            <span className="ml-auto shrink-0 rounded-full bg-ink-50/10 px-2 py-1 text-xs font-semibold text-ink-50">
              {t("lista")}
            </span>
          )}
        </Capa>

        {/* Las capas del medio son las que sobran si la tarjeta se queda corta:
            se recortan por abajo y la línea de país e idiomas nunca se pierde.
            Con `center-safe` el aire sobrante se reparte arriba y abajo cuando
            caben (antes se amontonaban arriba y dejaban medio alto vacío) y
            vuelven al principio en cuanto no caben, para no perderlas por arriba */}
        <div className="flex min-h-0 flex-1 flex-col justify-center-safe gap-5 overflow-hidden">
          {/* Web de la agencia y en qué punto está su solicitud */}
          {rama === "agencia" && (cuenta.agencia.web || cuenta.agencia.organizacion) && (
            <Capa orden={1} className="space-y-2">
              {cuenta.agencia.web && (
                <p className="truncate text-sm text-ink-100">{cuenta.agencia.web}</p>
              )}
              <p className="flex flex-wrap gap-1.5 text-xs">
                {!sellada && (
                  <span className="rounded-full bg-ink-50/10 px-2.5 py-1 text-stage-muted">
                    {t("verificacion")}
                  </span>
                )}
                {cuenta.agencia.dominioCoincide && (
                  <span className="rounded-full bg-ink-50/10 px-2.5 py-1 text-ink-100">
                    {t("dominio")}
                  </span>
                )}
              </p>
            </Capa>
          )}

          {/* Temas */}
          {verticales.length > 0 && (
            <Capa orden={1}>
              <ul data-capa-pop="" className="flex flex-wrap gap-1.5">
                {verticales.map((v, i) => (
                  <li
                    key={v}
                    style={{ "--i": i } as React.CSSProperties}
                    className="rounded-full border border-stage-border px-2.5 py-1 text-xs text-ink-100"
                  >
                    {tt(`verticales.${v}`)}
                  </li>
                ))}
              </ul>
            </Capa>
          )}

          {/* Mini feed: lo que ya puede clipear con lo que lleva contestado */}
          {campanas.length > 0 && (
            <Capa orden={2} className="space-y-2">
              <Rotulo>{t("feed")}</Rotulo>
              <ul className="space-y-1.5">
                {campanas.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center gap-2 rounded-xl bg-ink-50/6 px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      {/* Dos líneas en vez de elipsis: a 2560 px los títulos
                          caben igual y en móvil dejan de cortarse a media palabra */}
                      <p className="line-clamp-2 text-sm font-semibold text-ink-50">
                        {c.titulo}
                      </p>
                      <p className="truncate text-xs text-stage-muted">{c.marca}</p>
                    </div>
                    <span className="tabular shrink-0 text-xs text-ink-100">
                      {f.money(c.cpm, { decimals: 2 })}
                    </span>
                  </li>
                ))}
              </ul>
            </Capa>
          )}

          {/* Sector que promociona la agencia, con su marca de revisión */}
          {sector && (
            <Capa orden={3}>
              <Rotulo>{t("sector")}</Rotulo>
              <p data-capa-pop="" className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="rounded-full bg-ink-50/10 px-2.5 py-1 text-ink-100">
                  {tt(`sectores.${sector}`)}
                </span>
                {SECTOR_REGULADO[sector] && (
                  <span className="rounded-full border border-stage-border px-2.5 py-1 text-stage-muted">
                    {t("revision")}
                  </span>
                )}
              </p>
              {cpmSector !== null && (
                <p className="tabular mt-2 text-sm text-ink-100">
                  {t("cpm", { valor: f.money(cpmSector, { decimals: 2 }) })}
                </p>
              )}
            </Capa>
          )}

          {/* Radar del fandom */}
          {fans.length > 0 && (
            <Capa orden={3}>
              <Rotulo>{t("radar")}</Rotulo>
              {/* El `pb` deja sitio al saliente de la insignia de plataforma
                  (`-right-1 -bottom-1` del avatar): sin él la corta el recorte */}
              <ul data-capa-pop="" className="flex flex-wrap items-center gap-2 pb-1.5">
                {fans.slice(0, RADAR_MAX).map((fan, i) => {
                  const d = datosFan(fan)
                  return (
                    <li
                      key={claveFan(fan)}
                      style={{ "--i": i } as React.CSSProperties}
                      className="relative"
                      title={d.nombre}
                    >
                      <AvatarCreador
                        nombre={d.nombre}
                        semilla={claveFan(fan)}
                        plataforma={d.plataforma}
                      />
                      {d.tieneCampana && (
                        <span className="absolute -top-1 -right-1 size-3 rounded-full bg-primary ring-2 ring-ink-900" />
                      )}
                    </li>
                  )
                })}
                {fans.length > RADAR_MAX && (
                  <li className="tabular text-xs text-stage-muted">
                    {t("mas", { n: fans.length - RADAR_MAX })}
                  </li>
                )}
              </ul>
              {fans.some((fan) => datosFan(fan).tieneCampana) && (
                <p className="mt-2 text-xs text-stage-muted">{t("tieneCampana")}</p>
              )}
            </Capa>
          )}

          {/* Plataformas de directo y minutos previstos (rama «mis videos») */}
          {rama === "creador" && plataformas.length > 0 && (
            <Capa orden={3}>
              <ul data-capa-pop="" className="flex flex-wrap items-center gap-2">
                {plataformas.map((p, i) => (
                  <li
                    key={p}
                    style={{ "--i": i } as React.CSSProperties}
                    className="flex items-center gap-1.5 rounded-full bg-ink-50/10 px-2.5 py-1 text-xs text-ink-100"
                    title={nombrePlataforma(p)}
                  >
                    <LogoPlataforma plataforma={p} className="size-3.5" />
                    {nombrePlataforma(p)}
                  </li>
                ))}
              </ul>
              {minutos > 0 && (
                <p className="tabular mt-2 text-sm text-ink-100">
                  {t("minutos", { min: f.number(minutos) })}
                </p>
              )}
            </Capa>
          )}

          {/* Redes donde publica (o donde busca la agencia): rótulo y nombre de
              la red, como las plataformas de directo. Sin ellos eran cuadrados
              grises sin decir de qué red eran */}
          {redes.length > 0 && (
            <Capa orden={4}>
              <Rotulo>{rama === "agencia" ? t("redesObjetivo") : t("redes")}</Rotulo>
              <ul data-capa-pop="" className="flex flex-wrap items-center gap-2">
                {redes.map((r, i) => (
                  <li
                    key={r}
                    style={{ "--i": i } as React.CSSProperties}
                    className="flex items-center gap-1.5 rounded-full bg-ink-50/10 px-2.5 py-1 text-xs text-ink-100"
                    title={SOCIAL_NETWORKS[r].name}
                  >
                    <SocialGlyph
                      network={r}
                      tone="current"
                      className="size-3.5 shrink-0 text-ink-50"
                    />
                    {SOCIAL_NETWORKS[r].name}
                  </li>
                ))}
              </ul>
            </Capa>
          )}

          {/* Alcance de la agencia: países e idiomas a los que apunta */}
          {(paisesObjetivo.length > 0 || idiomasObjetivo.length > 0) && (
            <Capa orden={4}>
              <Rotulo>{t("alcance")}</Rotulo>
              <ul
                data-capa-pop=""
                className="flex flex-wrap items-center gap-1.5 text-xs"
              >
                {paisesObjetivo.map((p, i) => (
                  <li
                    key={p}
                    style={{ "--i": i } as React.CSSProperties}
                    className="flex items-center gap-1.5 rounded-full bg-ink-50/10 px-2.5 py-1 text-ink-100"
                  >
                    <CountryFlag code={p} className="ring-ink-50/20" />
                    {nombrePais(p)}
                  </li>
                ))}
                {idiomasObjetivo.map((idioma, i) => (
                  <li
                    key={idioma}
                    style={{ "--i": paisesObjetivo.length + i } as React.CSSProperties}
                    className="rounded-full border border-stage-border px-2.5 py-1 text-ink-100"
                  >
                    {nombreIdioma(idioma)}
                  </li>
                ))}
              </ul>
            </Capa>
          )}
        </div>

        <div className="space-y-3">
          {(pais || cuenta.idiomas.length > 0) && (
            <Capa orden={5}>
              <Rotulo>{t("paisIdiomas")}</Rotulo>
              {/* El idioma con su nombre, no con el código: junto a la bandera,
                  «ES» se leía como una segunda forma de decir el país */}
              <p className="flex min-w-0 items-center gap-2 text-sm text-ink-100">
                {pais && <CountryFlag code={pais} className="ring-ink-50/20" />}
                <span className="truncate">
                  {cuenta.idiomas.map(nombreIdioma).join(" · ")}
                </span>
              </p>
            </Capa>
          )}
          {encajan !== undefined && rama !== "agencia" && (
            <p
              // Volver a montarlo con cada valor dispara el destello de «reducir»
              key={encajan}
              data-contador=""
              className="rounded-md text-sm font-semibold text-ink-50"
            >
              {tl("encajan", { count: encajanVisible })}
            </p>
          )}
        </div>
      </div>
    </CropFrame>
  )
}

/**
 * Tarjeta mini por debajo de 64 rem (§5.1): fija arriba, con los segmentos del
 * timeline, «Toma n de 5», los temas y la línea viva. Al tocarla, la tarjeta
 * completa se abre en línea; el botón es lo único que ven el teclado y el
 * lector de pantalla, lo demás es decorativo.
 *
 * Fija solo cerrada: abierta ocupa más de la mitad de la pantalla y taparía la
 * pregunta y los controles de la toma.
 *
 * Vive siempre dentro de `OnboardingFlow`: lee del contexto en qué toma va,
 * como el Monitor.
 */
export function TarjetaMini({
  cuenta,
  rama,
  encajan,
  feed,
  className,
}: Omit<ProfileCardProps, "sellada">) {
  const t = useTranslations("onboarding.chrome")
  const tt = useTranslations("taxonomy")
  const ctx = useFlujo()
  const [abierta, setAbierta] = React.useState(false)
  const id = React.useId()
  const verticales = verticalesDe(cuenta, rama)
  const nombre = (rama === "agencia" && cuenta.agencia.organizacion) || cuenta.nombre
  const o = cuenta.onboarding
  const tomas = ctx.pasos.filter((p) => !esRender(p))
  const viva = [
    ctx.numero !== null ? t("take", { n: ctx.numero, total: ctx.total }) : null,
    encajan !== undefined && rama !== "agencia"
      ? t("live.encajan", { count: encajan })
      : null,
  ]
    .filter(Boolean)
    .join(" · ")

  return (
    <div
      data-tarjeta-mini=""
      className={cn(
        "z-10 border-y border-border bg-background px-4 py-2.5 @3xl/bienvenida:px-8",
        abierta ? "relative" : "sticky top-0",
        className
      )}
    >
      <button
        type="button"
        data-button=""
        data-sound="none"
        aria-expanded={abierta}
        aria-controls={id}
        onClick={() => setAbierta((v) => !v)}
        className="flex min-h-11 w-full items-center gap-3 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span
          aria-hidden
          className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
        >
          {inicialesDe(nombre || "·")}
        </span>
        <span className="min-w-0 flex-1">
          <span aria-hidden className="block truncate text-sm font-semibold">
            {verticales.length > 0
              ? verticales.map((v) => tt(`verticales.${v}`)).join(" · ")
              : nombre || t("tarjeta.sinNombre")}
          </span>
          {viva && (
            <span aria-hidden className="block truncate text-xs text-muted-foreground">
              {viva}
            </span>
          )}
          <span className="sr-only">
            {abierta ? t("tarjeta.cerrar") : t("tarjeta.abrir")}
          </span>
        </span>
      </button>

      {/* Los mismos segmentos del timeline de la Mesa: al desplazarse por una
          toma larga, es lo único que dice por dónde va (§5.1). Decorativo: el
          progreso hablado está en el timeline y en el título de la página */}
      {tomas.length > 0 && (
        <ol aria-hidden className="mt-2 flex gap-1.5">
          {tomas.map((p) => {
            const estado = estadoSegmento(
              p,
              ctx.paso,
              o.pasosRespondidos,
              o.pasosSaltados
            )
            return (
              <li
                key={p}
                data-segmento={p}
                data-estado={estado}
                className={cn(
                  "h-1.5 flex-1 rounded-full",
                  estado === "respondida" && "bg-primary",
                  estado === "actual" && "bg-primary/35 ring-1 ring-primary",
                  estado === "saltada" && "border border-dashed border-muted-foreground",
                  estado === "pendiente" && "bg-muted"
                )}
              />
            )
          })}
        </ol>
      )}

      {abierta && (
        <div id={id} className="flex justify-center py-4">
          <ProfileCard
            cuenta={cuenta}
            rama={rama}
            encajan={encajan}
            feed={feed}
            // A 390 px, 224 px dejaban fuera el radar y las redes
            className="w-full max-w-[min(18rem,80vw)]"
          />
        </div>
      )}
    </div>
  )
}
