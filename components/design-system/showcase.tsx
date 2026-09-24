"use client"

import * as React from "react"
import {
  ArrowRight,
  Download,
  Play,
  RotateCcw,
  Scissors,
  Send,
  Sparkles,
  Upload,
} from "lucide-react"
import { useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"
import { useFormat } from "@/hooks/use-format"
import type { AspectRatioKey, ClipRange } from "@/lib/types"
import { buildWaveform, clips, sourceVideos, transcript, speakers } from "@/lib/mock-data"
import { Isotipo, Logo, CropFrame } from "@/components/brand/logo"
import { PatternIsotipos, PatternLineas, GridBackdrop } from "@/components/brand/patterns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AspectSwitcher } from "@/components/video/aspect-switcher"
import { ClipCard } from "@/components/video/clip-card"
import { MediaFrame } from "@/components/video/media-frame"
import { ProcessingStatus } from "@/components/video/processing-status"
import { ScoreBadge } from "@/components/video/score-badge"
import { Timeline } from "@/components/video/timeline"
import { TranscriptPanel } from "@/components/video/transcript-panel"
import { TrimRange } from "@/components/video/trim-range"
import { UploadDropzone } from "@/components/video/upload-dropzone"
import { VideoPlayer } from "@/components/video/video-player"
import { Waveform } from "@/components/video/waveform"
import { StatCard } from "@/components/shared/stat-card"
import { TypeWords } from "@/components/shared/type-words"
import {
  DsBlock,
  DsCanvas,
  DsSection,
  Swatch,
} from "@/components/design-system/primitives"
import { ContrastRow } from "@/components/design-system/contrast-row"

const SCALES = ["ink", "blue", "brand"] as const
const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const

/** Anclas de las secciones; sus nombres, en `designSystem.nav`. */
const NAV = [
  "color",
  "tipografia",
  "forma",
  "marca",
  "controles",
  "video",
  "datos",
  "accesibilidad",
] as const

const peaks = buildWaveform(96, 5, [0.2, 0.48, 0.76])

/** `<code>` de los mensajes con `t.rich`. */
const code = (chunks: React.ReactNode) => <code>{chunks}</code>

export function DesignSystemShowcase() {
  const t = useTranslations("designSystem")
  const f = useFormat()
  const [aspect, setAspect] = React.useState<AspectRatioKey>("9:16")
  const [range, setRange] = React.useState<ClipRange>({ start: 120, end: 168 })
  const [time, setTime] = React.useState(640)

  return (
    <div className="pb-24">
      {/* Portada */}
      <header className="relative overflow-hidden bg-ink-950 pt-32 pb-16">
        <PatternIsotipos opacity={0.14} fade="bottom" />
        <div className="relative container-page">
          <p className="text-sm font-semibold tracking-wide text-brand uppercase">
            {t("hero.eyebrow")}
          </p>
          <h1 className="mt-3 max-w-3xl display text-[clamp(2.25rem,6vw,4rem)] text-ink-50">
            {t("hero.title")}
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-pretty text-mist/75">
            {t("hero.lead")}
          </p>
          <nav aria-label={t("hero.navLabel")} className="mt-8 flex flex-wrap gap-2">
            {NAV.map((id) => (
              <a
                key={id}
                href={`#${id}`}
                className="rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white transition-colors hover:bg-white/20"
              >
                {t(`nav.${id}`)}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <div className="container-page space-y-16 pt-16">
        {/* ---------------------------------------------------------------- */}
        <DsSection id="color" title={t("color.title")} intro={t("color.intro")}>
          {SCALES.map((scale) => (
            <DsBlock key={scale} title={t(`color.scales.${scale}`)}>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-11">
                {STEPS.map((step) => (
                  <Swatch
                    key={step}
                    token={`--color-${scale}-${step}`}
                    name={`${scale}-${step}`}
                  />
                ))}
              </div>
            </DsBlock>
          ))}

          <DsBlock title={t("color.semantic.title")} rule={t("color.semantic.rule")}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              <Swatch token="--background" name="background" />
              <Swatch token="--card" name="card" />
              <Swatch token="--muted" name="muted" />
              <Swatch
                token="--primary"
                name="primary"
                note={t("color.semantic.primary")}
              />
              <Swatch token="--brand" name="brand" note={t("color.semantic.brand")} />
              <Swatch token="--stage" name="stage" note={t("color.semantic.stage")} />
            </div>
          </DsBlock>

          <DsBlock title={t("color.orange.title")} rule={t("color.orange.rule")}>
            <div className="grid gap-3 sm:grid-cols-2">
              <DsCanvas>
                <Badge variant="success" className="mb-3">
                  {t("color.orange.correct")}
                </Badge>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="brand">{t("color.orange.upload")}</Button>
                  <Button variant="outline">{t("color.orange.viewClips")}</Button>
                  <Button variant="ghost">{t("color.orange.cancel")}</Button>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  {t("color.orange.correctNote")}
                </p>
              </DsCanvas>

              <DsCanvas>
                <Badge variant="destructive" className="mb-3">
                  {t("color.orange.incorrect")}
                </Badge>
                <div className="flex flex-wrap items-center gap-2 opacity-70">
                  <Button variant="brand">{t("color.orange.uploadShort")}</Button>
                  <Button variant="brand">{t("color.orange.viewClips")}</Button>
                  <Button variant="brand">{t("color.orange.export")}</Button>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  {t("color.orange.incorrectNote")}
                </p>
              </DsCanvas>
            </div>
          </DsBlock>
        </DsSection>

        {/* ---------------------------------------------------------------- */}
        <DsSection
          id="tipografia"
          title={t("typography.title")}
          intro={t("typography.intro")}
        >
          <DsCanvas className="space-y-6">
            <div>
              <p className="mb-2 font-mono text-[10px] text-muted-foreground">
                .display · clamp(2.5rem, 8.5vw, 5.5rem)
              </p>
              <p className="display text-[clamp(2rem,6vw,3.5rem)]">
                {t("typography.display1")}
              </p>
            </div>
            <div>
              <p className="mb-2 font-mono text-[10px] text-muted-foreground">
                .display · clamp(2rem, 5vw, 3.25rem)
              </p>
              <p className="display text-[clamp(1.5rem,4vw,2.25rem)]">
                {t("typography.display2")}
              </p>
            </div>
            <div className="border-t pt-6">
              <p className="mb-2 font-mono text-[10px] text-muted-foreground">
                DM Sans bold · 23px / tracking-tight
              </p>
              <p className="text-[23px] leading-tight font-bold tracking-tight">
                {t("typography.subtitle")}
              </p>
            </div>
            <div>
              <p className="mb-2 font-mono text-[10px] text-muted-foreground">
                DM Sans · 16px / leading-relaxed
              </p>
              <p className="max-w-prose leading-relaxed">{t("typography.body")}</p>
            </div>
            <div className="border-t pt-6">
              <p className="mb-2 font-mono text-[10px] text-muted-foreground">
                {t("typography.tabular")} · data-slot=&quot;timecode&quot;
              </p>
              <p data-slot="timecode" className="font-mono text-2xl">
                01:12:04.320
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("typography.tabularNote")}
              </p>
            </div>
          </DsCanvas>
        </DsSection>

        {/* ---------------------------------------------------------------- */}
        <DsSection id="forma" title={t("shape.title")} intro={t("shape.intro")}>
          <div className="grid gap-8 md:grid-cols-2">
            <DsBlock title={t("shape.radii")}>
              <div className="flex flex-wrap items-end gap-4">
                {[
                  ["sm", "rounded-sm"],
                  ["md", "rounded-md"],
                  ["lg (base)", "rounded-lg"],
                  ["xl", "rounded-xl"],
                  ["2xl", "rounded-2xl"],
                  ["frame", "rounded-frame"],
                ].map(([name, cls]) => (
                  <div key={name} className="text-center">
                    <div className={`size-16 bg-secondary ${cls}`} />
                    <p className="mt-1.5 text-[10px] text-muted-foreground">{name}</p>
                  </div>
                ))}
              </div>
            </DsBlock>

            <DsBlock title={t("shape.shadows")}>
              <div className="flex flex-wrap items-end gap-4">
                {[
                  ["xs", "shadow-xs"],
                  ["sm", "shadow-sm"],
                  ["md", "shadow-md"],
                  ["lg", "shadow-lg"],
                  ["xl", "shadow-xl"],
                ].map(([name, cls]) => (
                  <div key={name} className="text-center">
                    <div className={`size-16 rounded-xl bg-card ${cls}`} />
                    <p className="mt-1.5 text-[10px] text-muted-foreground">{name}</p>
                  </div>
                ))}
              </div>
            </DsBlock>
          </div>
        </DsSection>

        {/* ---------------------------------------------------------------- */}
        <DsSection id="marca" title={t("brand.title")} intro={t("brand.intro")}>
          <div className="grid gap-3 sm:grid-cols-3">
            <DsCanvas className="flex flex-col items-center justify-center gap-4 py-10">
              <Isotipo className="size-16 text-foreground" />
              <p className="text-xs text-muted-foreground">{t("brand.isotype")}</p>
            </DsCanvas>
            <DsCanvas
              dark
              className="flex flex-col items-center justify-center gap-4 py-10"
            >
              <Isotipo className="size-16 text-white" />
              <p className="text-xs text-stage-muted">{t("brand.isotypeDark")}</p>
            </DsCanvas>
            <DsCanvas className="flex flex-col items-center justify-center gap-4 bg-brand py-10">
              <Isotipo tone="mono" className="size-16 text-brand-foreground" />
              <p className="text-xs text-brand-foreground/70">{t("brand.mono")}</p>
            </DsCanvas>
          </div>

          <DsBlock title={t("brand.logotype")}>
            <DsCanvas className="flex flex-wrap items-end gap-8">
              <Logo size="sm" />
              <Logo size="md" />
              <Logo size="lg" />
              <Logo iconOnly size="lg" />
            </DsCanvas>
          </DsBlock>

          <DsBlock title={t("brand.cropMark.title")} rule={t("brand.cropMark.rule")}>
            <DsCanvas className="flex flex-wrap items-center gap-10">
              {(["sm", "md", "lg"] as const).map((size) => (
                <CropFrame key={size} size={size}>
                  <div className="grid size-28 place-items-center rounded-lg bg-secondary text-xs">
                    {size}
                  </div>
                </CropFrame>
              ))}
            </DsCanvas>
          </DsBlock>

          <DsBlock title={t("brand.patterns")}>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="relative h-36 overflow-hidden rounded-xl bg-ink-950">
                <PatternIsotipos opacity={0.25} />
                <span className="absolute bottom-3 left-3 text-xs text-mist">
                  pattern-isotipos
                </span>
              </div>
              <div className="relative h-36 overflow-hidden rounded-xl bg-brand">
                <PatternLineas />
                <span className="absolute bottom-3 left-3 text-xs text-brand-foreground">
                  pattern-lineas
                </span>
              </div>
              <div className="relative h-36 overflow-hidden rounded-xl bg-card ring-1 ring-border">
                <GridBackdrop />
                <span className="absolute bottom-3 left-3 text-xs text-muted-foreground">
                  pattern-grid
                </span>
              </div>
            </div>
          </DsBlock>
        </DsSection>

        {/* ---------------------------------------------------------------- */}
        <DsSection id="controles" title={t("controls.title")} intro={t("controls.intro")}>
          <DsBlock title={t("controls.buttons.title")}>
            <DsCanvas className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="brand">Brand</Button>
                <Button>Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="link">Link</Button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="brand" size="xs">
                  xs
                </Button>
                <Button variant="brand" size="sm">
                  sm
                </Button>
                <Button variant="brand">default</Button>
                <Button variant="brand" size="lg">
                  lg
                </Button>
                <Button variant="brand" size="xl">
                  xl · marketing
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="brand">
                  <Upload /> {t("controls.buttons.withIcon")}
                </Button>
                <Button variant="outline">
                  {t("controls.buttons.next")} <ArrowRight />
                </Button>
                <Button variant="brand" size="icon">
                  <Scissors />
                </Button>
                <Button disabled>{t("controls.buttons.disabled")}</Button>
              </div>
            </DsCanvas>
          </DsBlock>

          <DsBlock title={t("controls.badges.title")}>
            <DsCanvas className="flex flex-wrap items-center gap-2">
              <Badge variant="brand">Brand</Badge>
              <Badge variant="brand-subtle">
                <Sparkles /> {t("controls.badges.moment")}
              </Badge>
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="success">{t("controls.badges.published")}</Badge>
              <Badge variant="warning">{t("controls.badges.queued")}</Badge>
              <Badge variant="destructive">{t("controls.badges.error")}</Badge>
            </DsCanvas>
          </DsBlock>

          <DsBlock title={t("controls.form.title")}>
            <DsCanvas className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ds-titulo">{t("controls.form.clipTitle")}</Label>
                {/* Título de un clip de demo: contenido de usuario, no se traduce */}
                <Input id="ds-titulo" defaultValue={clips[0].title} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ds-formato">{t("controls.form.format")}</Label>
                <Select defaultValue="9:16">
                  <SelectTrigger id="ds-formato" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="9:16">
                      9:16 · {t("controls.form.vertical")}
                    </SelectItem>
                    <SelectItem value="1:1">1:1 · {t("controls.form.square")}</SelectItem>
                    <SelectItem value="16:9">
                      16:9 · {t("controls.form.horizontal")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="ds-desc">{t("controls.form.description")}</Label>
                <Textarea
                  id="ds-desc"
                  rows={3}
                  placeholder={t("controls.form.descriptionPlaceholder")}
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox id="ds-check" defaultChecked />
                  <Label htmlFor="ds-check">{t("controls.form.burnCaptions")}</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="ds-switch" defaultChecked />
                  <Label htmlFor="ds-switch">{t("controls.form.faceTracking")}</Label>
                </div>
              </div>
              <RadioGroup defaultValue="auto" className="space-y-2">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="auto" id="ds-r1" />
                  <Label htmlFor="ds-r1">{t("controls.form.autoCuts")}</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="manual" id="ds-r2" />
                  <Label htmlFor="ds-r2">{t("controls.form.manualCuts")}</Label>
                </div>
              </RadioGroup>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="ds-slider">{t("controls.form.targetDuration")}</Label>
                <Slider id="ds-slider" defaultValue={[45]} min={15} max={120} step={5} />
              </div>
            </DsCanvas>
          </DsBlock>

          <DsBlock title={t("controls.feedback.title")}>
            <div className="grid gap-3 md:grid-cols-2">
              <Alert>
                <Sparkles />
                <AlertTitle>{t("controls.feedback.alertTitle")}</AlertTitle>
                <AlertDescription>{t("controls.feedback.alertText")}</AlertDescription>
              </Alert>
              <DsCanvas className="space-y-3">
                <Progress value={68} />
                <div className="flex gap-2">
                  <Skeleton className="size-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              </DsCanvas>
            </div>
          </DsBlock>
        </DsSection>

        {/* ---------------------------------------------------------------- */}
        <DsSection id="video" title={t("video.title")} intro={t("video.intro")}>
          <DsBlock title={t("video.player.title")} rule={t("video.player.rule")}>
            <VideoPlayer
              aspect="16:9"
              title="Podcast #42"
              clipRange={{ start: 12, end: 48 }}
            />
          </DsBlock>

          <div className="grid gap-8 lg:grid-cols-2">
            <DsBlock title={t("video.output")}>
              <DsCanvas>
                <AspectSwitcher value={aspect} onValueChange={setAspect} />
                <div className="mt-6 max-w-[180px]">
                  <MediaFrame aspect={aspect} />
                </div>
              </DsCanvas>
            </DsBlock>

            <DsBlock title={t("video.score")}>
              <DsCanvas className="space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                  <ScoreBadge score={94} />
                  <ScoreBadge score={78} />
                  <ScoreBadge score={61} />
                </div>
                <div className="flex items-end gap-4">
                  <div className="w-28">
                    <MediaFrame aspect="16:9" duration={4812} />
                  </div>
                  <CropFrame size="sm" className="w-20">
                    <MediaFrame aspect="9:16" duration={48} />
                  </CropFrame>
                </div>
              </DsCanvas>
            </DsBlock>
          </div>

          <DsBlock title={t("video.waveform.title")} rule={t("video.waveform.rule")}>
            <DsCanvas className="space-y-6">
              <Waveform
                peaks={peaks}
                progress={0.46}
                selection={{ start: 0.3, end: 0.52 }}
              />
              <TrimRange
                value={range}
                duration={sourceVideos[0].duration}
                onChange={setRange}
                minLength={5}
              >
                <div className="absolute inset-0 flex items-center px-1">
                  <Waveform peaks={peaks} progress={0.3} height={44} />
                </div>
              </TrimRange>
            </DsCanvas>
          </DsBlock>

          <DsBlock title={t("video.timeline.title")}>
            <Timeline
              tracks={[
                {
                  id: "t1",
                  kind: "video",
                  label: t("video.timeline.video"),
                  items: [{ id: "v1", start: 0, end: 4812, label: "Master 1080p" }],
                },
                {
                  id: "t2",
                  kind: "clips",
                  label: t("video.timeline.clips"),
                  items: clips.map((c) => ({
                    id: c.id,
                    start: c.range.start,
                    end: c.range.end,
                    label: c.title,
                  })),
                },
              ]}
              duration={4812}
              currentTime={time}
              selectedId="clip_01"
              onSeek={setTime}
            />
          </DsBlock>

          <DsBlock title={t("video.processing")}>
            <DsCanvas className="space-y-6">
              <ProcessingStatus
                stage="analizando"
                status="procesando"
                progress={62}
                variant="detail"
              />
              <div className="flex flex-wrap gap-6 border-t pt-5">
                <ProcessingStatus stage="recortando" status="procesando" progress={40} />
                <ProcessingStatus stage="listo" status="listo" progress={100} />
                <ProcessingStatus stage="transcribiendo" status="error" progress={34} />
              </div>
            </DsCanvas>
          </DsBlock>

          <div className="grid gap-8 lg:grid-cols-2">
            <DsBlock title={t("video.upload")}>
              <UploadDropzone />
            </DsBlock>

            <DsBlock title={t("video.transcript")}>
              <div className="h-96 rounded-xl bg-card ring-1 ring-border">
                <TranscriptPanel
                  cues={transcript}
                  speakers={speakers}
                  currentTime={time}
                  onSeek={setTime}
                  className="h-full"
                />
              </div>
            </DsBlock>
          </div>

          <DsBlock title={t("video.clipCard")}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {clips.slice(0, 4).map((clip) => (
                <ClipCard key={clip.id} clip={clip} />
              ))}
            </div>
          </DsBlock>
        </DsSection>

        {/* ---------------------------------------------------------------- */}
        <DsSection id="datos" title={t("data.title")} intro={t("data.intro")}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              featured
              label={t("data.stats.plays")}
              value={f.compact(218_000)}
              delta={24}
            />
            <StatCard label={t("data.stats.published")} value={f.number(12)} delta={12} />
            <StatCard
              label={t("data.stats.retention")}
              value={f.percent(64)}
              delta={-3}
            />
            <StatCard
              label={t("data.stats.minutes")}
              value={f.number(412)}
              hint={t("data.stats.minutesOf", { total: f.number(600) })}
            />
          </div>

          <DsBlock title={t("data.categorical.title")} rule={t("data.categorical.rule")}>
            <div className="grid grid-cols-5 gap-2 sm:max-w-md">
              {[1, 2, 3, 4, 5].map((n) => (
                <Swatch key={n} token={`--chart-${n}`} name={`chart-${n}`} />
              ))}
            </div>
          </DsBlock>
        </DsSection>

        {/* ---------------------------------------------------------------- */}
        <DsSection id="accesibilidad" title={t("a11y.title")} intro={t("a11y.intro")}>
          <DsCanvas>
            <ContrastRow
              label={t("a11y.pair", { fg: "foreground", bg: "background" })}
              fg="--foreground"
              bg="--background"
              ratio={15.81}
            />
            <ContrastRow
              label={t("a11y.pair", { fg: "muted-foreground", bg: "background" })}
              fg="--muted-foreground"
              bg="--background"
              ratio={5.51}
            />
            <ContrastRow
              label={t("a11y.pair", { fg: "primary-foreground", bg: "primary" })}
              fg="--primary-foreground"
              bg="--primary"
              ratio={5.92}
              sample={t("a11y.samples.button")}
            />
            <ContrastRow
              label={t("a11y.pair", { fg: "brand-foreground", bg: "brand" })}
              fg="--brand-foreground"
              bg="--brand"
              ratio={6.12}
              sample={t("a11y.samples.cta")}
            />
            <ContrastRow
              label={t("a11y.focusRingPair", { bg: "background" })}
              fg="--ring"
              bg="--background"
              ratio={3.98}
              sample={t("a11y.samples.focus")}
            />
          </DsCanvas>

          <BrandForegroundDecision />

          <Tabs defaultValue="teclado">
            <TabsList>
              <TabsTrigger value="teclado">{t("a11y.tabs.keyboard")}</TabsTrigger>
              <TabsTrigger value="movimiento">{t("a11y.tabs.motion")}</TabsTrigger>
              <TabsTrigger value="lectores">{t("a11y.tabs.readers")}</TabsTrigger>
            </TabsList>
            <TabsContent
              value="teclado"
              className="mt-4 space-y-2 text-sm text-muted-foreground"
            >
              <p>· {t("a11y.keyboard.operable")}</p>
              <p>· {t("a11y.keyboard.focus")}</p>
              <p>· {t("a11y.keyboard.palette")}</p>
            </TabsContent>
            <TabsContent
              value="movimiento"
              className="mt-4 space-y-2 text-sm text-muted-foreground"
            >
              <p>· {t("a11y.motion.auto")}</p>
              <p>· {t.rich("a11y.motion.reduced", { code })}</p>
              <p>· {t("a11y.motion.gestures")}</p>
              <p>· {t("a11y.motion.sounds")}</p>
              <MotionDemo />
            </TabsContent>
            <TabsContent
              value="lectores"
              className="mt-4 space-y-2 text-sm text-muted-foreground"
            >
              <p>· {t.rich("a11y.readers.progress", { code })}</p>
              <p>· {t.rich("a11y.readers.sliders", { code })}</p>
              <p>· {t("a11y.readers.charts")}</p>
            </TabsContent>
          </Tabs>
        </DsSection>

        <div className="flex flex-wrap gap-3 border-t pt-12">
          <Button variant="brand" size="xl" asChild>
            <Link href="/subir">
              <Upload /> {t("cta.tryProduct")}
            </Link>
          </Button>
          <Button variant="outline" size="xl" asChild>
            <Link href="/dashboard">
              <Send /> {t("cta.viewApp")}
            </Link>
          </Button>
          <Button variant="ghost" size="xl" asChild>
            <Link href="/">
              <Download /> {t("cta.backToLanding")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

/**
 * Una sección de la landing en pequeño, con las piezas de movimiento de verdad
 * (`app/motion/*.css`, AGENTS.md reglas 5 a 8): dos grupos que entran cada uno a
 * su ritmo, el titular cortado a 12 fps (E5), la acción principal que apunta
 * antes de disparar y los iconos que avanzan (E4, solo con ratón) y la cita
 * palabra a palabra al terminar la entrada de su tarjeta (E10).
 *
 * - Los grupos nacen en «play»: aquí no hay observador y la pestaña ya se ve al
 *   abrirla, así que la demo corre al montarse (en la landing lo decide
 *   `lib/motion.ts`). Es un atributo fijo: ningún render lo reescribe.
 * - «Repetir» relanza las mismas animaciones de CSS con la Web Animations API
 *   (`cancel()` + `play()`), sin remontar nada ni tocar el estado. No suena: no
 *   es la acción principal.
 * - Con «reducir movimiento» se ve como en la landing: todo funde en su sitio.
 */
function MotionDemo() {
  const t = useTranslations("designSystem.a11y.motion.demo")
  const escena = React.useRef<HTMLDivElement>(null)

  const repetir = () => {
    const animaciones = escena.current?.getAnimations({ subtree: true }) ?? []
    for (const animacion of animaciones) {
      // Una transición a medias (el hover de un botón) no es parte de la demo
      if (typeof CSSTransition !== "undefined" && animacion instanceof CSSTransition) {
        continue
      }
      animacion.cancel()
      animacion.play()
    }
  }

  return (
    <DsCanvas className="mt-6 text-foreground">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold tracking-tight">{t("title")}</h3>
          <p className="mt-1 max-w-2xl text-xs text-muted-foreground">{t("rule")}</p>
        </div>
        <Button variant="outline" size="sm" onClick={repetir}>
          <RotateCcw /> {t("replay")}
        </Button>
      </div>

      <div ref={escena} className="@container mt-8">
        <div className="grid items-center gap-8 @3xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          {/* Grupo 1 · cabecera de sección: antetítulo, titular y entradilla
              escalonados (i 0, 1, 2) y la fila de acciones detrás (i 3) */}
          <div data-motion-state="play">
            <p className="mb-3 font-mono text-[10px] text-muted-foreground">
              .m-anim · .m-rise · .m-cut
            </p>
            <p className="m-anim m-rise text-sm font-semibold tracking-wide text-brand uppercase">
              {t("eyebrow")}
            </p>
            <p className="m-anim m-cut mt-3 display text-[clamp(1.75rem,4vw,2.75rem)] [--i:1]">
              {t("headline")}
            </p>
            <p className="m-anim m-rise mt-4 max-w-lg text-pretty text-muted-foreground [--i:2]">
              {t("lead")}
            </p>
            <div className="m-anim m-rise mt-6 flex flex-wrap gap-3 [--i:3]">
              <Button variant="brand" size="xl">
                {t("primary")} <ArrowRight className="m-nudge" />
              </Button>
              <Button variant="outline" size="xl">
                <Play className="m-nudge fill-current" /> {t("secondary")}
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{t("hover")}</p>
          </div>

          {/* Grupo 2 · tarjeta: entra 80 ms después (i 1) y la cita empieza al
              terminar su entrada (`--m-fin-entrada`, app/motion/features.css) */}
          <div
            data-motion-state="play"
            className="m-anim m-rise m-tarjeta rounded-frame bg-secondary p-6 text-secondary-foreground [--i:1] sm:p-8"
          >
            <span aria-hidden className="display text-5xl leading-none opacity-80">
              &ldquo;
            </span>
            <p className="mt-2 text-[23px] leading-snug font-bold tracking-tight text-balance">
              <TypeWords text={t("quote")} at="var(--m-fin-entrada, 250ms)" />
            </p>
            <p className="mt-4 font-mono text-[10px] opacity-70">
              .m-tarjeta · TypeWords · .m-word
            </p>
          </div>
        </div>
      </div>
    </DsCanvas>
  )
}

/**
 * La única decisión donde el sistema se separa del diseño original.
 *
 * Se deja comparable en vivo —no descrita— porque la tiene que cerrar quien
 * lleve la marca, y para eso hace falta verla aplicada, no leer dos ratios.
 */
function BrandForegroundDecision() {
  const t = useTranslations("designSystem.decision")
  const [blanco, setBlanco] = React.useState(false)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("title")}</CardTitle>
        <CardDescription>
          {t.rich("description", { code, b: (chunks) => <strong>{chunks}</strong> })}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="flex items-center gap-3">
          <Switch
            id="brand-fg"
            checked={blanco}
            onCheckedChange={setBlanco}
            aria-label={t("switchLabel")}
          />
          <Label htmlFor="brand-fg" className="text-sm">
            {t("whiteText")}
          </Label>
          <Badge variant={blanco ? "warning" : "success"} className="ml-auto">
            {blanco ? t("fails") : t("passes")}
          </Badge>
        </div>

        <div
          className="flex flex-col items-center gap-4 rounded-frame bg-brand p-8 [--ring:var(--color-ink-950)]"
          style={
            blanco ? { ["--brand-foreground" as string]: "oklch(1 0 0)" } : undefined
          }
        >
          <p className="text-center display text-3xl text-brand-foreground">
            {t("sampleTitle")}
          </p>
          <Button className="bg-ink-950 text-ink-50 hover:bg-ink-900" size="xl">
            <Upload /> {t("upload")}
          </Button>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge className="bg-brand-foreground text-brand">{t("tag")}</Badge>
            <span className="text-sm text-brand-foreground/80">{t("secondary")}</span>
          </div>
        </div>

        <div className="rounded-lg bg-muted p-3">
          <p className="mb-2 text-xs text-muted-foreground">
            {t.rich("fixNote", { code })}
          </p>
          <pre className="overflow-x-auto font-mono text-xs">
            <code>{`:root {
  --brand-foreground: oklch(1 0 0);
}`}</code>
          </pre>
        </div>
      </CardContent>
    </Card>
  )
}
