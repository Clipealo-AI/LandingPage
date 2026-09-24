"use client"

import * as React from "react"
import { Layers, Plus, Upload, X } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { Link, useRouter } from "@/i18n/navigation"
import { LOCALE_TAG } from "@/i18n/routing"
import { formatTimecode } from "@/lib/format"
import { toast } from "@/lib/toast"
import type { AspectRatioKey, SourceVideo } from "@/lib/types"
import { PLAN_MINIMO } from "@/lib/pricing"
import {
  DURACIONES_VARIANTE,
  ESTILOS_SUBTITULO,
  FORMATOS_VARIANTE,
  IDIOMAS_SUBTITULO,
  LIMITES_VARIANTES,
  PLAN_VARIANTES_NUEVO,
  combinarVariantes,
  duracionVariante,
  ganchosPropuestos,
  hayBloqueoVariantes,
  puedeUsarHerramienta,
  tituloOperado,
  validarVariantes,
  type EstiloSubtitulo,
  type IdiomaSubtitulo,
  type PlanVariantes,
} from "@/lib/operaciones"
import { useFormat } from "@/hooks/use-format"
import { useCrearTrabajo, useJobs } from "@/hooks/use-jobs"
import { usePlan } from "@/hooks/use-plan"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldContent,
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
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { AvisoPlan } from "@/components/planes/aviso-plan"
import { useNombrePlan } from "@/components/planes/nombre-plan"

/** El estado marcado, escrito en el borde y el fondo, como en el resto. */
const MARCADO =
  "transition-colors data-[state=on]:border-primary data-[state=on]:bg-accent"
const ID_AVISO_PLAN = "variantes-plan"

/**
 * De un clip, varias versiones que son contenido distinto: otro gancho, otra
 * duración, otro formato, otros subtítulos, otra portada. Cada combinación es
 * un trabajo más de la cola (`lib/api/jobs.ts`) y sale en Proyectos con su
 * etiqueta. Es «diez videos» sin disfrazar ninguno: lo que cambia es lo que se
 * ve, y las plataformas lo tratan como piezas distintas porque lo son.
 *
 * La lista de abajo enseña exactamente lo que se va a encargar antes de
 * encargarlo: con doce trabajos de golpe nadie debería llevarse sorpresas.
 */
export function VariantesPanel({ iniciales }: { iniciales: SourceVideo[] }) {
  const t = useTranslations("app.operaciones.variantes")
  const tOps = useTranslations("app.operaciones")
  const tSub = useTranslations("common.video.subtitulos")
  const f = useFormat()
  const locale = useLocale()
  const router = useRouter()
  const { plan: planCuenta } = usePlan()
  const nombrePlan = useNombrePlan()
  const { data: proyectos } = useJobs(iniciales)
  const crear = useCrearTrabajo()

  const listos = proyectos.filter((p) => p.status === "listo" && !p.operacion)
  const [videoId, setVideoId] = React.useState<string>(listos[0]?.id ?? "")
  const [plan, setPlan] = React.useState<PlanVariantes>(() =>
    PLAN_VARIANTES_NUEVO(listos[0]?.duration ?? 0)
  )
  const [intento, setIntento] = React.useState(false)
  const [encargando, setEncargando] = React.useState(false)

  const video = listos.find((p) => p.id === videoId) ?? null
  const duracion = video?.duration ?? null
  const puede = puedeUsarHerramienta(planCuenta, "variantes")

  // El idioma de los subtítulos se nombra en el de la interfaz
  const nombreIdioma = React.useMemo(() => {
    const tag = LOCALE_TAG[locale]
    const nombres = new Intl.DisplayNames([tag], { type: "language" })
    return (codigo: IdiomaSubtitulo) => {
      const nombre = nombres.of(codigo) ?? codigo
      return nombre.charAt(0).toLocaleUpperCase(tag) + nombre.slice(1)
    }
  }, [locale])

  const variantes = duracion === null ? [] : combinarVariantes(plan, duracion)
  const avisos = validarVariantes(plan, duracion)
  const bloquea = hayBloqueoVariantes(avisos)
  const frases = avisos.map((a) =>
    t(`errors.${a.code}`, { min: a.values?.min ?? 0, max: a.values?.max ?? 0 })
  )

  const pon = <K extends keyof PlanVariantes>(campo: K, valor: PlanVariantes[K]) =>
    setPlan((p) => ({ ...p, [campo]: valor }))

  const elegirVideo = (id: string) => {
    setVideoId(id)
    const v = listos.find((p) => p.id === id)
    // Los ganchos se reparten sobre el video nuevo; lo demás se conserva
    pon("ganchos", ganchosPropuestos(v?.duration ?? 0, 3))
  }

  const encargar = async (e: React.FormEvent) => {
    e.preventDefault()
    setIntento(true)
    if (bloquea || !video || !puede || duracion === null) return
    setEncargando(true)
    try {
      for (const [indice, variante] of variantes.entries()) {
        const parametros = {
          operacion: "variante" as const,
          variante,
          indice,
          total: variantes.length,
        }
        const segundos = duracionVariante(variante, duracion)
        await crear.mutateAsync({
          title: tituloOperado(video.title, parametros),
          duration: segundos,
          // Proporcional al tramo: es lo que se sabe antes de procesar
          sizeBytes: Math.round((video.sizeBytes * segundos) / Math.max(duracion, 1)),
          language: variante.idioma,
          sourceUrl: video.src,
          operacion: parametros,
        })
      }
      toast.success(t("encargado"), { description: t("encargadoHint") })
      router.push("/proyectos")
    } finally {
      setEncargando(false)
    }
  }

  if (listos.length === 0)
    return (
      <div className="space-y-4 rounded-xl bg-card p-6 ring-1 ring-border">
        <p className="text-sm text-pretty text-muted-foreground">{tOps("sinVideos")}</p>
        <Button variant="outline" asChild>
          <Link href="/subir">
            <Upload /> {tOps("subir")}
          </Link>
        </Button>
      </div>
    )

  return (
    <form onSubmit={encargar} noValidate className="space-y-6">
      <Field>
        <FieldLabel htmlFor="variantes-video">{tOps("video")}</FieldLabel>
        <Select value={videoId} onValueChange={elegirVideo}>
          <SelectTrigger id="variantes-video" className="h-10 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {listos.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.title} · {formatTimecode(p.duration)} · {f.bytes(p.sizeBytes)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldDescription>{tOps("videoHint")}</FieldDescription>
      </Field>

      <FieldSet>
        <FieldLegend variant="label">{t("ganchos")}</FieldLegend>
        <FieldDescription>
          {t("ganchosHint", { max: LIMITES_VARIANTES.ganchosMax })}
        </FieldDescription>
        <ul className="grid gap-2 @lg/operaciones:grid-cols-2">
          {plan.ganchos.map((g, i) => (
            <li key={i} className="flex items-center gap-2">
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                max={Math.max(0, Math.floor(duracion ?? 0) - 1)}
                className="tabular-nums"
                value={g}
                aria-label={t("gancho", { n: i + 1 })}
                onChange={(e) =>
                  pon(
                    "ganchos",
                    plan.ganchos.map((x, j) => (j === i ? Number(e.target.value) : x))
                  )
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={plan.ganchos.length <= 1}
                aria-label={t("quitarGancho", { n: i + 1 })}
                onClick={() =>
                  pon(
                    "ganchos",
                    plan.ganchos.filter((_, j) => j !== i)
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
          disabled={plan.ganchos.length >= LIMITES_VARIANTES.ganchosMax}
          onClick={() =>
            pon("ganchos", [
              ...plan.ganchos,
              ganchosPropuestos(duracion ?? 0, 4)[plan.ganchos.length] ??
                Math.floor((duracion ?? 0) / 2),
            ])
          }
        >
          <Plus /> {t("anadirGancho")}
        </Button>
      </FieldSet>

      <div className="grid gap-6 @lg/operaciones:grid-cols-2">
        <FieldSet>
          <FieldLegend variant="label">{t("duraciones")}</FieldLegend>
          <ToggleGroup
            type="multiple"
            variant="outline"
            spacing={2}
            value={plan.duraciones.map(String)}
            onValueChange={(v) =>
              pon(
                "duraciones",
                DURACIONES_VARIANTE.filter((d) => v.includes(String(d)))
              )
            }
            className="flex-wrap"
          >
            {DURACIONES_VARIANTE.map((d) => (
              <ToggleGroupItem
                key={d}
                value={String(d)}
                data-sound="tap"
                className={`${MARCADO} tabular-nums`}
              >
                {t("duracion", { n: d })}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <FieldDescription>{t("duracionesHint")}</FieldDescription>
        </FieldSet>

        <FieldSet>
          <FieldLegend variant="label">{t("formatos")}</FieldLegend>
          <ToggleGroup
            type="multiple"
            variant="outline"
            spacing={2}
            value={plan.formatos}
            onValueChange={(v) =>
              pon(
                "formatos",
                FORMATOS_VARIANTE.filter((x) => (v as AspectRatioKey[]).includes(x))
              )
            }
            className="flex-wrap"
          >
            {FORMATOS_VARIANTE.map((x) => (
              <ToggleGroupItem
                key={x}
                value={x}
                data-sound="tap"
                className={`${MARCADO} tabular-nums`}
              >
                {x}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <FieldDescription>{t("formatosHint")}</FieldDescription>
        </FieldSet>

        <FieldSet>
          <FieldLegend variant="label">{t("subtitulos")}</FieldLegend>
          <ToggleGroup
            type="multiple"
            variant="outline"
            spacing={2}
            value={plan.subtitulos}
            onValueChange={(v) =>
              pon(
                "subtitulos",
                ESTILOS_SUBTITULO.filter((x) => (v as EstiloSubtitulo[]).includes(x))
              )
            }
            className="flex-wrap"
          >
            {ESTILOS_SUBTITULO.map((x) => (
              <ToggleGroupItem key={x} value={x} data-sound="tap" className={MARCADO}>
                {tSub(x)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <FieldDescription>{t("subtitulosHint")}</FieldDescription>
        </FieldSet>

        <div className="space-y-4">
          <Field>
            <FieldLabel htmlFor="variantes-idioma">{t("idioma")}</FieldLabel>
            <Select
              value={plan.idioma}
              onValueChange={(v) => pon("idioma", v as IdiomaSubtitulo)}
            >
              <SelectTrigger id="variantes-idioma" className="w-full max-w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {IDIOMAS_SUBTITULO.map((i) => (
                  <SelectItem key={i} value={i}>
                    {nombreIdioma(i)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel htmlFor="variantes-portada">{t("portadaEnGancho")}</FieldLabel>
              <FieldDescription>{t("portadaHint")}</FieldDescription>
            </FieldContent>
            <Switch
              id="variantes-portada"
              checked={plan.portadaEnGancho}
              onCheckedChange={(v) => pon("portadaEnGancho", v)}
            />
          </Field>
        </div>
      </div>

      <section
        aria-labelledby="variantes-lista"
        className="space-y-3 rounded-xl bg-card p-4 ring-1 ring-border"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="variantes-lista" className="text-sm font-semibold">
            {t("lista")}
          </h2>
          <Badge
            variant={variantes.length > LIMITES_VARIANTES.max ? "warning" : "secondary"}
          >
            {t("total", { n: variantes.length })}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {t("totalHint", { max: LIMITES_VARIANTES.max })}
        </p>
        {variantes.length > 0 && (
          <ol className="grid gap-1.5 text-sm tabular-nums @lg/operaciones:grid-cols-2">
            {variantes.slice(0, LIMITES_VARIANTES.max).map((v, i) => (
              <li key={i} className="flex gap-2">
                <span className="w-8 shrink-0 text-muted-foreground">
                  {t("variante", { n: i + 1 })}
                </span>
                <span>
                  {t("resumen", {
                    gancho: formatTimecode(v.gancho),
                    duracion: duracionVariante(v, duracion ?? 0),
                    formato: v.formato,
                    subtitulos: tSub(v.subtitulos),
                  })}
                </span>
              </li>
            ))}
          </ol>
        )}
        {intento && frases.map((frase) => <FieldError key={frase}>{frase}</FieldError>)}
      </section>

      <div className="flex flex-col items-start gap-2">
        <Button
          type="submit"
          variant="brand"
          size="lg"
          disabled={!puede || encargando}
          aria-describedby={puede ? undefined : ID_AVISO_PLAN}
        >
          <Layers />{" "}
          {t("encargar", { n: Math.min(variantes.length, LIMITES_VARIANTES.max) || 1 })}
        </Button>
        {!puede && (
          <AvisoPlan
            id={ID_AVISO_PLAN}
            motivo={t("bloqueado", { plan: nombrePlan(PLAN_MINIMO.operaciones) })}
          />
        )}
      </div>
    </form>
  )
}
