"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"

import { LOCALE_TAG } from "@/i18n/routing"
import { ofertaEstimada } from "@/lib/agencia"
import { IDIOMAS_AUDIENCIA, type IdiomaAudiencia } from "@/lib/ajustes"
import { COUNTRY_CODES, type CountryCode } from "@/lib/countries"
import { umbralPublicoValor } from "@/lib/onboarding"
import { SOCIAL_IDS, SOCIAL_NETWORKS, type SocialId } from "@/lib/social"
import { esId } from "@/lib/taxonomia"
import { leerCuenta } from "@/hooks/use-cuenta"
import { useFormat } from "@/hooks/use-format"
import { SocialGlyph } from "@/components/brand/social"
import { CountryFlag, useCountryName } from "@/components/shared/country-flag"
import { ChipGroup } from "@/components/onboarding/chip-group"
import { useFlujo } from "@/components/onboarding/contexto"
import { CampoToma, Toma } from "@/components/onboarding/toma"

/**
 * Toma 4 de la agencia (§2.8): redes, países del público e idiomas objetivo.
 *
 * Su país y el idioma de la interfaz salen marcados (`inferido`; al continuar
 * pasan a declarado). La reacción dice cuántos cliperos cubren la combinación
 * (`ofertaEstimada`), siempre en grupos de 50 o más: por debajo del umbral no
 * se da ninguna cifra, se dice que aún son pocos.
 */
export function TomaAlcance() {
  const ctx = useFlujo()
  const t = useTranslations("onboarding.agencia.alcance")
  const tt = useTranslations("taxonomy")
  const locale = useLocale()
  const f = useFormat()
  const nombrePais = useCountryName()
  const { cuenta, responder } = ctx
  const a = cuenta.agencia

  const nombreIdioma = React.useMemo(() => {
    const tag = LOCALE_TAG[locale]
    const nombres = new Intl.DisplayNames([tag], { type: "language" })
    return (codigo: IdiomaAudiencia) => {
      const nombre = nombres.of(codigo) ?? codigo
      return nombre.charAt(0).toLocaleUpperCase(tag) + nombre.slice(1)
    }
  }, [locale])

  React.useEffect(() => {
    const c = leerCuenta()
    const pais = c.agencia.pais ?? c.pais
    if (!c.agencia.paisesObjetivo?.length && esId(COUNTRY_CODES, pais))
      responder("agencia.paisesObjetivo", [pais], "inferido")
    if (!c.agencia.idiomasObjetivo?.length && esId(IDIOMAS_AUDIENCIA, locale))
      responder("agencia.idiomasObjetivo", [locale], "inferido")
  }, [responder, locale])

  const redes = a.redesObjetivo ?? []
  const paises = a.paisesObjetivo ?? []
  const idiomas = a.idiomasObjetivo ?? []
  const verticales = a.verticalesMaterial ?? []
  const completa = redes.length > 0 && paises.length > 0 && idiomas.length > 0
  const umbral = completa
    ? umbralPublicoValor(
        ofertaEstimada({
          verticales,
          sector: a.sector,
          paises,
          idiomas,
          redes,
        })
      )
    : null
  const reaccion = !completa
    ? null
    : umbral
      ? t("reaction.oferta", {
          umbral,
          nichos: verticales.length
            ? f.list(verticales.map((v) => tt(`verticales.${v}`)))
            : a.sector
              ? tt(`sectores.${a.sector}`)
              : "",
          redes: f.list(redes.map((r) => SOCIAL_NETWORKS[r].name)),
          paises: f.list(paises.map((p) => nombrePais(p))),
        })
      : t("reaction.pocos")

  return (
    <Toma
      pregunta={t("question")}
      paraQue={t("why")}
      datos="agencias"
      reaccion={reaccion}
    >
      <CampoToma campo="redesObjetivo" etiqueta={t("fields.redes")}>
        {(x) => (
          <ChipGroup<SocialId>
            atajos
            value={redes}
            onValueChange={(sel) =>
              responder("agencia.redesObjetivo", sel.length ? sel : undefined)
            }
            aria-labelledby={x.etiquetaId}
            aria-describedby={x.describedBy}
            invalid={x.invalid}
            options={SOCIAL_IDS.map((id) => ({
              value: id,
              label: SOCIAL_NETWORKS[id].name,
              icon: <SocialGlyph network={id} tone="official" />,
            }))}
          />
        )}
      </CampoToma>

      <CampoToma campo="paisesObjetivo" etiqueta={t("fields.paises")}>
        {(x) => (
          <ChipGroup<CountryCode>
            value={paises}
            onValueChange={(sel) =>
              responder("agencia.paisesObjetivo", sel.length ? sel : undefined)
            }
            aria-labelledby={x.etiquetaId}
            aria-describedby={x.describedBy}
            invalid={x.invalid}
            options={COUNTRY_CODES.map((code) => ({
              value: code,
              label: nombrePais(code),
              icon: <CountryFlag code={code} className="h-3.5 w-[1.125rem]" />,
            }))}
          />
        )}
      </CampoToma>

      <CampoToma campo="idiomasObjetivo" etiqueta={t("fields.idiomas")}>
        {(x) => (
          <ChipGroup<IdiomaAudiencia>
            value={idiomas}
            onValueChange={(sel) =>
              responder("agencia.idiomasObjetivo", sel.length ? sel : undefined)
            }
            aria-labelledby={x.etiquetaId}
            aria-describedby={x.describedBy}
            invalid={x.invalid}
            options={IDIOMAS_AUDIENCIA.map((id) => ({
              value: id,
              label: nombreIdioma(id),
            }))}
          />
        )}
      </CampoToma>
    </Toma>
  )
}
