"use client"

import * as React from "react"
import { Plus, X } from "lucide-react"
import { useTranslations } from "next-intl"

import { LUGARES_MICRO, type LugarMicro } from "@/lib/micro-preguntas"
import {
  LIMITES_PREGUNTA,
  TIPOS_RESPUESTA,
  hayBloqueoPregunta,
  validarPregunta,
  type AvisoPregunta,
  type BorradorPregunta,
  type TipoRespuesta,
} from "@/lib/micro-catalogo"
import { Button } from "@/components/ui/button"
import {
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

/** El estado marcado, escrito en el borde y el fondo, como en el resto. */
const MARCADO =
  "transition-colors data-[state=on]:border-primary data-[state=on]:bg-accent"

/**
 * Escribir una pregunta desde el backoffice.
 *
 * Se monta con `key` y recibe el borrador hecho, así que el estado nace del
 * inicializador del `useState` y no hace falta ningún efecto que lo siembre.
 *
 * La validación vive en el dominio y devuelve códigos; aquí solo se traducen.
 * El «para qué» es obligatorio a propósito: una pregunta sin él se responde
 * peor y se abandona antes, y es la mitad del trato que hace el onboarding.
 */
export function PreguntaForm({
  inicial,
  onGuardar,
  onCerrar,
}: {
  inicial: BorradorPregunta
  onGuardar: (b: BorradorPregunta) => void
  onCerrar: () => void
}) {
  const t = useTranslations("admin.preguntas")
  const [b, setB] = React.useState<BorradorPregunta>(inicial)
  const [intento, setIntento] = React.useState(false)

  const avisos = validarPregunta(b)
  const bloquea = hayBloqueoPregunta(avisos)
  const pon = <K extends keyof BorradorPregunta>(campo: K, valor: BorradorPregunta[K]) =>
    setB((x) => ({ ...x, [campo]: valor }))

  const frase = (a: AvisoPregunta | undefined) =>
    a
      ? t(`form.errors.${a.code}`, { min: a.values?.min ?? 0, max: a.values?.max ?? 0 })
      : null
  const error = (campo: keyof BorradorPregunta) => {
    const a = avisos[campo]
    if (!a) return null
    return !a.bloquea || intento ? frase(a) : null
  }
  const malo = (campo: keyof BorradorPregunta) =>
    Boolean(intento && avisos[campo]?.bloquea) || undefined

  const ponOpcion = (i: number, valor: string) =>
    pon(
      "opciones",
      b.opciones.map((o, j) => (j === i ? valor : o))
    )

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault()
        setIntento(true)
        if (bloquea) return
        onGuardar({ ...b, opciones: b.opciones.map((o) => o.trim()).filter(Boolean) })
      }}
    >
      <DialogHeader>
        <DialogTitle>
          {inicial.id
            ? t("form.editTitle", { titulo: inicial.titulo })
            : t("form.newTitle")}
        </DialogTitle>
        <FieldDescription>{t("form.description")}</FieldDescription>
      </DialogHeader>

      <Field data-invalid={malo("titulo")}>
        <FieldLabel htmlFor="pregunta-titulo">{t("form.titulo")}</FieldLabel>
        <Input
          id="pregunta-titulo"
          value={b.titulo}
          aria-invalid={malo("titulo")}
          placeholder={t("form.tituloPlaceholder")}
          onChange={(e) => pon("titulo", e.target.value)}
        />
        {error("titulo") && <FieldError>{error("titulo")}</FieldError>}
      </Field>

      <Field data-invalid={malo("ayuda")}>
        <FieldLabel htmlFor="pregunta-ayuda">{t("form.ayuda")}</FieldLabel>
        <Textarea
          id="pregunta-ayuda"
          rows={2}
          value={b.ayuda}
          aria-invalid={malo("ayuda")}
          placeholder={t("form.ayudaPlaceholder")}
          onChange={(e) => pon("ayuda", e.target.value)}
        />
        {error("ayuda") ? (
          <FieldError>{error("ayuda")}</FieldError>
        ) : (
          <FieldDescription>{t("form.ayudaHint")}</FieldDescription>
        )}
      </Field>

      <div className="grid gap-4 @lg/pregunta:grid-cols-2">
        <FieldSet>
          <FieldLegend variant="label">{t("form.lugar")}</FieldLegend>
          <ToggleGroup
            type="single"
            variant="outline"
            spacing={2}
            value={b.lugar}
            onValueChange={(v) => v && pon("lugar", v as LugarMicro)}
            className="flex-wrap"
          >
            {LUGARES_MICRO.map((l) => (
              <ToggleGroupItem key={l} value={l} data-sound="tap" className={MARCADO}>
                {t(`lugares.${l}`)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </FieldSet>

        <FieldSet>
          <FieldLegend variant="label">{t("form.tipo")}</FieldLegend>
          <ToggleGroup
            type="single"
            variant="outline"
            spacing={2}
            value={b.tipo}
            onValueChange={(v) => v && pon("tipo", v as TipoRespuesta)}
            className="flex-wrap"
          >
            {TIPOS_RESPUESTA.map((x) => (
              <ToggleGroupItem key={x} value={x} data-sound="tap" className={MARCADO}>
                {t(`catalogo.${x === "multiple" ? "multipleCorto" : "unica"}`)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </FieldSet>
      </div>

      <FieldSet data-invalid={malo("opciones")}>
        <FieldLegend variant="label">{t("form.opciones")}</FieldLegend>
        <FieldDescription>
          {t("form.opcionesHint", {
            min: LIMITES_PREGUNTA.opcionesMin,
            max: LIMITES_PREGUNTA.opcionesMax,
          })}
        </FieldDescription>
        <ul className="space-y-2">
          {b.opciones.map((o, i) => (
            <li key={i} className="flex items-center gap-2">
              <Input
                value={o}
                aria-label={t("form.opcion", { n: i + 1 })}
                maxLength={LIMITES_PREGUNTA.opcionMax}
                onChange={(e) => ponOpcion(i, e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                // Dos es el mínimo: quitar la penúltima dejaría una pregunta
                // de una sola respuesta posible
                disabled={b.opciones.length <= LIMITES_PREGUNTA.opcionesMin}
                aria-label={t("form.quitarOpcion", { n: i + 1 })}
                onClick={() =>
                  pon(
                    "opciones",
                    b.opciones.filter((_, j) => j !== i)
                  )
                }
              >
                <X />
              </Button>
            </li>
          ))}
        </ul>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit"
          disabled={b.opciones.length >= LIMITES_PREGUNTA.opcionesMax}
          onClick={() => pon("opciones", [...b.opciones, ""])}
        >
          <Plus /> {t("form.anadirOpcion")}
        </Button>
        {error("opciones") && <FieldError>{error("opciones")}</FieldError>}
      </FieldSet>

      <div className="grid gap-4 @lg/pregunta:grid-cols-2">
        {b.tipo === "multiple" && (
          <Field>
            <FieldLabel htmlFor="pregunta-max">{t("form.max")}</FieldLabel>
            <Input
              id="pregunta-max"
              type="number"
              inputMode="numeric"
              min={1}
              max={LIMITES_PREGUNTA.opcionesMax}
              className="tabular-nums"
              value={b.max}
              onChange={(e) => pon("max", Number(e.target.value))}
            />
          </Field>
        )}
        <Field>
          <FieldLabel htmlFor="pregunta-dias">{t("form.desdeAltaDias")}</FieldLabel>
          <Input
            id="pregunta-dias"
            type="number"
            inputMode="numeric"
            min={0}
            max={365}
            className="tabular-nums"
            value={b.desdeAltaDias}
            onChange={(e) => pon("desdeAltaDias", Number(e.target.value))}
          />
          <FieldDescription>{t("form.desdeAltaDiasHint")}</FieldDescription>
        </Field>
      </div>

      <Field orientation="horizontal">
        <Switch
          id="pregunta-activa"
          checked={b.activa}
          onCheckedChange={(v) => pon("activa", v)}
        />
        <FieldLabel htmlFor="pregunta-activa" className="font-normal">
          {t("form.activa")}
        </FieldLabel>
      </Field>

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="ghost" onClick={onCerrar}>
            {t("form.cancel")}
          </Button>
        </DialogClose>
        <Button type="submit" variant="brand">
          {t("form.save")}
        </Button>
      </DialogFooter>
    </form>
  )
}
