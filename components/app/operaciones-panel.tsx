"use client"

import * as React from "react"
import { Scissors, Upload } from "lucide-react"
import { useTranslations } from "next-intl"

import { Link, useRouter } from "@/i18n/navigation"
import { formatTimecode } from "@/lib/format"
import { toast } from "@/lib/toast"
import type { SourceVideo } from "@/lib/types"
import { PLAN_MINIMO } from "@/lib/pricing"
import {
  CALIDADES,
  duracionRecortada,
  hayBloqueoOperacion,
  puedeUsarHerramienta,
  tamanoAprox,
  tituloOperado,
  validarOperacion,
  type Calidad,
  type OperacionId,
  type ParametrosOperacion,
} from "@/lib/operaciones"
import { useFormat } from "@/hooks/use-format"
import { useCrearTrabajo, useJobs } from "@/hooks/use-jobs"
import { usePlan } from "@/hooks/use-plan"
import { Button } from "@/components/ui/button"
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { AvisoPlan } from "@/components/planes/aviso-plan"
import { useNombrePlan } from "@/components/planes/nombre-plan"

/** El estado marcado, escrito en el borde y el fondo, como en el resto. */
const MARCADO =
  "transition-colors data-[state=on]:border-primary data-[state=on]:bg-accent"
const ID_AVISO_PLAN = "operaciones-plan"

/**
 * Recortar un tramo o reducir el tamaño de uno de los proyectos, sin pasar por
 * el análisis. Cada herramienta es su página (`operacion` fijo); el molde es
 * el mismo: el video, lo que se le hace y «Encargar».
 *
 * Es una herramienta del clipero, no un servicio del equipo: el encargo entra
 * en la cola de `lib/api/jobs.ts` como un trabajo más, con su progreso y su
 * reintento ya hechos, y aparece en Proyectos. El plan manda con el mismo
 * molde que el resto de puertas: apagado con el motivo escrito, nunca escondido.
 *
 * Lo que se dice antes de encargar («quedan 0:45», «pesaría unos 120 MB») es
 * aritmética sobre lo que ya se sabe del video; la cifra real la da el procesado.
 */
export function OperacionesPanel({
  iniciales,
  operacion,
}: {
  iniciales: SourceVideo[]
  operacion: OperacionId
}) {
  const t = useTranslations("app.operaciones")
  const tv = useTranslations("common.video.operacion")
  const f = useFormat()
  const router = useRouter()
  const { plan } = usePlan()
  const nombrePlan = useNombrePlan()
  const { data: proyectos } = useJobs(iniciales)
  const crear = useCrearTrabajo()

  // Solo lo que ya está listo: una operación sobre un video a medio procesar
  // no tiene nada sobre lo que actuar
  const listos = proyectos.filter((p) => p.status === "listo" && !p.operacion)
  const [videoId, setVideoId] = React.useState<string>(listos[0]?.id ?? "")
  const [inicio, setInicio] = React.useState(0)
  const [fin, setFin] = React.useState(listos[0]?.duration ?? 0)
  const [calidad, setCalidad] = React.useState<Calidad>("equilibrada")
  const [intento, setIntento] = React.useState(false)

  const video = listos.find((p) => p.id === videoId) ?? null
  const puede = puedeUsarHerramienta(plan, operacion)

  const parametros: ParametrosOperacion =
    operacion === "recortar"
      ? { operacion, recorte: { inicio, fin } }
      : { operacion, calidad }
  const avisos = validarOperacion(parametros, video?.duration ?? null)
  const bloquea = hayBloqueoOperacion(avisos)
  const frase = (code: (typeof avisos)[number]["code"]) => {
    const a = avisos.find((x) => x.code === code)
    return a
      ? t(`errors.${a.code}`, { min: a.values?.min ?? 0, max: a.values?.max ?? 0 })
      : null
  }

  const elegirVideo = (id: string) => {
    setVideoId(id)
    const v = listos.find((p) => p.id === id)
    // El recorte nace abarcando el video entero: se acota desde ahí
    setInicio(0)
    setFin(v?.duration ?? 0)
  }

  const encargar = async (e: React.FormEvent) => {
    e.preventDefault()
    setIntento(true)
    if (bloquea || !video || !puede) return
    await crear.mutateAsync({
      title: tituloOperado(video.title, parametros),
      // Se estrecha por el discriminante, no con `!`: la unión ya sabe cuál es
      duration:
        parametros.operacion === "recortar"
          ? duracionRecortada(parametros.recorte)
          : video.duration,
      sizeBytes:
        operacion === "reducir" ? tamanoAprox(video.sizeBytes, calidad) : video.sizeBytes,
      language: video.language,
      sourceUrl: video.src,
      operacion: parametros,
    })
    toast.success(t("encargado"), { description: t("encargadoHint") })
    router.push("/proyectos")
  }

  if (listos.length === 0)
    return (
      <div className="space-y-4 rounded-xl bg-card p-6 ring-1 ring-border">
        <p className="text-sm text-pretty text-muted-foreground">{t("sinVideos")}</p>
        <Button variant="outline" asChild>
          <Link href="/subir">
            <Upload /> {t("subir")}
          </Link>
        </Button>
      </div>
    )

  return (
    <form onSubmit={encargar} noValidate className="space-y-6">
      <Field>
        <FieldLabel htmlFor="operacion-video">{t("video")}</FieldLabel>
        <Select value={videoId} onValueChange={elegirVideo}>
          <SelectTrigger id="operacion-video" className="h-10 w-full">
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
        <FieldDescription>{t("videoHint")}</FieldDescription>
      </Field>

      {operacion === "recortar" ? (
        <FieldSet data-invalid={(intento && bloquea) || undefined}>
          <div className="grid gap-4 @lg/operaciones:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="recorte-inicio">{t("recortar.inicio")}</FieldLabel>
              <Input
                id="recorte-inicio"
                type="number"
                inputMode="numeric"
                min={0}
                max={video?.duration ?? 0}
                className="tabular-nums"
                value={inicio}
                onChange={(e) => setInicio(Number(e.target.value))}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="recorte-fin">{t("recortar.fin")}</FieldLabel>
              <Input
                id="recorte-fin"
                type="number"
                inputMode="numeric"
                min={0}
                max={video?.duration ?? 0}
                className="tabular-nums"
                value={fin}
                onChange={(e) => setFin(Number(e.target.value))}
              />
            </Field>
          </div>
          {video && !bloquea && (
            <FieldDescription className="tabular-nums">
              {t("recortar.resultado", {
                duracion: formatTimecode(duracionRecortada({ inicio, fin })),
                total: formatTimecode(video.duration),
              })}
            </FieldDescription>
          )}
          {intento &&
            (["recorteInvertido", "recorteCorto", "recorteFuera"] as const).map((c) =>
              frase(c) ? <FieldError key={c}>{frase(c)}</FieldError> : null
            )}
        </FieldSet>
      ) : (
        <FieldSet>
          <FieldLegend variant="label">{t("reducir.calidad")}</FieldLegend>
          <ToggleGroup
            type="single"
            variant="outline"
            spacing={2}
            value={calidad}
            onValueChange={(v) => v && setCalidad(v as Calidad)}
            className="flex-wrap"
          >
            {CALIDADES.map((c) => (
              <ToggleGroupItem key={c} value={c} data-sound="tap" className={MARCADO}>
                {tv(`calidad.${c}`)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          {video && (
            <FieldDescription className="tabular-nums">
              {t("reducir.tamano", {
                aprox: f.bytes(tamanoAprox(video.sizeBytes, calidad)),
                total: f.bytes(video.sizeBytes),
              })}
            </FieldDescription>
          )}
        </FieldSet>
      )}

      <div className="flex flex-col items-start gap-2">
        <Button
          type="submit"
          variant="brand"
          size="lg"
          disabled={!puede || crear.isPending}
          aria-describedby={puede ? undefined : ID_AVISO_PLAN}
        >
          <Scissors /> {t("encargar")}
        </Button>
        {!puede && (
          <AvisoPlan
            id={ID_AVISO_PLAN}
            motivo={t(`${operacion}.bloqueado`, {
              plan: nombrePlan(PLAN_MINIMO.operaciones),
            })}
          />
        )}
      </div>
    </form>
  )
}
