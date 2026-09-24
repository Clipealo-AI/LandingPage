"use client"

import * as React from "react"
import { useMessages, useTranslations } from "next-intl"

import { useRouter } from "@/i18n/navigation"
import {
  PLATAFORMAS_DIRECTO,
  PLATAFORMA_LABEL,
  type PlataformaDirecto,
} from "@/lib/ajustes"
import type { Cuenta } from "@/lib/onboarding"
import { SOCIAL_IDS, SOCIAL_NETWORKS, type SocialId } from "@/lib/social"
import { esId } from "@/lib/taxonomia"
import type { AspectRatioKey } from "@/lib/types"
import { toast } from "@/lib/toast"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useCuenta } from "@/hooks/use-cuenta"
import { useFormat } from "@/hooks/use-format"
import { useResumableUpload } from "@/hooks/use-resumable-upload"
import { useCrearTrabajo } from "@/hooks/use-jobs"
import {
  FacebookIcon,
  KickIcon,
  TikTokIcon,
  TwitchIcon,
  YouTubeIcon,
  type SocialIconProps,
} from "@/components/brand/social-icons"
import { AspectSwitcher } from "@/components/video/aspect-switcher"
import { UploadDropzone } from "@/components/video/upload-dropzone"

/** Idiomas de audio que reconoce el proceso; el orden es el del selector. */
export const IDIOMAS_AUDIO = ["auto", "es", "en", "pt", "fr"] as const
export type IdiomaAudio = (typeof IDIOMAS_AUDIO)[number]

/**
 * Evento de ventana cuando terminan todas las subidas de la cola. Es el
 * enganche del perfilado progresivo (§6.5): tras la primera subida, la
 * micropregunta de directo (`creador.plataformasDirecto`, `frecuencia`) e
 * `interesCampanaPropia`. El panel también marca `data-subida-completada`.
 */
export const EVENTO_SUBIDA_COMPLETADA = "clipealo:subida-completada"
export interface DetalleSubidaCompletada {
  /** Archivos que terminaron en esta tanda. */
  archivos: number
}

/** Lo que `/subir` trae elegido desde la cuenta (onboarding «mis videos» y redes). */
export interface PreseleccionSubida {
  /** Plataforma de la que importa: la del enlace del canal o la primera donde transmite. */
  fuente: PlataformaDirecto | null
  /** Todas las plataformas declaradas, con la fuente primero. */
  plataformas: PlataformaDirecto[]
  /** Formato que premia su primera red de publicación. */
  aspecto: AspectRatioKey | null
  redes: SocialId[]
  /** Primer idioma de sus clips que reconoce el proceso. */
  idioma: IdiomaAudio | null
}

/**
 * Preselección de `/subir` (§6.2, §8.5): fuente desde `creador.enlaceCanal` y
 * `creador.plataformasDirecto` («No hago directos» no cuenta), formato desde la
 * primera red de `clipero.redes` e idioma desde `idiomas`. Pura: la cuenta la
 * pone quien llama.
 */
export function preseleccionSubida(
  c: Pick<Cuenta, "idiomas" | "clipero" | "creador">
): PreseleccionSubida {
  const declaradas = (c.creador.plataformasDirecto ?? []).filter(
    (p): p is PlataformaDirecto => esId(PLATAFORMAS_DIRECTO, p)
  )
  const delEnlace = c.creador.enlaceCanal?.plataforma
  const plataformas = delEnlace
    ? [delEnlace, ...declaradas.filter((p) => p !== delEnlace)]
    : declaradas
  const redes = (c.clipero.redes ?? []).filter((r): r is SocialId => esId(SOCIAL_IDS, r))
  const idioma = c.idiomas.find((i) => esId(IDIOMAS_AUDIO, i))
  return {
    fuente: plataformas[0] ?? null,
    plataformas,
    aspecto: redes.length ? SOCIAL_NETWORKS[redes[0]].aspects[0] : null,
    redes,
    idioma: idioma && esId(IDIOMAS_AUDIO, idioma) ? idioma : null,
  }
}

const HOSTS: Record<PlataformaDirecto, RegExp> = {
  twitch: /(^|\.)twitch\.tv$/,
  youtube: /(^|\.)(youtube\.com|youtu\.be)$/,
  kick: /(^|\.)kick\.com$/,
  tiktok: /(^|\.)tiktok\.com$/,
  facebook: /(^|\.)(facebook\.com|fb\.watch)$/,
}

/** Plataforma de un enlace pegado (canal, VOD o clip), por su dominio. `null` si no es de ninguna. */
export function plataformaDeEnlace(texto: string): PlataformaDirecto | null {
  const t = texto.trim()
  if (!t || /\s/.test(t)) return null
  let host: string
  try {
    host = new URL(/^https?:\/\//i.test(t) ? t : `https://${t}`).hostname.toLowerCase()
  } catch {
    return null
  }
  return PLATAFORMAS_DIRECTO.find((p) => HOSTS[p].test(host)) ?? null
}

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

/**
 * ¿Viajan a esta zona los textos de «mis videos» (`onboarding.creador.subir`)?
 * Sin ellos, `/subir` se queda como siempre: la importación genérica.
 */
function useTextosSubida(): boolean {
  const mensajes = useMessages() as unknown as {
    onboarding?: { creador?: { subir?: unknown } }
  }
  return Boolean(mensajes.onboarding?.creador?.subir)
}

export function UploadPanel() {
  const t = useTranslations("app.uploadPanel")
  const f = useFormat()
  const router = useRouter()
  const { cuenta } = useCuenta()
  const hayTextos = useTextosSubida()
  const pre = React.useMemo(() => preseleccionSubida(cuenta), [cuenta])

  // Lo elegido aquí manda; hasta entonces, lo que trae la cuenta (se lee del
  // almacén: en el servidor y al hidratar es la cuenta demo, sin desajustes)
  const [aspectElegido, setAspect] = React.useState<AspectRatioKey | null>(null)
  const [languageElegido, setLanguage] = React.useState<string | null>(null)
  const [fuenteElegida, setFuente] = React.useState<PlataformaDirecto | null>(null)
  const aspect = aspectElegido ?? pre.aspecto ?? "9:16"
  const language = languageElegido ?? pre.idioma ?? "es"
  const fuente = hayTextos ? (fuenteElegida ?? pre.fuente) : null

  const [captions, setCaptions] = React.useState(true)
  const [faceTracking, setFaceTracking] = React.useState(true)
  const [clipLength, setClipLength] = React.useState([45])
  const [subidaCompletada, setSubidaCompletada] = React.useState(false)

  const onAllCompleted = React.useCallback(
    (items: { length: number }) => {
      setSubidaCompletada(true)
      window.dispatchEvent(
        new CustomEvent<DetalleSubidaCompletada>(EVENTO_SUBIDA_COMPLETADA, {
          detail: { archivos: items.length },
        })
      )
      toast.celebrate(t("done"), {
        description: t("doneDescription"),
        action: { label: t("viewStatus"), onClick: () => router.push("/proyectos") },
      })
    },
    [router, t]
  )

  // El transporte por defecto es simulado. Para producción se cambia por
  // tus-js-client o multipart de S3 pasando `transport` aquí: ni este panel ni
  // `UploadDropzone` se enteran.
  const upload = useResumableUpload({ onAllCompleted })
  const crear = useCrearTrabajo()
  const enlaceEnCola = (url: string) => toast(t("linkQueued"), { description: url })

  return (
    <div className="space-y-6" data-subida-completada={subidaCompletada || undefined}>
      {fuente && (
        <ImportarDesde
          fuente={fuente}
          plataformas={pre.plataformas}
          onFuente={setFuente}
          onUrl={enlaceEnCola}
        />
      )}

      <UploadDropzone
        items={upload.items}
        onFiles={upload.add}
        onPause={upload.pause}
        onResume={upload.resume}
        onRetry={upload.retry}
        onRemove={upload.remove}
        // Con la fuente preseleccionada el enlace va arriba: un solo campo de enlace
        onUrl={fuente ? undefined : enlaceEnCola}
      />

      {/*
        Enganche del perfilado progresivo (§6.5, agente Progresivo): tras la
        primera subida terminada (`subidaCompletada` o EVENTO_SUBIDA_COMPLETADA)
        va aquí la micropregunta de directo + `interesCampanaPropia`, en una
        tarjeta bajo la cola. Nunca durante la subida.
      */}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("settingsTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>{t("format")}</Label>
            <AspectSwitcher value={aspect} onValueChange={setAspect} />
            {hayTextos && !aspectElegido && pre.aspecto && (
              <FormatoElegido redes={pre.redes} />
            )}
            <p className="text-xs text-muted-foreground">{t("formatHint")}</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <Label htmlFor="duracion">{t("duration")}</Label>
              <span className="text-sm font-semibold tabular-nums">
                {clipLength[0]} s
              </span>
            </div>
            <Slider
              id="duracion"
              value={clipLength}
              onValueChange={setClipLength}
              min={15}
              max={120}
              step={5}
            />
            <p className="text-xs text-muted-foreground">{t("durationHint")}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="idioma">{t("audioLanguage")}</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger id="idioma" className="w-full sm:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {IDIOMAS_AUDIO.map((id) => (
                  <SelectItem key={id} value={id}>
                    {t(`languages.${id}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <fieldset className="space-y-4 border-t pt-5">
            <legend className="sr-only">{t("options")}</legend>

            <ToggleRow
              id="subtitulos"
              label={t("captions")}
              hint={t("captionsHint")}
              checked={captions}
              onCheckedChange={setCaptions}
            />
            <ToggleRow
              id="seguimiento"
              label={t("faceTracking")}
              hint={t("faceTrackingHint")}
              checked={faceTracking}
              onCheckedChange={setFaceTracking}
            />
          </fieldset>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        {upload.isUploading && (
          <p className="mr-auto text-xs text-muted-foreground tabular-nums">
            {t("uploading", {
              count: upload.items.length,
              progress: f.percent(Math.round(upload.totalProgress)),
            })}
          </p>
        )}
        <Button variant="ghost" size="lg" onClick={() => router.back()}>
          {t("cancel")}
        </Button>
        {/* La acción central del producto pasa por la costura: `createJob`
            da de alta un trabajo por archivo y el proyecto aparece en la lista.
            El día que haya servidor, cambia el cuerpo de esa función y aquí no
            se toca nada */}
        <Button
          variant="brand"
          size="lg"
          disabled={upload.items.length === 0 || upload.isUploading || crear.isPending}
          onClick={async () => {
            const listos = upload.items.filter((i) => i.status === "completado")
            for (const archivo of listos) {
              await crear.mutateAsync({
                title: archivo.name,
                sizeBytes: archivo.size,
                sourceUrl: archivo.url,
              })
            }
            toast.success(t("saved", { count: listos.length }), {
              description: t("savedDescription", {
                aspect,
                seconds: clipLength[0],
                captions: captions ? "yes" : "no",
              }),
            })
            router.push("/proyectos")
          }}
        >
          {t("process", { count: upload.items.length })}
        </Button>
      </div>
    </div>
  )
}

/**
 * Importación desde la plataforma donde transmite (§6.2): «Pega el enlace de tu
 * VOD de {plataforma}», con su logo. Con varias plataformas declaradas se
 * cambia arriba; pegar un enlace de otra la elige sola.
 */
function ImportarDesde({
  fuente,
  plataformas,
  onFuente,
  onUrl,
}: {
  fuente: PlataformaDirecto
  plataformas: readonly PlataformaDirecto[]
  onFuente: (p: PlataformaDirecto) => void
  onUrl: (url: string) => void
}) {
  const t = useTranslations("onboarding.creador.subir.fuente")
  const tu = useTranslations("common.video.upload")
  const [url, setUrl] = React.useState("")
  const opciones = plataformas.includes(fuente) ? plataformas : [fuente, ...plataformas]
  const Icono = ICONO_PLATAFORMA[fuente]
  const nombre = PLATAFORMA_LABEL[fuente]

  return (
    <form
      data-fuente={fuente}
      onSubmit={(e) => {
        e.preventDefault()
        const limpio = url.trim()
        if (!limpio) return
        onUrl(limpio)
        setUrl("")
      }}
      className="space-y-3"
    >
      {opciones.length > 1 && (
        <ToggleGroup
          type="single"
          variant="outline"
          spacing={1}
          value={fuente}
          onValueChange={(v) => {
            if (esId(PLATAFORMAS_DIRECTO, v)) onFuente(v)
          }}
          aria-label={t("plataformas")}
          className="flex-wrap"
        >
          {opciones.map((p) => {
            const IconoOpcion = ICONO_PLATAFORMA[p]
            return (
              <ToggleGroupItem
                key={p}
                value={p}
                data-button=""
                className="h-9 gap-2 px-3"
              >
                <IconoOpcion tone="official" aria-hidden className="size-4" />
                {PLATAFORMA_LABEL[p]}
              </ToggleGroupItem>
            )
          })}
        </ToggleGroup>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <InputGroup className="h-10 flex-1">
          <InputGroupAddon>
            <Icono tone="official" aria-hidden className="size-4" />
          </InputGroupAddon>
          <InputGroupInput
            className="h-full"
            type="url"
            inputMode="url"
            autoComplete="url"
            autoCapitalize="off"
            spellCheck={false}
            value={url}
            placeholder={t("placeholder", { plataforma: nombre })}
            aria-label={t("label", { plataforma: nombre })}
            onChange={(e) => {
              setUrl(e.target.value)
              const deEnlace = plataformaDeEnlace(e.target.value)
              if (deEnlace && deEnlace !== fuente) onFuente(deEnlace)
            }}
          />
        </InputGroup>
        <Button type="submit" variant="outline" size="lg" disabled={!url.trim()}>
          {tu("import")}
        </Button>
      </div>
    </form>
  )
}

/** «Elegido para TikTok e Instagram.»: el formato viene de sus redes. */
function FormatoElegido({ redes }: { redes: readonly SocialId[] }) {
  const t = useTranslations("onboarding.creador.subir")
  const f = useFormat()
  return (
    <p data-formato-preseleccionado="" className="text-xs text-muted-foreground">
      {t("formato", { redes: f.list(redes.map((r) => SOCIAL_NETWORKS[r].name)) })}
    </p>
  )
}

function ToggleRow({
  id,
  label,
  hint,
  checked,
  onCheckedChange,
}: {
  id: string
  label: string
  hint: string
  checked: boolean
  onCheckedChange: (value: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-0.5">
        <Label htmlFor={id}>{label}</Label>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}
