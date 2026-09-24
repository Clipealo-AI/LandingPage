import { useCallback, useRef, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowUpRight,
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
  X,
} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import marketing from '../../../messages/es/marketing.json';
import {
  CLIPEALO_APP_URL,
  RUBIUS_CLIPS,
  RUBIUS_PREVIEW_CLIPS,
  RUBIUS_SOURCE,
  type RubiusClip,
} from '../../../lib/marketing/rubius-demo';
import peaks from '../../../lib/marketing/rubius-waveform.json';
import { usePauseOffscreenVideo } from '@/hooks/usePauseOffscreenVideo';

const SOURCE_DURATION = RUBIUS_SOURCE.end - RUBIUS_SOURCE.start;

function formatTime(seconds: number) {
  const wholeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(wholeSeconds / 60);
  const remainder = String(wholeSeconds % 60).padStart(2, '0');
  return `${minutes}:${remainder}`;
}

function useVideoAttachment() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  const attachVideoRef = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (node) setVideo(node);
  }, []);

  return { videoRef, attachVideoRef, video };
}

interface RubiusProductPreviewProps {
  prefersReducedMotion: boolean;
}

export function RubiusProductPreview({
  prefersReducedMotion,
}: RubiusProductPreviewProps) {
  const { videoRef, attachVideoRef, video } = useVideoAttachment();
  usePauseOffscreenVideo(video);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  const [selectedClip, setSelectedClip] = useState<RubiusClip | null>(null);

  const seek = (next: number) => {
    const player = videoRef.current;
    if (!player) return;
    const clamped = Math.min(Math.max(next, 0), SOURCE_DURATION);
    player.currentTime = clamped;
    setTime(clamped);
  };

  const togglePlayback = async () => {
    const player = videoRef.current;
    if (!player) return;
    if (!player.paused) {
      player.pause();
      return;
    }
    if (player.ended) seek(0);
    try {
      await player.play();
    } catch {
      setPlaying(false);
    }
  };

  const toggleSound = () => {
    const nextMuted = !muted;
    if (videoRef.current) videoRef.current.muted = nextMuted;
    setMuted(nextMuted);
  };

  const activeClip = RUBIUS_PREVIEW_CLIPS.find((clip) => {
    const originTime = RUBIUS_SOURCE.start + time;
    return originTime >= clip.start && originTime <= clip.end;
  });

  const openClip = (clip: RubiusClip) => {
    videoRef.current?.pause();
    setSelectedClip(clip);
  };

  return (
    <>
      <div className="reference-product-preview">
        <div className="reference-product-shell">
          <div className="reference-product-window">
            <section className="reference-product-main" aria-label={marketing.hero.videoPreview}>
              <div className="reference-product-video">
                <video
                  ref={attachVideoRef}
                  src={RUBIUS_SOURCE.video}
                  poster={RUBIUS_SOURCE.poster}
                  preload="metadata"
                  muted={muted}
                  playsInline
                  aria-label={marketing.hero.videoPreview}
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
                    className="reference-preview-play"
                    aria-label={marketing.hero.playPreview}
                    onClick={() => void togglePlayback()}
                  >
                    <Play fill="currentColor" aria-hidden="true" />
                  </button>
                )}
                <span className="reference-video-label">{marketing.hero.sourceLabel}</span>
                <button
                  type="button"
                  className="reference-video-sound"
                  aria-label={muted ? marketing.hero.unmuteVideo : marketing.hero.muteVideo}
                  title={muted ? marketing.hero.unmuteVideo : marketing.hero.muteVideo}
                  onClick={toggleSound}
                >
                  {muted ? <VolumeX aria-hidden="true" /> : <Volume2 aria-hidden="true" />}
                </button>
                {mediaError && (
                  <span className="reference-media-error" role="status">
                    No se pudo cargar el video. Intenta de nuevo en unos segundos.
                  </span>
                )}
              </div>

              <div className="reference-wave-card">
                <div className="reference-wave-heading">
                  <span>{marketing.hero.detectedMoments}</span>
                  <span className="reference-wave-time" aria-live="off">
                    {formatTime(RUBIUS_SOURCE.start + time)} / {formatTime(RUBIUS_SOURCE.end)}
                  </span>
                </div>
                <div
                  className={`reference-timeline ${prefersReducedMotion ? 'is-reduced' : ''}`}
                  aria-label={marketing.hero.detectedMoments}
                >
                  <div className="reference-waveform" aria-hidden="true">
                    {peaks.map((height, index) => (
                      <span
                        className={index / peaks.length <= time / SOURCE_DURATION ? 'is-played' : ''}
                        key={index}
                        style={{ height: `${Math.max(6, height * 100)}%` }}
                      />
                    ))}
                  </div>
                  {RUBIUS_PREVIEW_CLIPS.map((clip) => (
                    <button
                      type="button"
                      key={clip.id}
                      className={`reference-detected-range ${activeClip?.id === clip.id ? 'is-active' : ''}`}
                      style={{
                        left: `${((clip.start - RUBIUS_SOURCE.start) / SOURCE_DURATION) * 100}%`,
                        width: `${((clip.end - clip.start) / SOURCE_DURATION) * 100}%`,
                      }}
                      title={clip.displayTitle}
                      aria-label={marketing.hero.seekToMoment.replace('{title}', clip.displayTitle)}
                      onClick={() => seek(clip.start - RUBIUS_SOURCE.start)}
                    />
                  ))}
                  <span
                    className="reference-timeline-playhead"
                    aria-hidden="true"
                    style={{ left: `${Math.min((time / SOURCE_DURATION) * 100, 100)}%` }}
                  />
                </div>
                <label className="sr-only" htmlFor="rubius-main-timeline">
                  {marketing.hero.seekPreview}
                </label>
                <input
                  id="rubius-main-timeline"
                  className="reference-seek-slider"
                  type="range"
                  min={0}
                  max={SOURCE_DURATION}
                  step={0.1}
                  value={time}
                  onChange={(event) => seek(Number(event.target.value))}
                />
                <div className="reference-wave-controls">
                  <button type="button" onClick={() => void togglePlayback()}>
                    {playing ? <Pause fill="currentColor" aria-hidden="true" /> : <Play fill="currentColor" aria-hidden="true" />}
                    {playing ? marketing.hero.pausePreview : marketing.hero.playPreview}
                  </button>
                  {activeClip && <span>{activeClip.displayTitle}</span>}
                </div>
              </div>
            </section>

            <section className="reference-product-clips" aria-label={marketing.hero.suggestedClips}>
              <h2>{marketing.hero.suggestedClips}</h2>
              <ul className="reference-clip-list">
                {RUBIUS_CLIPS.map((clip) => (
                  <li key={clip.id}>
                    <button
                      type="button"
                      className="reference-clip-card"
                      aria-label={marketing.hero.viewClip.replace('{title}', clip.displayTitle)}
                      onClick={() => openClip(clip)}
                    >
                      <img
                        className="reference-clip-thumb"
                        src={clip.poster}
                        alt=""
                        loading="lazy"
                      />
                      <span className="reference-clip-copy">
                        <strong>{clip.displayTitle}</strong>
                        <small>{formatTime(clip.start)} · {formatTime(clip.end - clip.start)}</small>
                      </span>
                      <ArrowUpRight className="reference-clip-open" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </div>

      <RubiusClipDialog
        clip={selectedClip}
        onClose={() => setSelectedClip(null)}
      />
    </>
  );
}

function RubiusClipDialog({
  clip,
  onClose,
}: {
  clip: RubiusClip | null;
  onClose: () => void;
}) {
  return (
    <Dialog.Root open={clip !== null} onOpenChange={(open) => !open && onClose()}>
      {clip && <RubiusClipDialogContent key={clip.id} clip={clip} />}
    </Dialog.Root>
  );
}

function RubiusClipDialogContent({ clip }: { clip: RubiusClip }) {
  const { videoRef, attachVideoRef, video } = useVideoAttachment();
  usePauseOffscreenVideo(video);
  const [muted, setMuted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(clip.end - clip.start);
  const [mediaError, setMediaError] = useState(false);

  const togglePlayback = async () => {
    const player = videoRef.current;
    if (!player) return;
    if (!player.paused) {
      player.pause();
      return;
    }
    try {
      await player.play();
    } catch {
      setPlaying(false);
    }
  };

  const seek = (next: number) => {
    const player = videoRef.current;
    if (!player) return;
    player.currentTime = Math.min(Math.max(next, 0), duration);
    setTime(player.currentTime);
  };

  const toggleSound = () => {
    const nextMuted = !muted;
    if (videoRef.current) videoRef.current.muted = nextMuted;
    setMuted(nextMuted);
  };

  const enterFullscreen = async () => {
    try {
      await videoRef.current?.parentElement?.requestFullscreen();
    } catch {
      // Fullscreen puede estar restringido por el navegador.
    }
  };

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="reference-clip-dialog-overlay" />
      <Dialog.Content className="reference-clip-dialog">
        <header className="reference-dialog-header">
          <div>
            <Dialog.Title>{clip.displayTitle}</Dialog.Title>
            <Dialog.Description>
              {marketing.hero.sourceTime
                .replace('{start}', formatTime(clip.start))
                .replace('{end}', formatTime(clip.end))}
            </Dialog.Description>
          </div>
          <Dialog.Close className="reference-dialog-close" aria-label="Cerrar">
            <X aria-hidden="true" />
          </Dialog.Close>
        </header>
        <div className="reference-dialog-grid">
          <section className="reference-dialog-player-column">
            <div className="reference-dialog-player">
              <video
                ref={attachVideoRef}
                src={clip.video}
                poster={clip.poster}
                preload="metadata"
                autoPlay
                muted={muted}
                playsInline
                aria-label={marketing.hero.clipVideo.replace('{title}', clip.displayTitle)}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
                onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
                onError={() => setMediaError(true)}
              />
              {!playing && (
                <button
                  type="button"
                  className="reference-preview-play"
                  aria-label={marketing.hero.playClip}
                  onClick={() => void togglePlayback()}
                >
                  <Play fill="currentColor" aria-hidden="true" />
                </button>
              )}
              {mediaError && (
                <span className="reference-media-error" role="status">
                  No se pudo cargar el clip. Intenta de nuevo en unos segundos.
                </span>
              )}
              <div className="reference-clip-controls">
                <label className="sr-only" htmlFor="rubius-clip-timeline">
                  {marketing.hero.seekClip}
                </label>
                <input
                  id="rubius-clip-timeline"
                  type="range"
                  min={0}
                  max={duration}
                  step={0.1}
                  value={time}
                  onChange={(event) => seek(Number(event.target.value))}
                />
                <div>
                  <button
                    type="button"
                    aria-label={playing ? marketing.hero.pauseClip : marketing.hero.playClip}
                    onClick={() => void togglePlayback()}
                  >
                    {playing ? <Pause fill="currentColor" aria-hidden="true" /> : <Play fill="currentColor" aria-hidden="true" />}
                  </button>
                  <span>{formatTime(time)} / {formatTime(duration)}</span>
                  <button
                    type="button"
                    aria-label={muted ? marketing.hero.unmuteVideo : marketing.hero.muteVideo}
                    onClick={toggleSound}
                  >
                    {muted ? <VolumeX aria-hidden="true" /> : <Volume2 aria-hidden="true" />}
                  </button>
                  <button type="button" aria-label={marketing.hero.fullscreen} onClick={() => void enterFullscreen()}>
                    <Maximize aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </section>

          <div className="reference-dialog-information">
            <section className="reference-dialog-card">
              <h3><Video aria-hidden="true" />{marketing.hero.clipInfo}</h3>
              <dl>
                <div>
                  <dt><Play aria-hidden="true" />{marketing.hero.clipTitle}</dt>
                  <dd>{clip.displayTitle}</dd>
                </div>
                <div>
                  <dt><MessageSquare aria-hidden="true" />{marketing.hero.clipDescription}</dt>
                  <dd>{marketing.hero.clipDescriptions[clip.slug]}</dd>
                </div>
                <div>
                  <dt><Sparkles aria-hidden="true" />{marketing.hero.clipReason}</dt>
                  <dd>{marketing.hero.clipReasons[clip.slug]}</dd>
                </div>
              </dl>
            </section>
            <section className="reference-dialog-card">
              <h3><Type aria-hidden="true" />{marketing.hero.transcript}</h3>
              <div className="reference-dialog-transcript">
                <small>[0:00–{formatTime(duration)}] · {marketing.hero.originalTime
                  .replace('{start}', formatTime(clip.start))
                  .replace('{end}', formatTime(clip.end))}</small>
                <p>{clip.transcript}</p>
              </div>
            </section>
          </div>

          <aside className="reference-dialog-actions">
            <section className="reference-dialog-card">
              <h3><Smartphone aria-hidden="true" />{marketing.hero.videoFormat}</h3>
              <a className="reference-dialog-format" href={CLIPEALO_APP_URL} target="_blank" rel="noreferrer">
                <Smartphone aria-hidden="true" /> 9:16
              </a>
            </section>
            <a className="reference-dialog-action reference-dialog-action-primary" href={CLIPEALO_APP_URL} target="_blank" rel="noreferrer">
              <Send aria-hidden="true" />{marketing.hero.publishClip}
            </a>
            <a className="reference-dialog-action" href={CLIPEALO_APP_URL} target="_blank" rel="noreferrer">
              <FileText aria-hidden="true" />{marketing.hero.publishDraft}
            </a>
            <a className="reference-dialog-action" href={CLIPEALO_APP_URL} target="_blank" rel="noreferrer">
              <Edit3 aria-hidden="true" />{marketing.hero.editClip}
            </a>
            <a className="reference-dialog-action" href={clip.video} download>
              <ArrowDownToLine aria-hidden="true" />{marketing.hero.downloadClip}
            </a>
          </aside>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
