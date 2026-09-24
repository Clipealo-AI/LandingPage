"use client"

import * as React from "react"
import Image from "next/image"
import {
  ArrowDownToLine,
  ArrowUpRight,
  Captions,
  FileText,
  Maximize,
  MessageSquare,
  Pause,
  Play,
  Send,
  Smartphone,
  Sparkles,
  Type,
  Video,
  Volume2,
  VolumeX,
  X,
} from "lucide-react"
import { useTranslations } from "next-intl"

import peaks from "@/lib/marketing/rubius-waveform.json"
import {
  CLIPEALO_APP_URL,
  RUBIUS_CLIPS,
  RUBIUS_PREVIEW_CLIPS,
  RUBIUS_SOURCE,
  type RubiusClip,
} from "@/lib/marketing/rubius-demo"
import { usePauseOffscreenVideo } from "@/hooks/use-pause-offscreen-video"

const SOURCE_DURATION = RUBIUS_SOURCE.end - RUBIUS_SOURCE.start

const CLIP_COPY_KEYS = {
  patos: { description: "clipDescriptions.patos", reason: "clipReasons.patos" },
  teclado: { description: "clipDescriptions.teclado", reason: "clipReasons.teclado" },
  "indiana-jones": {
    description: "clipDescriptions.indiana-jones",
    reason: "clipReasons.indiana-jones",
  },
  puzle: { description: "clipDescriptions.puzle", reason: "clipReasons.puzle" },
  premios: { description: "clipDescriptions.premios", reason: "clipReasons.premios" },
  pokemon: { description: "clipDescriptions.pokemon", reason: "clipReasons.pokemon" },
} as const satisfies Record<RubiusClip["slug"], { description: string; reason: string }>

function formatTime(seconds: number) {
  const wholeSeconds = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(wholeSeconds / 60)
  const remainder = String(wholeSeconds % 60).padStart(2, "0")
  return `${minutes}:${remainder}`
}

export function RubiusPreview() {
  const t = useTranslations("marketing.hero")
  const videoRef = React.useRef<HTMLVideoElement>(null)
  usePauseOffscreenVideo(videoRef)

  const [time, setTime] = React.useState(0)
  const [playing, setPlaying] = React.useState(false)
  const [muted, setMuted] = React.useState(false)
  const [mediaError, setMediaError] = React.useState(false)
  const [selectedClip, setSelectedClip] = React.useState<RubiusClip | null>(null)

  const seek = (next: number) => {
    const player = videoRef.current
    if (!player) return
    const clamped = Math.min(Math.max(next, 0), SOURCE_DURATION)
    player.currentTime = clamped
    setTime(clamped)
  }

  const togglePlayback = async () => {
    const player = videoRef.current
    if (!player) return
    if (!player.paused) {
      player.pause()
      return
    }
    if (player.ended) seek(0)
    try {
      await player.play()
    } catch {
      setPlaying(false)
    }
  }

  const toggleSound = () => {
    const nextMuted = !muted
    if (videoRef.current) videoRef.current.muted = nextMuted
    setMuted(nextMuted)
  }

  const originTime = RUBIUS_SOURCE.start + time
  const activeClip = RUBIUS_PREVIEW_CLIPS.find(
    (clip) => originTime >= clip.start && originTime <= clip.end
  )

  const openClip = (clip: RubiusClip) => {
    videoRef.current?.pause()
    setSelectedClip(clip)
  }

  return (
    <>
      <section aria-label={t("videoPreview")} className="rubius-product-preview">
        <div className="rubius-product-shell">
          <div className="rubius-product-window">
            <section className="rubius-product-main" aria-label={t("videoPreview")}>
              <div className="rubius-product-video">
                <video
                  ref={videoRef}
                  src={RUBIUS_SOURCE.video}
                  poster={RUBIUS_SOURCE.poster}
                  preload="metadata"
                  muted={muted}
                  playsInline
                  aria-label={t("videoPreview")}
                  className="rubius-source-video"
                  onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
                  onSeeked={(event) => setTime(event.currentTarget.currentTime)}
                  onPlay={() => setPlaying(true)}
                  onPause={() => setPlaying(false)}
                  onEnded={() => setPlaying(false)}
                  onError={() => setMediaError(true)}
                />

                {!playing && (
                  <button
                    type="button"
                    className="rubius-preview-play"
                    aria-label={t("playPreview")}
                    onClick={() => void togglePlayback()}
                  >
                    <Play className="fill-current" aria-hidden="true" />
                  </button>
                )}

                <span className="rubius-video-label">{t("sourceLabel")}</span>
                <button
                  type="button"
                  className="rubius-video-sound"
                  aria-label={muted ? t("unmuteVideo") : t("muteVideo")}
                  title={muted ? t("unmuteVideo") : t("muteVideo")}
                  onClick={toggleSound}
                >
                  {muted ? <VolumeX /> : <Volume2 />}
                </button>

                {mediaError && (
                  <span className="rubius-media-error" role="status">
                    {t("videoLoadError")}
                  </span>
                )}
              </div>

              <div className="rubius-wave-card">
                <div className="rubius-wave-heading">
                  <span>{t("detectedMoments")}</span>
                  <span className="rubius-wave-time">
                    {formatTime(originTime)} / {formatTime(RUBIUS_SOURCE.end)}
                  </span>
                </div>

                <div className="rubius-timeline" aria-label={t("detectedMoments")}>
                  <div className="rubius-waveform" aria-hidden="true">
                    {peaks.map((height, index) => (
                      <span
                        key={index}
                        className={
                          (index + 1) / peaks.length <= time / SOURCE_DURATION
                            ? "is-played"
                            : ""
                        }
                        style={{ height: `${Math.max(6, height * 100)}%` }}
                      />
                    ))}
                  </div>

                  {RUBIUS_PREVIEW_CLIPS.map((clip) => (
                    <button
                      key={clip.id}
                      type="button"
                      className={`rubius-detected-range ${activeClip?.id === clip.id ? "is-active" : ""}`}
                      style={{
                        left: `${((clip.start - RUBIUS_SOURCE.start) / SOURCE_DURATION) * 100}%`,
                        width: `${((clip.end - clip.start) / SOURCE_DURATION) * 100}%`,
                      }}
                      title={clip.displayTitle}
                      aria-label={t("seekToMoment", { title: clip.displayTitle })}
                      onClick={() => seek(clip.start - RUBIUS_SOURCE.start)}
                    />
                  ))}

                  <span
                    className="rubius-timeline-playhead"
                    aria-hidden="true"
                    style={{ left: `${Math.min((time / SOURCE_DURATION) * 100, 100)}%` }}
                  />
                </div>

                <label className="sr-only" htmlFor="rubius-main-timeline">
                  {t("seekPreview")}
                </label>
                <input
                  id="rubius-main-timeline"
                  className="rubius-seek-slider"
                  type="range"
                  min={0}
                  max={SOURCE_DURATION}
                  step={0.1}
                  value={time}
                  onChange={(event) => seek(Number(event.target.value))}
                />

                <div className="rubius-wave-controls">
                  <button
                    type="button"
                    aria-label={playing ? t("pausePreview") : t("playPreview")}
                    onClick={() => void togglePlayback()}
                  >
                    {playing ? (
                      <Pause className="fill-current" aria-hidden="true" />
                    ) : (
                      <Play className="fill-current" aria-hidden="true" />
                    )}
                    {playing ? t("pausePreview") : t("playPreview")}
                  </button>
                  {activeClip && <span>{activeClip.displayTitle}</span>}
                </div>
              </div>
            </section>

            <section className="rubius-product-clips" aria-label={t("suggestedClips")}>
              <h2>{t("suggestedClips")}</h2>
              <ul className="rubius-clip-list">
                {RUBIUS_CLIPS.map((clip) => (
                  <li key={clip.id}>
                    <button
                      type="button"
                      className="rubius-clip-card"
                      aria-label={t("viewClip", { title: clip.displayTitle })}
                      onClick={() => openClip(clip)}
                    >
                      <Image
                        src={clip.poster}
                        alt=""
                        width={54}
                        height={86}
                        sizes="54px"
                        className="rubius-clip-thumb"
                      />
                      <span className="rubius-clip-copy">
                        <strong>{clip.displayTitle}</strong>
                        <small>
                          {formatTime(clip.start)} · {formatTime(clip.end - clip.start)}
                        </small>
                      </span>
                      <ArrowUpRight className="rubius-clip-open" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </section>

      <RubiusClipDialog clip={selectedClip} onClose={() => setSelectedClip(null)} />
    </>
  )
}

function RubiusClipDialog({
  clip,
  onClose,
}: {
  clip: RubiusClip | null
  onClose: () => void
}) {
  if (!clip) return null
  return <RubiusClipDialogContent key={clip.id} clip={clip} onClose={onClose} />
}

function RubiusClipDialogContent({
  clip,
  onClose,
}: {
  clip: RubiusClip
  onClose: () => void
}) {
  const t = useTranslations("marketing.hero")
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const dialogRef = React.useRef<HTMLDialogElement>(null)
  usePauseOffscreenVideo(videoRef)

  const [muted, setMuted] = React.useState(false)
  const [playing, setPlaying] = React.useState(false)
  const [time, setTime] = React.useState(0)
  const [duration, setDuration] = React.useState(clip.end - clip.start)
  const [mediaError, setMediaError] = React.useState(false)
  const copy = CLIP_COPY_KEYS[clip.slug]

  React.useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()

    const player = videoRef.current
    if (player) {
      player.muted = false
      void player.play().catch(() => setPlaying(false))
    }
  }, [])

  const togglePlayback = async () => {
    const player = videoRef.current
    if (!player) return
    if (!player.paused) {
      player.pause()
      return
    }
    try {
      await player.play()
    } catch {
      setPlaying(false)
    }
  }

  const seek = (next: number) => {
    const player = videoRef.current
    if (!player) return
    player.currentTime = Math.min(Math.max(next, 0), duration)
    setTime(player.currentTime)
  }

  const toggleSound = () => {
    const nextMuted = !muted
    if (videoRef.current) videoRef.current.muted = nextMuted
    setMuted(nextMuted)
  }

  const enterFullscreen = async () => {
    try {
      await videoRef.current?.parentElement?.requestFullscreen()
    } catch {
      // El navegador puede restringir el modo de pantalla completa.
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="m-auto max-h-[min(90dvh,58rem)] w-[min(82rem,calc(100vw-2rem))] max-w-none overflow-hidden rounded-2xl border border-border bg-background p-0 text-foreground shadow-2xl backdrop:bg-ink-950/75 backdrop:backdrop-blur-sm max-sm:max-h-[calc(100dvh-1rem)] max-sm:w-[calc(100vw-1rem)] max-sm:rounded-xl"
      aria-labelledby="rubius-dialog-title"
      aria-describedby="rubius-dialog-source"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) dialogRef.current?.close()
      }}
    >
      <div className="flex max-h-[inherit] flex-col overflow-hidden">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-4 py-3.5 sm:px-6">
          <div className="min-w-0">
            <h2
              id="rubius-dialog-title"
              className="truncate text-lg font-bold sm:text-xl"
            >
              {clip.displayTitle}
            </h2>
            <p id="rubius-dialog-source" className="mt-0.5 text-sm text-muted-foreground">
              {t("sourceTime", {
                start: formatTime(clip.start),
                end: formatTime(clip.end),
              })}
            </p>
          </div>
          <button
            type="button"
            className="grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label={t("closeDialog")}
            onClick={() => dialogRef.current?.close()}
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-[minmax(15rem,.85fr)_minmax(19rem,1.2fr)_minmax(13rem,.75fr)] lg:overflow-hidden">
          <section className="grid min-h-[22rem] place-items-center border-b border-border bg-card p-3 sm:min-h-[28rem] lg:min-h-0 lg:overflow-auto lg:border-r lg:border-b-0 lg:p-4">
            <div className="relative aspect-[9/16] h-[min(60dvh,34rem)] max-h-[calc(90dvh-7rem)] overflow-hidden rounded-xl border border-border bg-ink-950 max-sm:h-[min(48dvh,28rem)]">
              <video
                ref={videoRef}
                src={clip.video}
                poster={clip.poster}
                preload="metadata"
                autoPlay
                muted={muted}
                playsInline
                aria-label={t("clipVideo", { title: clip.displayTitle })}
                className="size-full object-cover"
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
                onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
                onError={() => setMediaError(true)}
              />

              {!playing && (
                <button
                  type="button"
                  className="absolute inset-0 m-auto grid size-12 place-items-center rounded-full bg-ink-950/75 text-white backdrop-blur-sm"
                  aria-label={t("playClip")}
                  onClick={() => void togglePlayback()}
                >
                  <Play className="ml-0.5 size-5 fill-current" aria-hidden="true" />
                </button>
              )}
              {mediaError && (
                <span
                  className="absolute inset-x-3 top-3 rounded-lg bg-ink-950/85 px-3 py-2 text-center text-xs text-white"
                  role="status"
                >
                  {t("videoLoadError")}
                </span>
              )}

              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950/95 via-ink-950/70 to-transparent px-3 pt-12 pb-2 text-white">
                <label className="sr-only" htmlFor="rubius-clip-timeline">
                  {t("seekClip")}
                </label>
                <input
                  id="rubius-clip-timeline"
                  className="block h-3 w-full cursor-pointer accent-brand"
                  type="range"
                  min={0}
                  max={duration || clip.end - clip.start}
                  step={0.1}
                  value={Math.min(time, duration)}
                  onChange={(event) => seek(Number(event.target.value))}
                />
                <div className="mt-1 flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    className="grid size-7 place-items-center rounded-md hover:bg-white/10"
                    aria-label={playing ? t("pauseClip") : t("playClip")}
                    onClick={() => void togglePlayback()}
                  >
                    {playing ? (
                      <Pause className="size-4 fill-current" aria-hidden="true" />
                    ) : (
                      <Play className="size-4 fill-current" aria-hidden="true" />
                    )}
                  </button>
                  <span className="tabular-nums">
                    {formatTime(time)} / {formatTime(duration)}
                  </span>
                  <button
                    type="button"
                    className="ml-auto grid size-7 place-items-center rounded-md hover:bg-white/10"
                    aria-label={muted ? t("unmuteVideo") : t("muteVideo")}
                    onClick={toggleSound}
                  >
                    {muted ? (
                      <VolumeX className="size-4" />
                    ) : (
                      <Volume2 className="size-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    className="grid size-7 place-items-center rounded-md hover:bg-white/10"
                    aria-label={t("fullscreen")}
                    onClick={() => void enterFullscreen()}
                  >
                    <Maximize className="size-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </section>

          <div className="grid min-h-0 content-start gap-3 border-b border-border p-3 sm:p-4 lg:overflow-y-auto lg:border-r lg:border-b-0">
            <section className="rounded-xl border border-border bg-card p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Video className="size-4 text-primary" aria-hidden="true" />
                {t("clipInfo")}
              </h3>
              <dl className="grid gap-3 text-sm">
                <div>
                  <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Play className="size-3" aria-hidden="true" /> {t("clipTitle")}
                  </dt>
                  <dd className="mt-0.5 font-medium">{clip.displayTitle}</dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MessageSquare className="size-3" aria-hidden="true" />{" "}
                    {t("clipDescription")}
                  </dt>
                  <dd className="mt-0.5 leading-relaxed">{t(copy.description)}</dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Sparkles className="size-3" aria-hidden="true" /> {t("clipReason")}
                  </dt>
                  <dd className="mt-0.5 leading-relaxed">{t(copy.reason)}</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-xl border border-border bg-card p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Type className="size-4 text-primary" aria-hidden="true" />
                {t("transcript")}
              </h3>
              <div className="max-h-72 overflow-y-auto rounded-lg border border-border bg-background p-3">
                <p className="font-mono text-[11px] text-muted-foreground">
                  [0:00–{formatTime(clip.end - clip.start)}] ·{" "}
                  {t("originalTime", {
                    start: formatTime(clip.start),
                    end: formatTime(clip.end),
                  })}
                </p>
                <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">
                  {clip.transcript}
                </p>
              </div>
            </section>
          </div>

          <aside className="grid content-start gap-2.5 p-3 sm:p-4 lg:overflow-y-auto">
            <section className="mb-1 rounded-xl border border-border bg-card p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Smartphone className="size-4 text-primary" aria-hidden="true" />
                {t("videoFormat")}
              </h3>
              <a
                className="flex min-h-10 items-center justify-center gap-2 rounded-lg border border-primary bg-primary/10 text-sm font-semibold text-primary transition hover:bg-primary/15"
                href={CLIPEALO_APP_URL}
                target="_blank"
                rel="noreferrer"
              >
                <Smartphone className="size-4" aria-hidden="true" /> 9:16
              </a>
            </section>
            <a
              className="flex min-h-11 items-center gap-2 rounded-lg border border-brand bg-brand px-3 text-sm font-semibold text-ink-950 transition hover:bg-brand/90"
              href={CLIPEALO_APP_URL}
              target="_blank"
              rel="noreferrer"
            >
              <Send className="size-4" aria-hidden="true" /> {t("publishClip")}
            </a>
            <a
              className="flex min-h-11 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium transition hover:border-primary hover:bg-muted"
              href={CLIPEALO_APP_URL}
              target="_blank"
              rel="noreferrer"
            >
              <FileText className="size-4 text-primary" aria-hidden="true" />{" "}
              {t("publishDraft")}
            </a>
            <a
              className="flex min-h-11 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium transition hover:border-primary hover:bg-muted"
              href={CLIPEALO_APP_URL}
              target="_blank"
              rel="noreferrer"
            >
              <Captions className="size-4 text-primary" aria-hidden="true" />{" "}
              {t("editClip")}
            </a>
            <a
              className="flex min-h-11 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium transition hover:border-primary hover:bg-muted"
              href={clip.video}
              download
            >
              <ArrowDownToLine className="size-4 text-primary" aria-hidden="true" />{" "}
              {t("downloadClip")}
            </a>
          </aside>
        </div>
      </div>
    </dialog>
  )
}
