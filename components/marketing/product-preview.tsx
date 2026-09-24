"use client";

import * as React from "react";
import { ArrowUpRight, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useTranslations } from "next-intl";

import { formatTimecode } from "@/lib/format";
import {
  RUBIUS_CLIPS,
  RUBIUS_PREVIEW_CLIPS,
  RUBIUS_SOURCE,
  type RubiusClip,
} from "@/lib/marketing/rubius-demo";
import peaks from "@/lib/marketing/rubius-waveform.json";
import { cn } from "@/lib/utils";
import { MediaFrame } from "@/components/video/media-frame";
import { Waveform } from "@/components/video/waveform";
import { Reveal } from "@/components/shared/reveal";
import { ClipPreviewDialog } from "@/components/marketing/clip-preview-dialog";
import { usePauseOffscreenVideo } from "@/components/marketing/use-pause-offscreen-video";

const DURATION = RUBIUS_SOURCE.end - RUBIUS_SOURCE.start;

/** Video original, cortes y transcripción comparten el mismo reloj de origen. */
export function ProductPreview() {
  const t = useTranslations("marketing.hero");
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [videoElement, setVideoElement] =
    React.useState<HTMLVideoElement | null>(null);
  const attachVideoRef = React.useCallback((video: HTMLVideoElement | null) => {
    videoRef.current = video;
    if (video) setVideoElement(video);
  }, []);
  usePauseOffscreenVideo(videoElement);
  const [time, setTime] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);
  const [muted, setMuted] = React.useState(false);
  const [selected, setSelected] = React.useState<RubiusClip | null>(null);

  function seek(seconds: number) {
    const video = videoRef.current;
    if (!video) return;
    const next = Math.min(
      Math.max(seconds, 0),
      Math.min(DURATION, video.duration || DURATION),
    );
    video.currentTime = next;
    setTime(next);
  }

  async function togglePlayback() {
    const video = videoRef.current;
    if (!video) return;
    if (!video.paused) {
      video.pause();
      return;
    }
    if (video.ended) seek(0);
    try {
      await video.play();
    } catch {
      setPlaying(false);
    }
  }

  function openClip(clip: RubiusClip) {
    videoRef.current?.pause();
    setSelected(clip);
  }

  function toggleSound() {
    const next = !muted;
    if (videoRef.current) videoRef.current.muted = next;
    setMuted(next);
  }

  const active = RUBIUS_PREVIEW_CLIPS.find(
    (clip) =>
      RUBIUS_SOURCE.start + time >= clip.start &&
      RUBIUS_SOURCE.start + time <= clip.end,
  );

  return (
    <>
      <Reveal className="relative mx-auto mt-16 max-w-[min(100%,88rem)] sm:mt-20">
        <div className="rounded-frame border border-white/10 bg-white/5 p-2 shadow-2xl backdrop-blur-sm sm:p-3">
          <div className="rounded-xl bg-background p-3 text-foreground sm:p-4">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
              <div className="min-w-0 space-y-3">
                <MediaFrame aspect="16:9" className="bg-stage ring-0">
                  <video
                    ref={attachVideoRef}
                    src={RUBIUS_SOURCE.video}
                    poster={RUBIUS_SOURCE.poster}
                    preload="metadata"
                    muted={muted}
                    playsInline
                    className="absolute inset-0 size-full object-contain"
                    aria-label={t("videoPreview")}
                    onTimeUpdate={(event) =>
                      setTime(event.currentTarget.currentTime)
                    }
                    onSeeked={(event) =>
                      setTime(event.currentTarget.currentTime)
                    }
                    onPlay={() => setPlaying(true)}
                    onPause={() => setPlaying(false)}
                    onEnded={() => setPlaying(false)}
                  />
                  {!playing && (
                    <button
                      type="button"
                      onClick={() => void togglePlayback()}
                      aria-label={t("playPreview")}
                      className="absolute inset-0 grid place-items-center bg-stage/10 transition-colors hover:bg-stage/25 focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-ring"
                    >
                      <span className="grid size-14 place-items-center rounded-full bg-stage/85 text-stage-foreground shadow-lg backdrop-blur-sm">
                        <Play
                          className="ml-0.5 size-6 fill-current"
                          aria-hidden
                        />
                      </span>
                    </button>
                  )}
                  <span className="absolute top-2 left-2 rounded-md bg-stage/85 px-2 py-1 text-[11px] font-medium text-stage-foreground backdrop-blur-sm sm:top-3 sm:left-3">
                    {t("sourceLabel")}
                  </span>
                  <button
                    type="button"
                    onClick={toggleSound}
                    className="absolute right-2 bottom-2 rounded-md bg-stage/85 p-1.5 text-stage-foreground backdrop-blur-sm hover:bg-stage focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:right-3 sm:bottom-3"
                    aria-label={muted ? t("unmuteVideo") : t("muteVideo")}
                    title={muted ? t("unmuteVideo") : t("muteVideo")}
                  >
                    {muted ? (
                      <VolumeX className="size-4" aria-hidden />
                    ) : (
                      <Volume2 className="size-4" aria-hidden />
                    )}
                  </button>
                </MediaFrame>

                <div className="rounded-lg bg-card p-3 ring-1 ring-border">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold">
                      {t("detectedMoments")}
                    </p>
                    <span
                      data-slot="timecode"
                      className="text-[11px] text-muted-foreground tabular-nums"
                    >
                      {formatTimecode(RUBIUS_SOURCE.start + time)} /{" "}
                      {formatTimecode(RUBIUS_SOURCE.end)}
                    </span>
                  </div>
                  <div className="relative">
                    <Waveform
                      peaks={peaks}
                      progress={time / DURATION}
                      selection={
                        active
                          ? {
                              start:
                                (active.start - RUBIUS_SOURCE.start) / DURATION,
                              end:
                                (active.end - RUBIUS_SOURCE.start) / DURATION,
                            }
                          : null
                      }
                      height={42}
                      onSeek={(position) => seek(position * DURATION)}
                    />
                    {RUBIUS_PREVIEW_CLIPS.map((clip) => (
                      <button
                        key={clip.id}
                        type="button"
                        onClick={() => seek(clip.start - RUBIUS_SOURCE.start)}
                        aria-label={t("seekToMoment", {
                          title: clip.displayTitle,
                        })}
                        title={clip.displayTitle}
                        className={cn(
                          "absolute top-0 h-full rounded border border-brand/70 bg-brand/15 transition-colors hover:bg-brand/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                          active?.id === clip.id && "border-brand bg-brand/25",
                        )}
                        style={{
                          left: `${((clip.start - RUBIUS_SOURCE.start) / DURATION) * 100}%`,
                          width: `${((clip.end - clip.start) / DURATION) * 100}%`,
                        }}
                      />
                    ))}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute -top-1 -bottom-1 z-10 w-0.5 bg-primary shadow-sm"
                      style={{
                        left: `${Math.min((time / DURATION) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <label className="sr-only" htmlFor="rubius-timeline">
                    {t("seekPreview")}
                  </label>
                  <input
                    id="rubius-timeline"
                    type="range"
                    min={0}
                    max={DURATION}
                    step={0.1}
                    value={time}
                    onChange={(event) => seek(Number(event.target.value))}
                    className="mt-2 block h-1 w-full cursor-pointer accent-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                  />
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => void togglePlayback()}
                      className="inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 text-xs font-medium hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
                    >
                      {playing ? (
                        <Pause className="size-3.5 fill-current" aria-hidden />
                      ) : (
                        <Play className="size-3.5 fill-current" aria-hidden />
                      )}
                      {playing ? t("pausePreview") : t("playPreview")}
                    </button>
                    {active && (
                      <span className="truncate text-[11px] text-muted-foreground">
                        {active.displayTitle}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="min-w-0">
                <h2 className="mb-2 text-left text-xs font-semibold">
                  {t("suggestedClips")}
                </h2>
                <ul
                  className="max-h-[34.5rem] space-y-2.5 overflow-y-auto overscroll-contain pr-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  tabIndex={0}
                  aria-label={t("suggestedClips")}
                >
                  {RUBIUS_CLIPS.map((clip) => (
                    <li key={clip.id}>
                      <button
                        type="button"
                        onClick={() => openClip(clip)}
                        aria-label={t("viewClip", { title: clip.displayTitle })}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg bg-card p-2 text-left ring-1 ring-border transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                          active?.id === clip.id && "ring-brand",
                        )}
                      >
                        <div className="w-14 shrink-0 sm:w-16">
                          <MediaFrame
                            aspect="9:16"
                            poster={clip.poster}
                            className="rounded-md"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-xs font-semibold">
                            {clip.displayTitle}
                          </p>
                          <p
                            data-slot="timecode"
                            className="mt-1 text-[11px] text-muted-foreground tabular-nums"
                          >
                            {formatTimecode(clip.start)} ·{" "}
                            {formatTimecode(clip.end - clip.start)}
                          </p>
                        </div>
                        <ArrowUpRight
                          className="size-4 shrink-0 text-muted-foreground"
                          aria-hidden
                        />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      <ClipPreviewDialog clip={selected} onClose={() => setSelected(null)} />
    </>
  );
}
