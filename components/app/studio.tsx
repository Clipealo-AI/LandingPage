"use client"

import * as React from "react"
import { useQueryState } from "nuqs"
import { CalendarClock, Download, Send, Sparkles, Wand2 } from "lucide-react"
import { useTranslations } from "next-intl"

import { useRouter } from "@/i18n/navigation"
import { clamp, formatTimecode } from "@/lib/format"
import {
  ASPECT_RATIOS,
  type AspectRatioKey,
  type Clip,
  type ClipRange,
  type SourceVideo,
} from "@/lib/types"
import { buildWaveform, speakers, timelineTracks, transcript } from "@/lib/mock-data"
import { toast } from "@/lib/toast"
import { PLAN_MINIMO, puedeProgramar } from "@/lib/pricing"
import { usePlan } from "@/hooks/use-plan"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AspectSwitcher } from "@/components/video/aspect-switcher"
import { ClipCard } from "@/components/video/clip-card"
import { Timeline } from "@/components/video/timeline"
import { TranscriptPanel } from "@/components/video/transcript-panel"
import { TrimRange } from "@/components/video/trim-range"
import { VideoPlayer } from "@/components/video/video-player"
import { Waveform } from "@/components/video/waveform"
import { PublicarDialog } from "@/components/app/publicar-dialog"
import { AvisoPlan } from "@/components/planes/aviso-plan"
import { useNombrePlan } from "@/components/planes/nombre-plan"

export interface StudioProps {
  video: SourceVideo
  clips: Clip[]
}

/**
 * Estudio de edicion.
 *
 * Un solo estado de tiempo compartido: el reproductor, la linea de tiempo, la
 * onda y la transcripcion leen y escriben `currentTime`. Cualquier panel puede
 * mover el cabezal y los demas se sincronizan solos.
 */
/** El motivo cuelga del botón apagado por `aria-describedby`. */
const ID_AVISO_PLAN = "studio-programar-plan"

export function Studio({ video, clips }: StudioProps) {
  const t = useTranslations("app.studio")
  const router = useRouter()
  const { plan } = usePlan()
  const nombrePlan = useNombrePlan()
  const puedeProgramarlo = puedeProgramar(plan)
  const [clipId, setClipId] = useQueryState("clip")
  const selected = clips.find((c) => c.id === clipId) ?? clips[0]

  const [currentTime, setCurrentTime] = React.useState(selected?.range.start ?? 0)
  const [aspect, setAspect] = React.useState<AspectRatioKey>(selected?.aspect ?? "9:16")
  const [range, setRange] = React.useState<ClipRange>(
    selected?.range ?? { start: 0, end: 60 }
  )
  const [title, setTitle] = React.useState(selected?.title ?? "")

  // Al cambiar de clip se recarga el estado editable del panel. Se ajusta
  // durante el render (patron "adjusting state when props change") en vez de en
  // un efecto: asi no hay un render intermedio con los datos del clip anterior.
  const [loadedClipId, setLoadedClipId] = React.useState(selected?.id)
  if (selected && selected.id !== loadedClipId) {
    setLoadedClipId(selected.id)
    setRange(selected.range)
    setTitle(selected.title)
    setAspect(selected.aspect)
    setCurrentTime(selected.range.start)
  }

  // La ventana se fija al elegir clip: recalcularla al arrastrar haria saltar la escala
  const view = React.useMemo(() => {
    const base = selected?.range ?? { start: 0, end: 60 }
    const pad = Math.max(20, (base.end - base.start) * 0.6)
    return {
      start: Math.max(0, base.start - pad),
      end: Math.min(video.duration, base.end + pad),
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id, video.duration])

  const span = Math.max(view.end - view.start, 1)
  /** Posicion 0-1 dentro de la ventana, no del video entero. */
  const inView = (seconds: number) => clamp((seconds - view.start) / span, 0, 1)

  // La onda del recorte se genera a la resolucion de la ventana, no se corta de
  // la del video entero: 50 s de un podcast de 80 min darian cuatro barras.
  // La semilla sale del inicio de la ventana, asi que es estable por clip.
  const viewPeaks = React.useMemo(
    () => buildWaveform(140, Math.round(view.start), [0.16, 0.41, 0.66, 0.89]),
    [view.start]
  )

  const selectClip = (id: string) => void setClipId(id)

  /**
   * Programar lleva al Calendario con los clips recién detectados, para
   * repartirlos por los días que vienen. Publicar no navega: elige cuentas y
   * sale desde aquí.
   */
  const idsClips = clips.map((c) => c.id).join(",")
  const consultaCalendario = idsClips ? { crear: "1", clips: idsClips } : { crear: "1" }

  /**
   * Al elegir un clip en la linea de tiempo, el foco se mueve a su tarjeta del
   * panel. Sin esto, con teclado seleccionas un clip y sigues en la linea de
   * tiempo: el contenido cambia en un sitio donde no estas mirando.
   */
  const selectedCardRef = React.useRef<HTMLElement>(null)
  const moverFoco = React.useRef(false)

  const selectFromTimeline = (id: string) => {
    moverFoco.current = true
    selectClip(id)
  }

  React.useEffect(() => {
    if (!moverFoco.current) return
    moverFoco.current = false
    selectedCardRef.current?.focus()
    selectedCardRef.current?.scrollIntoView({ block: "nearest" })
  }, [selected?.id])

  const ratio = ASPECT_RATIOS[aspect].ratio

  // El nombre de cada pista depende de su tipo, no del dato: así sale en el idioma activo
  const tracks = React.useMemo(
    () => timelineTracks.map((track) => ({ ...track, label: t(`tracks.${track.kind}`) })),
    [t]
  )

  return (
    /**
     * El estudio no es un artículo: es un editor. Ocupa todo el ancho del shell
     * y toda la altura disponible, y no hace scroll de página. Por debajo de xl
     * vuelve a fluir en vertical, que es lo único que funciona en un móvil.
     */
    <div className="flex container-fluid flex-col gap-3 py-3 xl:h-[calc(100svh-var(--spacing-topbar)-1rem)] xl:overflow-hidden xl:py-4">
      {/* Cabecera del editor */}
      <div className="flex shrink-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold tracking-tight">{video.title}</h1>
          <p className="text-xs text-muted-foreground">
            {formatTimecode(video.duration)} · {t("detected", { count: clips.length })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <AspectSwitcher value={aspect} onValueChange={setAspect} size="sm" />
          <Button
            variant="outline"
            size="lg"
            onClick={() => toast(t("preparingDownload"), { sound: "tap" })}
          >
            <Download /> {t("download")}
          </Button>
          {/* Con un plan que no programa, el Calendario entero es la puerta:
              celebrar y navegar allí dejaba al usuario descubriendo el muro por
              su cuenta. Se apaga con el motivo escrito, como «Solicitar entrar».
              Publicar ahora no tiene puerta: es de todos los planes */}
          <div className="flex flex-col items-end gap-1">
            <Button
              variant="outline"
              size="lg"
              disabled={!puedeProgramarlo}
              aria-describedby={puedeProgramarlo ? undefined : ID_AVISO_PLAN}
              onClick={() => {
                toast(t("sentToPublish"), { description: t("sentToPublishHint") })
                router.push({ pathname: "/calendario", query: consultaCalendario })
              }}
            >
              <CalendarClock /> {t("schedule")}
            </Button>
            {!puedeProgramarlo && (
              <AvisoPlan
                id={ID_AVISO_PLAN}
                alinear="end"
                motivo={t("publishBlocked", { plan: nombrePlan(PLAN_MINIMO.programar) })}
              />
            )}
          </div>
          {selected && (
            <PublicarDialog clip={selected}>
              <Button variant="brand" size="lg">
                <Send /> {t("publish")}
              </Button>
            </PublicarDialog>
          )}
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        {selected ? t("selected", { title: selected.title }) : ""}
      </p>

      <div className="grid min-h-0 gap-3 xl:flex-1 xl:grid-cols-[minmax(0,1fr)_clamp(20rem,20vw,26rem)]">
        {/* Escenario */}
        <div className="flex min-h-0 min-w-0 flex-col gap-3">
          {/*
            El reproductor ocupa el hueco entero sin desbordar por ningún eje.
            `container-type: size` permite medir la celda en las dos direcciones
            y elegir el lado que manda; con un `max-width` en svh, como estaba,
            el alto real de la celda no entraba en la cuenta.
          */}
          <div className="[container-type:size] grid h-[46svh] min-h-0 place-items-center xl:h-auto xl:flex-1">
            <VideoPlayer
              aspect={aspect}
              title={selected?.title}
              clipRange={range}
              onTimeChange={setCurrentTime}
              style={{ width: `min(100cqw, calc(100cqh * ${ratio}))` }}
            />
          </div>

          {/* Recorte */}
          <section
            className="shrink-0 rounded-xl bg-card p-3 ring-1 ring-border"
            aria-label={t("trim")}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="text-xs font-medium">{t("trimTitle")}</h2>
              <Badge variant="brand-subtle">
                <Sparkles aria-hidden /> {t("aiProposed")}
              </Badge>
            </div>

            <TrimRange
              value={range}
              duration={video.duration}
              view={view}
              minLength={5}
              maxLength={180}
              onChange={setRange}
              onCommit={() => toast(t("trimUpdated"), { sound: "snip" })}
            >
              <div className="absolute inset-0 flex items-center px-1">
                <Waveform
                  peaks={viewPeaks}
                  progress={inView(currentTime)}
                  selection={{ start: inView(range.start), end: inView(range.end) }}
                  height={44}
                />
              </div>
            </TrimRange>
          </section>
        </div>

        {/* Panel lateral */}
        <Tabs defaultValue="clips" className="flex min-h-0 min-w-0 flex-col">
          <TabsList className="w-full shrink-0">
            <TabsTrigger value="clips" className="flex-1">
              {t("tabs.clips")}
            </TabsTrigger>
            <TabsTrigger value="transcripcion" className="flex-1">
              {t("tabs.transcript")}
            </TabsTrigger>
            <TabsTrigger value="ajustes" className="flex-1">
              {t("tabs.settings")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="clips" className="mt-3 min-h-0 xl:flex-1">
            <ScrollArea className="h-[28rem] xl:h-full">
              <ul className="space-y-3 pr-3">
                {clips.map((clip) => (
                  <li key={clip.id}>
                    <ClipCard
                      clip={clip}
                      dense
                      href={`?clip=${clip.id}`}
                      onPlay={() => selectClip(clip.id)}
                      // `tabIndex={-1}`: enfocable por programa, no con Tab
                      tabIndex={-1}
                      ref={clip.id === selected?.id ? selectedCardRef : undefined}
                      aria-current={clip.id === selected?.id ? "true" : undefined}
                      className={
                        clip.id === selected?.id
                          ? "ring-2 ring-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                          : undefined
                      }
                    />
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="transcripcion" className="mt-3 min-h-0 xl:flex-1">
            <div className="h-[28rem] rounded-xl bg-card ring-1 ring-border xl:h-full">
              <TranscriptPanel
                cues={transcript}
                speakers={speakers}
                currentTime={currentTime}
                onSeek={setCurrentTime}
                className="h-full"
              />
            </div>
          </TabsContent>

          <TabsContent
            value="ajustes"
            className="mt-3 min-h-0 space-y-5 overflow-y-auto xl:flex-1"
          >
            <div className="space-y-2">
              <Label htmlFor="titulo">{t("clipTitle")}</Label>
              <Input
                id="titulo"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={90}
              />
              <p className="text-xs text-muted-foreground tabular-nums">
                {t("titleCount", { count: title.length, max: 90 })}
              </p>
            </div>

            <div className="space-y-2">
              <Label>{t("hook")}</Label>
              <p className="rounded-lg bg-muted p-3 text-sm leading-relaxed text-muted-foreground">
                {selected?.hook}
              </p>
            </div>

            <div className="space-y-2">
              <Label>{t("tags")}</Label>
              <div className="flex flex-wrap gap-1.5">
                {selected?.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              size="lg"
              onClick={() => toast(t("searchingFraming"))}
            >
              <Wand2 /> {t("reframe")}
            </Button>
          </TabsContent>
        </Tabs>
      </div>

      {/*
        La línea de tiempo abarca todo el ancho, como en cualquier editor: es el
        mapa del video entero y cada píxel de ancho son segundos de precisión.
        Dentro de la columna del escenario perdía la mitad del recorrido.
      */}
      <Timeline
        tracks={tracks}
        duration={video.duration}
        currentTime={currentTime}
        selectedId={selected?.id}
        onSeek={setCurrentTime}
        onSelect={selectFromTimeline}
        // Alto de contenido, no fijo: una banda fija dejaba hueco muerto bajo
        // las pistas y le robaba ese alto al escenario, que es quien lo necesita.
        className="flex shrink-0 flex-col"
      />
    </div>
  )
}
