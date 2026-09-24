"use client"

import * as React from "react"
import { useTranslations } from "next-intl"

import { PLATAFORMA_LABEL, type PlataformaDirecto } from "@/lib/ajustes"
import { minutosPrevistos } from "@/lib/onboarding"
import {
  DURACIONES_DIRECTO,
  FRECUENCIAS_DIRECTO,
  NO_TRANSMITO,
  PLATAFORMAS_DIRECTO_ONBOARDING,
  type PlataformaDirectoOnboarding,
} from "@/lib/taxonomia"
import {
  FacebookIcon,
  KickIcon,
  TikTokIcon,
  TwitchIcon,
  YouTubeIcon,
  type SocialIconProps,
} from "@/components/brand/social-icons"
import { ChipGroup } from "@/components/onboarding/chip-group"
import { ChoiceCards } from "@/components/onboarding/choice-cards"
import { useFlujo } from "@/components/onboarding/contexto"
import { CampoToma, Toma } from "@/components/onboarding/toma"

const ICONO_PLATAFORMA: Record<
  PlataformaDirecto,
  React.ComponentType<SocialIconProps>
> = {
  twitch: TwitchIcon,
  youtube: YouTubeIcon,
  kick: KickIcon,
  tiktok: TikTokIcon,
  facebook: FacebookIcon,
}

/** Logo oficial de una plataforma de directo (decorativo: el nombre va al lado). */
export function IconoPlataforma({
  plataforma,
  ...props
}: SocialIconProps & { plataforma: PlataformaDirecto }) {
  const Icono = ICONO_PLATAFORMA[plataforma]
  return <Icono tone="official" aria-hidden {...props} />
}

/** Plataformas reales (sin «No hago directos») de una selección. */
export const plataformasReales = (
  seleccion: readonly PlataformaDirectoOnboarding[] | undefined
): PlataformaDirecto[] =>
  (seleccion ?? []).filter((p): p is PlataformaDirecto => p !== NO_TRANSMITO)

/**
 * Toma 2 del creador · mis videos (§2.5, §3.3): dónde transmite o sube sus
 * videos largos. Chips con los logos de Twitch, YouTube, Kick, TikTok y
 * Facebook, y «No hago directos, subo videos» (excluyente). Si transmite
 * aparecen en línea la frecuencia (obligatoria) y la duración (opcional).
 *
 * Reacción (§4.5): «Con ese ritmo subirías unos {min} minutos al mes», con
 * `minutosPrevistos`. Al pasar a «No hago directos» se borran frecuencia y
 * duración: no se guardan datos de directo de quien no transmite.
 */
export function TomaDirecto() {
  const ctx = useFlujo()
  const t = useTranslations("onboarding.creador.directo")
  const tt = useTranslations("taxonomy")
  const { cuenta, responder } = ctx
  const cr = cuenta.creador
  const seleccion = cr.plataformasDirecto ?? []
  const transmite = plataformasReales(seleccion).length > 0
  const idDuracion = React.useId()

  const reaccion =
    transmite && cr.frecuencia
      ? t("reaction.minutos", { min: minutosPrevistos(cr.frecuencia, cr.duracion) })
      : seleccion.includes(NO_TRANSMITO)
        ? t("reaction.sinDirectos")
        : null

  return (
    <Toma
      pregunta={t("question")}
      paraQue={t("why")}
      datos="estadisticas"
      reaccion={reaccion}
    >
      <CampoToma campo="plataformasDirecto">
        {(a) => (
          <ChipGroup<PlataformaDirectoOnboarding>
            atajos
            value={seleccion}
            excluyentes={[NO_TRANSMITO]}
            onValueChange={(sel) => {
              responder("creador.plataformasDirecto", sel.length ? sel : undefined)
              if (!plataformasReales(sel).length) {
                if (cr.frecuencia) responder("creador.frecuencia", undefined)
                if (cr.duracion) responder("creador.duracion", undefined)
              }
            }}
            aria-labelledby={a.etiquetaId}
            aria-describedby={a.describedBy}
            invalid={a.invalid}
            options={PLATAFORMAS_DIRECTO_ONBOARDING.map((id) =>
              id === NO_TRANSMITO
                ? { value: id, label: tt("plataformasDirecto.no-transmito") }
                : {
                    value: id,
                    label: PLATAFORMA_LABEL[id],
                    icon: <IconoPlataforma plataforma={id} />,
                  }
            )}
          />
        )}
      </CampoToma>

      {transmite && (
        <CampoToma campo="frecuencia" etiqueta={t("frequency.label")}>
          {(a) => (
            <ChoiceCards
              size="sm"
              className="@xl/bienvenida:grid-cols-2 @[100rem]/bienvenida:grid-cols-3"
              value={cr.frecuencia}
              onValueChange={(v) => responder("creador.frecuencia", v)}
              aria-labelledby={a.etiquetaId}
              aria-describedby={a.describedBy}
              invalid={a.invalid}
              options={FRECUENCIAS_DIRECTO.map((id) => ({
                value: id,
                title: tt(`frecuenciasDirecto.${id}`),
              }))}
            />
          )}
        </CampoToma>
      )}

      {transmite && (
        <div className="space-y-3">
          <p id={idDuracion} className="text-sm font-medium">
            {t("duration.label")}
          </p>
          <ChoiceCards
            size="sm"
            className="grid-cols-2 @3xl/bienvenida:grid-cols-4"
            value={cr.duracion}
            onValueChange={(v) => responder("creador.duracion", v)}
            aria-labelledby={idDuracion}
            options={DURACIONES_DIRECTO.map((id) => ({
              value: id,
              title: tt(`duracionesDirecto.${id}`),
            }))}
          />
        </div>
      )}
    </Toma>
  )
}
