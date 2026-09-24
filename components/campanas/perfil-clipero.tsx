"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"
import { Info } from "lucide-react"

import { LOCALE_TAG } from "@/i18n/routing"
import { cn } from "@/lib/utils"
import type { PerfilParaAgencia } from "@/lib/participacion"
import { SOCIAL_NETWORKS } from "@/lib/social"
import { inicialesDe } from "@/hooks/use-cuenta"
import { useFormat } from "@/hooks/use-format"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { CountryFlag, useCountryName } from "@/components/shared/country-flag"
import { SocialGlyph } from "@/components/brand/social"

/**
 * La ficha con la que una agencia decide si trabaja con un clipero.
 *
 * Pinta exactamente lo que devuelve `perfilParaAgencia()` de
 * `lib/participacion.ts` (§2.1.b de docs/campanas-ciclo-2026-09.md) y nada más:
 * nombre, país, idiomas, redes con su **tramo** de seguidores (nunca la cifra
 * exacta de una cuenta ajena), temas, experiencia, disponibilidad, el historial
 * verificable dentro de Clipealo y su nota. Ni correo, ni wallet, ni a qué otras
 * campañas se presentó: eso lo dice también la ⓘ del pie.
 *
 * Es presentacional: no lee el almacén ni decide nada. Quien la usa le pasa el
 * perfil ya calculado (lo hace `SolicitudesAgencia`), así que sirve igual en la
 * bandeja de la agencia, en el detalle de un compromiso o en el admin.
 *
 * Lo que el dominio no sabe se escribe («No lo ha dicho»), no se rellena con
 * nada inventado: un perfil vacío es en sí una razón para rechazar
 * (`sin-historial`).
 */
export function PerfilClipero({
  perfil,
  className,
  children,
}: {
  perfil: PerfilParaAgencia
  className?: string
  /** Acciones o notas al pie de la ficha (la bandeja mete ahí aceptar/rechazar). */
  children?: React.ReactNode
}) {
  const t = useTranslations("campaignsAgencia.perfil")
  const tt = useTranslations("taxonomy")
  const f = useFormat()
  const locale = useLocale()
  const nombrePais = useCountryName()
  const nombreIdioma = React.useMemo(() => {
    const nombres = new Intl.DisplayNames([LOCALE_TAG[locale]], { type: "language" })
    return (codigo: string) => nombres.of(codigo) ?? codigo
  }, [locale])

  const h = perfil.historial
  const idiomas = perfil.idiomas.map((i) => nombreIdioma(i))

  return (
    <div
      className={cn("@container/perfil space-y-4", className)}
      aria-label={t("aria", { name: perfil.nombre })}
      role="group"
    >
      <div className="flex items-start gap-3">
        <Avatar size="lg">
          <AvatarFallback>{inicialesDe(perfil.nombre)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 space-y-1">
          <p className="leading-tight font-semibold">{perfil.nombre}</p>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              {perfil.pais && perfil.pais !== "otro" && (
                <CountryFlag code={perfil.pais} decorative />
              )}
              {perfil.pais === null
                ? t("sinDato")
                : perfil.pais === "otro"
                  ? t("otroPais")
                  : nombrePais(perfil.pais)}
            </span>
            {idiomas.length > 0 && (
              <>
                <span aria-hidden>·</span>
                <span>{f.list(idiomas)}</span>
              </>
            )}
          </p>
        </div>
      </div>

      <dl className="grid gap-3 @md/perfil:grid-cols-2">
        <Dato label={t("redes")}>
          {perfil.redes.length === 0 ? (
            <span className="text-muted-foreground">{t("sinRedes")}</span>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {perfil.redes.map((r) => (
                <li key={r.red} className="flex flex-wrap items-center gap-1.5">
                  <SocialGlyph
                    network={r.red}
                    tone="official"
                    className="size-4 shrink-0"
                    aria-hidden
                  />
                  <span className="truncate">
                    {r.handle ?? SOCIAL_NETWORKS[r.red].name}
                  </span>
                  <Badge variant="outline">
                    {r.tramo ? tt(`tramosSeguidores.${r.tramo}`) : t("sinTramo")}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Dato>

        <Dato label={t("temas")}>
          {perfil.temas.length === 0 ? (
            <span className="text-muted-foreground">{t("sinTemas")}</span>
          ) : (
            <span className="flex flex-wrap gap-1">
              {perfil.temas.map((v) => (
                <Badge key={v} variant="secondary">
                  {tt(`verticales.${v}`)}
                </Badge>
              ))}
            </span>
          )}
        </Dato>

        <Dato label={t("experiencia")}>
          {perfil.experiencia ? (
            tt(`experiencia.${perfil.experiencia}`)
          ) : (
            <span className="text-muted-foreground">{t("sinDato")}</span>
          )}
        </Dato>

        <Dato label={t("disponibilidad")}>
          {perfil.disponibilidad ? (
            tt(`disponibilidad.${perfil.disponibilidad}`)
          ) : (
            <span className="text-muted-foreground">{t("sinDato")}</span>
          )}
        </Dato>
      </dl>

      <section className="rounded-lg bg-muted/60 p-3">
        <h4 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {t("historial.title")}
        </h4>
        {h.enviados === 0 ? (
          <p className="mt-1.5 text-sm text-muted-foreground">{t("historial.vacio")}</p>
        ) : (
          <dl className="mt-2 grid grid-cols-3 gap-3">
            <Cifra
              label={t("historial.aprobados")}
              valor={f.number(h.aprobados)}
              pie={t("historial.deEnviados", { n: h.enviados })}
            />
            <Cifra
              label={t("historial.tasa")}
              valor={
                h.tasaAprobacion === null ? t("sinDato") : f.percent(h.tasaAprobacion)
              }
            />
            <Cifra
              label={t("historial.vistas")}
              valor={
                h.vistasMedianas === null ? t("sinDato") : f.compact(h.vistasMedianas)
              }
            />
          </dl>
        )}
      </section>

      {perfil.nota && (
        <figure className="space-y-1">
          <figcaption className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {t("nota")}
          </figcaption>
          <blockquote className="border-l-2 border-border pl-3 text-sm text-pretty">
            {perfil.nota}
          </blockquote>
        </figure>
      )}

      {/* La frontera de datos, escrita: enseñar un perfil exige decir qué se enseña */}
      <p className="flex items-start gap-1.5 text-xs text-pretty text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        {t("frontera")}
      </p>

      {children}
    </div>
  )
}

/** Un dato del perfil: etiqueta arriba, valor debajo. */
function Dato({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="text-sm">{children}</dd>
    </div>
  )
}

/** Una cifra del historial. El número va tabular: no baila al actualizarse. */
function Cifra({ label, valor, pie }: { label: string; valor: string; pie?: string }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-lg leading-tight font-semibold tabular-nums">{valor}</dd>
      {pie && <dd className="text-xs text-muted-foreground">{pie}</dd>}
    </div>
  )
}
