"use client"

import * as React from "react"
import { Globe } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { LOCALE_TAG } from "@/i18n/routing"
import { IDIOMAS_AUDIENCIA, type IdiomaAudiencia } from "@/lib/ajustes"
import { COUNTRY_CODES, type CountryCode } from "@/lib/countries"
import { LIMITES_ONBOARDING, type PaisResidencia } from "@/lib/onboarding"
import { esId } from "@/lib/taxonomia"
import { metodosDe } from "@/lib/wallet"
import { leerCuenta } from "@/hooks/use-cuenta"
import { useFormat } from "@/hooks/use-format"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CountryFlag, useCountryName } from "@/components/shared/country-flag"
import { ChipGroup } from "@/components/onboarding/chip-group"
import { useFlujo } from "@/components/onboarding/contexto"
import { CampoToma, Toma } from "@/components/onboarding/toma"

/** Región del navegador («es-PE» → PE) si está en la lista. Solo en efectos. */
export function paisDelNavegador(idiomas: readonly string[]): CountryCode | null {
  for (const etiqueta of idiomas) {
    const region = etiqueta.split("-")[1]?.toUpperCase()
    if (esId(COUNTRY_CODES, region)) return region
  }
  return null
}

/**
 * Toma 5 del clipero (§2.4): país e idiomas de sus clips. El país se precarga
 * si `navigator.languages` trae una región de la lista (en un efecto, como
 * `inferido`; al continuar pasa a declarado) y el idioma de la interfaz sale
 * marcado. La reacción dice cómo cobra en su país (`METODOS_POR_PAIS`).
 */
export function TomaBasicos() {
  const ctx = useFlujo()
  const t = useTranslations("onboarding.clipero.basicos")
  const te = useTranslations("onboarding.errors")
  const tc = useTranslations("campaigns.withdrawal.method")
  const locale = useLocale()
  const f = useFormat()
  const nombrePais = useCountryName()
  const { cuenta, responder } = ctx

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
    if (!c.pais) {
      const pais = paisDelNavegador(navigator.languages ?? [navigator.language])
      if (pais) responder("pais", pais, "inferido")
    }
    if (!c.idiomas.length && esId(IDIOMAS_AUDIENCIA, locale))
      responder("idiomas", [locale], "inferido")
  }, [responder, locale])

  const pais = cuenta.pais
  const metodos = f.list(metodosDe(pais).map((m) => tc(`${m}.name`)))
  const reaccion = pais
    ? pais === "otro"
      ? t("reactionOther", { metodos })
      : t("reaction", { pais: nombrePais(pais), metodos })
    : null

  return (
    <Toma
      pregunta={t("question")}
      paraQue={t("why")}
      datos="estadisticas"
      reaccion={reaccion}
    >
      <CampoToma campo="pais" etiqueta={t("country.label")} htmlFor="toma-pais">
        {(a) => (
          <Select
            value={pais ?? ""}
            onValueChange={(v) => responder("pais", v as PaisResidencia)}
          >
            <SelectTrigger
              id="toma-pais"
              aria-invalid={a.invalid || undefined}
              aria-describedby={a.describedBy}
              className="h-11 w-full @md/bienvenida:max-w-sm"
            >
              <SelectValue placeholder={t("country.placeholder")} />
            </SelectTrigger>
            <SelectContent>
              {COUNTRY_CODES.map((code) => (
                <SelectItem key={code} value={code}>
                  <CountryFlag code={code} className="h-3.5 w-[1.125rem]" />
                  {nombrePais(code)}
                </SelectItem>
              ))}
              <SelectItem value="otro">
                <Globe className="size-4" aria-hidden />
                {t("country.other")}
              </SelectItem>
            </SelectContent>
          </Select>
        )}
      </CampoToma>

      <CampoToma
        campo="idiomas"
        etiqueta={t("languages.label")}
        ayuda={t("languages.help", { max: LIMITES_ONBOARDING.idiomas })}
      >
        {(a) => (
          <ChipGroup<IdiomaAudiencia>
            atajos
            value={cuenta.idiomas}
            max={LIMITES_ONBOARDING.idiomas}
            onLleno={(max) => ctx.anunciar(te("maxIdiomas", { max }))}
            onValueChange={(sel) => responder("idiomas", sel)}
            aria-labelledby={a.etiquetaId}
            aria-describedby={a.describedBy}
            invalid={a.invalid}
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
