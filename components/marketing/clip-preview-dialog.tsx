"use client";

import * as React from "react";
import {
  Download,
  Edit3,
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
} from "lucide-react";
import { useTranslations } from "next-intl";

import { formatTimecode } from "@/lib/format";
import { CLIPEALO_APP_URL, type RubiusClip } from "@/lib/marketing/rubius-demo";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { MediaFrame } from "@/components/video/media-frame";

interface ClipPreviewDialogProps {
  clip: RubiusClip | null;
  onClose: () => void;
}

export function ClipPreviewDialog({ clip, onClose }: ClipPreviewDialogProps) {
  return (
    <Dialog
      open={clip !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      {clip && <ClipPreviewContent key={clip.id} clip={clip} />}
    </Dialog>
  );
}

function ClipPreviewContent({ clip }: { clip: RubiusClip }) {
  const t = useTranslations("marketing.hero");
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const frameRef = React.useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = React.useState(false);
  const [muted, setMuted] = React.useState(false);
  const [time, setTime] = React.useState(0);
  const [duration, setDuration] = React.useState(clip.end - clip.start);

  function togglePlayback() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play().catch(() => setPlaying(false));
    else video.pause();
  }

  function seek(next: number) {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.min(Math.max(0, next), duration);
    setTime(video.currentTime);
  }

  function toggleSound() {
    const next = !muted;
    if (videoRef.current) videoRef.current.muted = next;
    setMuted(next);
  }

  async function enterFullscreen() {
    try {
      await frameRef.current?.requestFullscreen();
    } catch {
      // Algunos navegadores bloquean pantalla completa incluso tras un gesto.
    }
  }

  return (
    <DialogContent className="max-h-[92vh] w-[96vw] max-w-none overflow-hidden border border-border bg-background p-0 text-foreground sm:max-w-6xl">
      <div className="min-w-0">
        <div className="border-b border-border px-5 py-4 pr-14">
          <DialogTitle className="text-lg font-bold leading-tight sm:text-xl">
            {clip.displayTitle}
          </DialogTitle>
          <DialogDescription className="mt-1 text-xs text-muted-foreground">
            {t("sourceTime", {
              start: formatTimecode(clip.start),
              end: formatTimecode(clip.end),
            })}
          </DialogDescription>
        </div>

        <div className="grid max-h-[calc(92vh-5rem)] min-w-0 gap-0 overflow-y-auto lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.25fr)_minmax(0,0.8fr)] lg:overflow-hidden">
          <div className="min-w-0 border-b border-border p-4 lg:border-r lg:border-b-0">
            <div ref={frameRef} className="mx-auto max-w-64">
              <MediaFrame aspect="9:16" className="bg-stage ring-stage-border">
                <video
                  ref={videoRef}
                  src={clip.video}
                  poster={clip.poster}
                  preload="metadata"
                  autoPlay
                  muted={muted}
                  playsInline
                  onClick={togglePlayback}
                  onPlay={() => setPlaying(true)}
                  onPause={() => setPlaying(false)}
                  onTimeUpdate={(event) =>
                    setTime(event.currentTarget.currentTime)
                  }
                  onLoadedMetadata={(event) =>
                    setDuration(event.currentTarget.duration)
                  }
                  className="absolute inset-0 size-full cursor-pointer object-contain"
                  aria-label={t("clipVideo", { title: clip.displayTitle })}
                />
                <div className="absolute inset-x-0 bottom-0 space-y-1.5 bg-gradient-to-t from-stage via-stage/85 to-transparent p-3 pt-7">
                  <label className="sr-only" htmlFor="rubius-clip-timeline">
                    {t("seekClip")}
                  </label>
                  <input
                    id="rubius-clip-timeline"
                    type="range"
                    min={0}
                    max={duration}
                    step={0.1}
                    value={time}
                    onChange={(event) => seek(Number(event.target.value))}
                    className="block w-full cursor-pointer accent-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  />
                  <div className="flex items-center gap-1 text-stage-foreground">
                    <button
                      type="button"
                      onClick={togglePlayback}
                      aria-label={playing ? t("pauseClip") : t("playClip")}
                      className="grid size-8 place-items-center rounded-md hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-ring"
                    >
                      {playing ? (
                        <Pause className="size-4 fill-current" aria-hidden />
                      ) : (
                        <Play className="size-4 fill-current" aria-hidden />
                      )}
                    </button>
                    <span
                      data-slot="timecode"
                      className="flex-1 text-xs tabular-nums"
                    >
                      {formatTimecode(time)} / {formatTimecode(duration)}
                    </span>
                    <button
                      type="button"
                      onClick={toggleSound}
                      aria-label={muted ? t("unmuteVideo") : t("muteVideo")}
                      className="grid size-8 place-items-center rounded-md hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-ring"
                    >
                      {muted ? (
                        <VolumeX className="size-4" aria-hidden />
                      ) : (
                        <Volume2 className="size-4" aria-hidden />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => void enterFullscreen()}
                      aria-label={t("fullscreen")}
                      className="grid size-8 place-items-center rounded-md hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-ring"
                    >
                      <Maximize className="size-4" aria-hidden />
                    </button>
                  </div>
                </div>
              </MediaFrame>
            </div>
          </div>

          <div className="min-w-0 space-y-4 border-b border-border p-4 lg:max-h-[min(70vh,39rem)] lg:overflow-y-auto lg:border-r lg:border-b-0">
            <section className="rounded-xl border border-border bg-card p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Video className="size-4 text-primary" aria-hidden />
                {t("clipInfo")}
              </h3>
              <dl className="space-y-3 text-xs">
                <div>
                  <dt className="mb-0.5 flex items-center gap-1 text-muted-foreground">
                    <Play className="size-3" aria-hidden />
                    {t("clipTitle")}
                  </dt>
                  <dd className="font-semibold">{clip.displayTitle}</dd>
                </div>
                <div>
                  <dt className="mb-0.5 flex items-center gap-1 text-muted-foreground">
                    <MessageSquare className="size-3" aria-hidden />
                    {t("clipDescription")}
                  </dt>
                  <dd className="leading-relaxed text-muted-foreground">
                    {t(`clipDescriptions.${clip.slug}`)}
                  </dd>
                </div>
                <div>
                  <dt className="mb-0.5 flex items-center gap-1 text-muted-foreground">
                    <Sparkles className="size-3" aria-hidden />
                    {t("clipReason")}
                  </dt>
                  <dd className="leading-relaxed text-muted-foreground">
                    {t(`clipReasons.${clip.slug}`)}
                  </dd>
                </div>
              </dl>
            </section>
            <section className="rounded-xl border border-border bg-card p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Type className="size-4 text-primary" aria-hidden />
                {t("transcript")}
              </h3>
              <div className="max-h-52 overflow-y-auto rounded-lg bg-muted/40 p-3 ring-1 ring-border lg:max-h-64">
                <p
                  data-slot="timecode"
                  className="mb-2 text-[11px] text-muted-foreground tabular-nums"
                >
                  [{formatTimecode(0)}–{formatTimecode(duration)}] ·{" "}
                  {t("originalTime", {
                    start: formatTimecode(clip.start),
                    end: formatTimecode(clip.end),
                  })}
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {clip.transcript}
                </p>
              </div>
            </section>
          </div>

          <div className="min-w-0 space-y-3 p-4 lg:max-h-[min(70vh,39rem)] lg:overflow-y-auto">
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Smartphone className="size-4 text-primary" aria-hidden />
                {t("videoFormat")}
              </h3>
              <a
                href={CLIPEALO_APP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-lg border border-primary bg-primary/10 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-primary/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <Smartphone className="size-3.5" aria-hidden />
                9:16
              </a>
            </div>
            <Button asChild variant="brand" className="w-full justify-start">
              <a
                href={CLIPEALO_APP_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Send className="size-4" aria-hidden />
                {t("publishClip")}
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full justify-start border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <a
                href={CLIPEALO_APP_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FileText className="size-4" aria-hidden />
                {t("publishDraft")}
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full justify-start border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <a
                href={CLIPEALO_APP_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Edit3 className="size-4" aria-hidden />
                {t("editClip")}
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full justify-start border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <a
                href={CLIPEALO_APP_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download className="size-4" aria-hidden />
                {t("downloadClip")}
              </a>
            </Button>
          </div>
        </div>
      </div>
    </DialogContent>
  );
}
