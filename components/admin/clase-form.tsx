"use client"

import * as React from "react"
import { Link2 } from "lucide-react"
import { useTranslations } from "next-intl"

import { cn } from "@/lib/utils"
import { VERTICALES, type Vertical } from "@/lib/taxonomia"
import { SOCIAL_IDS, SOCIAL_NETWORKS, type SocialId } from "@/lib/social"
import { PLAN_IDS, type PricingPlanId } from "@/lib/pricing"
import {
  ESTADOS_CLASE,
  LIMITES_CLASE,
  NIVELES,
  hayBloqueoClase,
  validarClase,
  type AvisoClase,
  type BorradorClase,
  type EstadoClase,
  type Nivel,
} from "@/lib/formacion"
import { useResumableUpload } from "@/hooks/use-resumable-upload"
import { Badge } from "@/components/ui/badge"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { SocialGlyph } from "@/components/brand/social"
import { UploadDropzone } from "@/components/video/upload-dropzone"
import { useNombrePlan } from "@/components/planes/nombre-plan"

/**
 * Estar elegido tiene que verse, no adivinarse: el molde es el mismo de
 * `campaign-form.tsx`, para que marcar un tema aquí se sienta como marcar una
 * red allí.
 */
const MARCADO =
  "transition-colors data-[state=on]:border-primary data-[state=on]:bg-accent"

/**
 * El logotipo en su color cuando está elegido y apagado cuando no.
 *
 * Es un filtro y una opacidad, no un movimiento: se ve igual con
 * `prefers-reduced-motion`, que es como lo tiene el director.
 */
const LOGO =
  "size-4 transition-[filter,opacity] duration-200 [[data-state=off]_&]:opacity-60 [[data-state=off]_&]:grayscale"

/**
 * Alta y edición de una clase.
 *
 * Se monta con `key` y recibe el borrador ya hecho (`inicial`), así que el
 * estado nace con el inicializador del `useState` y no hace falta ningún efecto
 * que lo siembre: sembrar con `useEffect` es justo lo que el eslint de la casa
 * prohíbe fuera de `components/ui/**`.
 *
 * La validación vive en el dominio y devuelve códigos; aquí solo se traducen,
 * como en `campaign-form.tsx`. Y los avisos que no bloquean —publicar sin
 * video— se escriben al lado en vez de impedir el trabajo.
 */
export function ClaseForm({
  inicial,
  onGuardar,
  onCerrar,
}: {
  inicial: BorradorClase
  onGuardar: (b: BorradorClase) => void
  onCerrar: () => void
}) {
  const t = useTranslations("admin.formacion")
  const tax = useTranslations("taxonomy")
  const nombrePlan = useNombrePlan()
  const [b, setB] = React.useState<BorradorClase>(inicial)
  const [intento, setIntento] = React.useState(false)

  /**
   * La cola de subida, ya armada. El transporte de hoy recorre el archivo y no
   * lo guarda en ninguna parte, así que no devuelve dirección; el día que haya
   * almacenamiento la devolverá y el enlace se rellenará solo, sin tocar esto.
   */
  const subida = useResumableUpload({
    onCompleted: (item) => {
      if (item.url) setB((x) => ({ ...x, videoUrl: item.url as string }))
    },
  })
  const subidoSinEnlace =
    !b.videoUrl.trim() && subida.items.some((i) => i.status === "completado" && !i.url)

  const avisos = validarClase(b)
  const bloquea = hayBloqueoClase(avisos)
  const pon = <K extends keyof BorradorClase>(campo: K, valor: BorradorClase[K]) =>
    setB((x) => ({ ...x, [campo]: valor }))

  /** Un código y sus cifras, dicho en el idioma de quien administra. */
  const frase = (a: AvisoClase | undefined) =>
    a
      ? t(`form.errors.${a.code}`, { min: a.values?.min ?? 0, max: a.values?.max ?? 0 })
      : null

  /** Se enseña el aviso que no bloquea siempre; el que bloquea, al intentar. */
  const error = (campo: keyof BorradorClase) => {
    const a = avisos[campo]
    if (!a) return null
    return !a.bloquea || intento ? frase(a) : null
  }
  const malo = (campo: keyof BorradorClase) =>
    Boolean(intento && avisos[campo]?.bloquea) || undefined

  const enviar = (e: React.FormEvent) => {
    e.preventDefault()
    setIntento(true)
    if (bloquea) return
    onGuardar(b)
  }

  return (
    <form onSubmit={enviar} className="space-y-5">
      <DialogHeader>
        <DialogTitle>
          {inicial.id
            ? t("form.editTitle", { titulo: inicial.titulo })
            : t("form.newTitle")}
        </DialogTitle>
        <FieldDescription>{t("form.description")}</FieldDescription>
      </DialogHeader>

      <Field data-invalid={malo("titulo")}>
        <FieldLabel htmlFor="clase-titulo">{t("form.titulo")}</FieldLabel>
        <Input
          id="clase-titulo"
          value={b.titulo}
          aria-invalid={malo("titulo")}
          onChange={(e) => pon("titulo", e.target.value)}
        />
        {error("titulo") && <FieldError>{error("titulo")}</FieldError>}
      </Field>

      <Field data-invalid={malo("descripcion")}>
        <FieldLabel htmlFor="clase-descripcion">{t("form.descripcion")}</FieldLabel>
        <Textarea
          id="clase-descripcion"
          rows={3}
          value={b.descripcion}
          aria-invalid={malo("descripcion")}
          onChange={(e) => pon("descripcion", e.target.value)}
        />
        {error("descripcion") && <FieldError>{error("descripcion")}</FieldError>}
      </Field>

      <div className="grid gap-4 @lg/clase:grid-cols-3">
        <Field data-invalid={malo("duracionSeg")}>
          <FieldLabel htmlFor="clase-duracion">{t("form.duracion")}</FieldLabel>
          <Input
            id="clase-duracion"
            type="number"
            inputMode="numeric"
            min={LIMITES_CLASE.duracionMin}
            max={LIMITES_CLASE.duracionMax}
            value={b.duracionSeg}
            aria-invalid={malo("duracionSeg")}
            className="tabular-nums"
            onChange={(e) => pon("duracionSeg", Number(e.target.value))}
          />
          {error("duracionSeg") && <FieldError>{error("duracionSeg")}</FieldError>}
        </Field>

        <Field>
          <FieldLabel htmlFor="clase-nivel">{t("form.nivel")}</FieldLabel>
          <Select value={b.nivel} onValueChange={(v) => pon("nivel", v as Nivel)}>
            <SelectTrigger id="clase-nivel">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {NIVELES.map((n) => (
                <SelectItem key={n} value={n}>
                  {t(`niveles.${n}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel htmlFor="clase-estado">{t("form.estado")}</FieldLabel>
          <Select value={b.estado} onValueChange={(v) => pon("estado", v as EstadoClase)}>
            <SelectTrigger id="clase-estado">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ESTADOS_CLASE.map((e) => (
                <SelectItem key={e} value={e}>
                  {t(`estados.${e}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <FieldSet data-invalid={malo("temas")}>
        <FieldLegend variant="label">{t("form.temas")}</FieldLegend>
        <FieldDescription>{t("form.temasHint")}</FieldDescription>
        <ToggleGroup
          type="multiple"
          variant="outline"
          spacing={2}
          value={b.temas}
          onValueChange={(v) => pon("temas", v as Vertical[])}
          className="flex-wrap"
        >
          {VERTICALES.map((v) => (
            <ToggleGroupItem key={v} value={v} data-sound="tap" className={MARCADO}>
              {tax(`verticales.${v}`)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        {error("temas") && <FieldError>{error("temas")}</FieldError>}
      </FieldSet>

      <FieldSet>
        <FieldLegend variant="label">{t("form.redes")}</FieldLegend>
        <FieldDescription>{t("form.redesHint")}</FieldDescription>
        <ToggleGroup
          type="multiple"
          variant="outline"
          spacing={2}
          value={b.redes}
          onValueChange={(v) => pon("redes", v as SocialId[])}
          className="flex-wrap"
        >
          {SOCIAL_IDS.map((r) => (
            <ToggleGroupItem
              key={r}
              value={r}
              data-sound="tap"
              className={cn(MARCADO, "gap-2")}
            >
              <SocialGlyph network={r} tone="official" className={LOGO} aria-hidden />
              {SOCIAL_NETWORKS[r].name}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </FieldSet>

      <FieldSet data-invalid={malo("videoUrl")}>
        <FieldLegend variant="label">{t("form.video")}</FieldLegend>
        <FieldDescription>{t("form.videoHint")}</FieldDescription>
        <UploadDropzone
          accion="outline"
          items={subida.items}
          onFiles={subida.add}
          onUrl={(url) => pon("videoUrl", url)}
          onPause={subida.pause}
          onResume={subida.resume}
          onRetry={subida.retry}
          onRemove={subida.remove}
        />
        {b.videoUrl.trim() && (
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <Link2 className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="min-w-0 break-all">{b.videoUrl}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => pon("videoUrl", "")}
            >
              {t("form.quitarVideo")}
            </Button>
          </p>
        )}
        {subidoSinEnlace && (
          <p className="rounded-lg bg-muted px-3 py-2 text-sm text-pretty text-muted-foreground">
            {t("form.sinAlmacenamiento")}
          </p>
        )}
        {error("videoUrl") && <FieldError>{error("videoUrl")}</FieldError>}
      </FieldSet>

      <Field data-invalid={malo("portadaUrl")}>
        <FieldLabel htmlFor="clase-portada">{t("form.portada")}</FieldLabel>
        <Input
          id="clase-portada"
          inputMode="url"
          placeholder="https://"
          value={b.portadaUrl}
          aria-invalid={malo("portadaUrl")}
          className="max-w-md"
          onChange={(e) => pon("portadaUrl", e.target.value)}
        />
        {error("portadaUrl") && <FieldError>{error("portadaUrl")}</FieldError>}
      </Field>

      <Field>
        <FieldLabel htmlFor="clase-plan">{t("form.plan")}</FieldLabel>
        <Select
          value={b.planMinimo}
          onValueChange={(v) => pon("planMinimo", v as PricingPlanId)}
        >
          <SelectTrigger id="clase-plan" className="max-w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PLAN_IDS.map((id) => (
              <SelectItem key={id} value={id}>
                {nombrePlan(id)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldDescription>{t("form.planHint")}</FieldDescription>
        {b.planMinimo !== "free" && (
          <Badge variant="secondary" className="w-fit">
            {t("kpis.paidFootnote")}
          </Badge>
        )}
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
