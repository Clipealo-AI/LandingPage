"use client"

import * as React from "react"
import { useLocale, useTranslations } from "next-intl"

import { LOCALE_TAG } from "@/i18n/routing"
import { cn } from "@/lib/utils"
import { toast } from "@/lib/toast"
import { useCuenta } from "@/hooks/use-cuenta"
import {
  EDADES,
  IDIOMAS_AUDIENCIA,
  TEMAS,
  TEMAS_MAX,
  TONOS,
  type Edad,
  type IdiomaAudiencia,
  type PublicoCanal,
  type Tema,
  type Tono,
} from "@/lib/ajustes"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { SettingsSaveBar } from "@/components/app/settings-save-bar"

const ELEGIDO =
  "data-[state=on]:border-primary data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"

/*
 * Reparto de las secciones. Una columna en móvil, cada sección separada por una
 * línea; con sitio, dos columnas con un divisor vertical y el tono a todo el
 * ancho al final. Los bordes van en un envoltorio y no en el fieldset: en un
 * fieldset, la leyenda corta la línea.
 */
const SECCION = "min-w-0 border-t pt-6"
const COLUMNA_DERECHA = "@5xl/ajustes:border-l @5xl/ajustes:pl-10"
const PRIMERA_FILA = "@5xl/ajustes:border-t-0 @5xl/ajustes:pt-0"

const normalizar = (p: PublicoCanal) => ({
  ...p,
  temas: [...p.temas].sort(),
  edades: [...p.edades].sort(),
})
const mismos = (a: PublicoCanal, b: PublicoCanal) =>
  JSON.stringify(normalizar(a)) === JSON.stringify(normalizar(b))

/**
 * A quién le habla el canal. No filtra nada: orienta a la IA al elegir
 * momentos y al escribir títulos, descripciones y hashtags.
 *
 * Lo guardado vive en la cuenta (`use-cuenta`): los temas y el idioma que
 * responde el onboarding aparecen aquí. Mientras se edita hay un borrador; sin
 * él se enseña lo guardado.
 */
export function AudienceSettings() {
  const t = useTranslations("settings.audience")
  const locale = useLocale()
  // El idioma del público se nombra en el de la interfaz, con la mayúscula de una opción
  const nombreIdioma = React.useMemo(() => {
    const tag = LOCALE_TAG[locale]
    const nombres = new Intl.DisplayNames([tag], { type: "language" })
    return (codigo: IdiomaAudiencia) => {
      const nombre = nombres.of(codigo) ?? codigo
      return nombre.charAt(0).toLocaleUpperCase(tag) + nombre.slice(1)
    }
  }, [locale])
  const { cuenta, guardarPublico } = useCuenta()
  const guardado = cuenta.publico
  const [borrador, setBorrador] = React.useState<PublicoCanal | null>(null)
  const publico = borrador ?? guardado
  const setPublico = (cambio: (p: PublicoCanal) => PublicoCanal) =>
    setBorrador((b) => cambio(b ?? guardado))
  const dirty = borrador !== null && !mismos(borrador, guardado)
  const temasLlenos = publico.temas.length >= TEMAS_MAX

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-y-6 @5xl/ajustes:grid-cols-2 @5xl/ajustes:gap-x-10">
            <div className="min-w-0">
              <FieldSet>
                <FieldLegend>{t("topics.legend")}</FieldLegend>
                <FieldDescription>
                  {t("topics.count", { max: TEMAS_MAX, count: publico.temas.length })}
                </FieldDescription>
                <ToggleGroup
                  type="multiple"
                  variant="outline"
                  spacing={2}
                  value={publico.temas}
                  onValueChange={(v) =>
                    setPublico((p) => ({
                      ...p,
                      temas: (v as Tema[]).slice(0, TEMAS_MAX),
                    }))
                  }
                  className="flex-wrap"
                >
                  {TEMAS.map((tema) => (
                    <ToggleGroupItem
                      key={tema}
                      value={tema}
                      data-sound="tap"
                      // Llenas las tres, el resto se apaga hasta quitar una
                      disabled={temasLlenos && !publico.temas.includes(tema)}
                      className={`h-9 px-3.5 ${ELEGIDO}`}
                    >
                      {t(`topics.options.${tema}`)}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </FieldSet>
            </div>

            <div className={cn(SECCION, PRIMERA_FILA, COLUMNA_DERECHA)}>
              <FieldSet>
                <FieldLegend>{t("ages.legend")}</FieldLegend>
                <FieldDescription>{t("ages.description")}</FieldDescription>
                <ToggleGroup
                  type="multiple"
                  variant="outline"
                  spacing={2}
                  value={publico.edades}
                  onValueChange={(v) =>
                    setPublico((p) => ({ ...p, edades: v as Edad[] }))
                  }
                  className="flex-wrap"
                >
                  {EDADES.map((edad) => (
                    <ToggleGroupItem
                      key={edad}
                      value={edad}
                      data-sound="tap"
                      className={`h-9 px-3.5 tabular-nums ${ELEGIDO}`}
                    >
                      {edad}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </FieldSet>
            </div>

            <Field className={SECCION}>
              <FieldLabel htmlFor="idioma-publico">{t("language.label")}</FieldLabel>
              <FieldDescription>{t("language.description")}</FieldDescription>
              <Select
                value={publico.idioma}
                onValueChange={(v) =>
                  setPublico((p) => ({ ...p, idioma: v as IdiomaAudiencia }))
                }
              >
                <SelectTrigger id="idioma-publico" className="h-10 w-full sm:max-w-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {IDIOMAS_AUDIENCIA.map((codigo) => (
                    <SelectItem key={codigo} value={codigo}>
                      {nombreIdioma(codigo)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {/* En columnas va junto al idioma; en móvil, al final como siempre */}
            <div
              className={cn(
                SECCION,
                COLUMNA_DERECHA,
                "order-last @5xl/ajustes:order-none"
              )}
            >
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldLabel htmlFor="palabrotas">{t("profanity.label")}</FieldLabel>
                  <FieldDescription>{t("profanity.description")}</FieldDescription>
                </FieldContent>
                <Switch
                  id="palabrotas"
                  checked={publico.ocultarPalabrotas}
                  onCheckedChange={(on) =>
                    setPublico((p) => ({ ...p, ocultarPalabrotas: on }))
                  }
                />
              </Field>
            </div>

            <div className={cn(SECCION, "@5xl/ajustes:col-span-2")}>
              <FieldSet>
                <FieldLegend>{t("tone.legend")}</FieldLegend>
                <RadioGroup
                  value={publico.tono}
                  onValueChange={(v) => setPublico((p) => ({ ...p, tono: v as Tono }))}
                  className="grid gap-3 sm:grid-cols-2 @7xl/ajustes:grid-cols-4"
                >
                  {TONOS.map((tono) => (
                    <FieldLabel key={tono} htmlFor={`tono-${tono}`}>
                      <Field orientation="horizontal">
                        <FieldContent>
                          <FieldTitle>{t(`tone.options.${tono}.label`)}</FieldTitle>
                          <FieldDescription>
                            {t(`tone.options.${tono}.example`)}
                          </FieldDescription>
                        </FieldContent>
                        <RadioGroupItem value={tono} id={`tono-${tono}`} />
                      </Field>
                    </FieldLabel>
                  ))}
                </RadioGroup>
              </FieldSet>
            </div>
          </div>
        </CardContent>
      </Card>

      <SettingsSaveBar
        dirty={dirty}
        onDiscard={() => setBorrador(null)}
        onSave={() => {
          guardarPublico(publico)
          setBorrador(null)
          toast.success(t("saved.title"), { description: t("saved.description") })
        }}
      />
    </div>
  )
}
