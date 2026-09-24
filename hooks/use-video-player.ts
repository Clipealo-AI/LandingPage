"use client"

import * as React from "react"

import { clamp } from "@/lib/format"

/**
 * Por qué no reproduce: un código, no una frase. El reproductor lo traduce.
 * - `load`: el navegador no pudo cargar o decodificar la fuente.
 * - `blocked`: el navegador impidió reproducir (autoplay sin gesto, permisos).
 */
export type VideoPlayerError = "load" | "blocked"

export interface VideoPlayerState {
  ready: boolean
  playing: boolean
  waiting: boolean
  ended: boolean
  currentTime: number
  duration: number
  /** Final del rango bufferizado que contiene al cabezal, en segundos. */
  buffered: number
  volume: number
  muted: boolean
  rate: number
  fullscreen: boolean
  error: VideoPlayerError | null
}

export interface VideoPlayerActions {
  play: () => void
  pause: () => void
  toggle: () => void
  seek: (seconds: number) => void
  seekBy: (delta: number) => void
  /** Salto por fotograma, asumiendo 30 fps si no se indica otra cosa. */
  stepFrame: (direction: 1 | -1, fps?: number) => void
  setVolume: (value: number) => void
  toggleMute: () => void
  setRate: (value: number) => void
  toggleFullscreen: () => void
}

const INITIAL: VideoPlayerState = {
  ready: false,
  playing: false,
  waiting: false,
  ended: false,
  currentTime: 0,
  duration: 0,
  buffered: 0,
  volume: 1,
  muted: false,
  rate: 1,
  fullscreen: false,
  error: null,
}

/**
 * Estado de reproduccion de un `<video>`.
 *
 * El tiempo se lee con requestAnimationFrame mientras reproduce: el evento
 * `timeupdate` solo dispara ~4 veces por segundo y el cabezal de la linea de
 * tiempo se ve a saltos. Cuando esta en pausa nos apoyamos en los eventos, que
 * es mas barato.
 */
export function useVideoPlayer(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  containerRef?: React.RefObject<HTMLElement | null>
): [VideoPlayerState, VideoPlayerActions] {
  const [state, setState] = React.useState<VideoPlayerState>(INITIAL)
  const patch = React.useCallback(
    (next: Partial<VideoPlayerState>) => setState((s) => ({ ...s, ...next })),
    []
  )

  React.useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const bufferedEnd = () => {
      const { buffered, currentTime } = video
      for (let i = 0; i < buffered.length; i++) {
        if (buffered.start(i) <= currentTime && currentTime <= buffered.end(i)) {
          return buffered.end(i)
        }
      }
      return currentTime
    }

    const onLoaded = () =>
      patch({
        ready: true,
        duration: Number.isFinite(video.duration) ? video.duration : 0,
        volume: video.volume,
        muted: video.muted,
        error: null,
      })
    const onTime = () =>
      patch({ currentTime: video.currentTime, buffered: bufferedEnd() })
    const onPlay = () => patch({ playing: true, ended: false })
    const onPause = () => patch({ playing: false })
    const onWaiting = () => patch({ waiting: true })
    const onPlaying = () => patch({ waiting: false, playing: true })
    const onEnded = () => patch({ playing: false, ended: true })
    const onVolume = () => patch({ volume: video.volume, muted: video.muted })
    const onRate = () => patch({ rate: video.playbackRate })
    const onError = () =>
      patch({
        error: "load",
        waiting: false,
        playing: false,
      })

    video.addEventListener("loadedmetadata", onLoaded)
    video.addEventListener("durationchange", onLoaded)
    video.addEventListener("timeupdate", onTime)
    video.addEventListener("progress", onTime)
    video.addEventListener("play", onPlay)
    video.addEventListener("pause", onPause)
    video.addEventListener("waiting", onWaiting)
    video.addEventListener("playing", onPlaying)
    video.addEventListener("ended", onEnded)
    video.addEventListener("volumechange", onVolume)
    video.addEventListener("ratechange", onRate)
    video.addEventListener("error", onError)

    if (video.readyState >= 1) onLoaded()

    return () => {
      video.removeEventListener("loadedmetadata", onLoaded)
      video.removeEventListener("durationchange", onLoaded)
      video.removeEventListener("timeupdate", onTime)
      video.removeEventListener("progress", onTime)
      video.removeEventListener("play", onPlay)
      video.removeEventListener("pause", onPause)
      video.removeEventListener("waiting", onWaiting)
      video.removeEventListener("playing", onPlaying)
      video.removeEventListener("ended", onEnded)
      video.removeEventListener("volumechange", onVolume)
      video.removeEventListener("ratechange", onRate)
      video.removeEventListener("error", onError)
    }
  }, [videoRef, patch])

  // Cabezal suave solo mientras reproduce
  React.useEffect(() => {
    if (!state.playing) return
    let frame = 0
    const tick = () => {
      const video = videoRef.current
      if (video)
        setState((s) =>
          s.currentTime === video.currentTime
            ? s
            : { ...s, currentTime: video.currentTime }
        )
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [state.playing, videoRef])

  React.useEffect(() => {
    const onChange = () => patch({ fullscreen: document.fullscreenElement !== null })
    document.addEventListener("fullscreenchange", onChange)
    return () => document.removeEventListener("fullscreenchange", onChange)
  }, [patch])

  const actions = React.useMemo<VideoPlayerActions>(() => {
    const el = () => videoRef.current

    const seek = (seconds: number) => {
      const video = el()
      if (!video) return
      const max = Number.isFinite(video.duration) ? video.duration : seconds
      video.currentTime = clamp(seconds, 0, max)
      patch({ currentTime: video.currentTime })
    }

    return {
      play: () =>
        void el()
          ?.play()
          .catch(() => patch({ error: "blocked" })),
      pause: () => el()?.pause(),
      toggle: () => {
        const video = el()
        if (!video) return
        if (video.paused) void video.play().catch(() => {})
        else video.pause()
      },
      seek,
      seekBy: (delta) => seek((el()?.currentTime ?? 0) + delta),
      stepFrame: (direction, fps = 30) => {
        el()?.pause()
        seek((el()?.currentTime ?? 0) + direction / fps)
      },
      setVolume: (value) => {
        const video = el()
        if (!video) return
        video.volume = clamp(value, 0, 1)
        video.muted = value === 0
      },
      toggleMute: () => {
        const video = el()
        if (video) video.muted = !video.muted
      },
      setRate: (value) => {
        const video = el()
        if (video) video.playbackRate = value
      },
      toggleFullscreen: () => {
        const target = containerRef?.current ?? el()
        if (!target) return
        if (document.fullscreenElement) void document.exitFullscreen()
        else void target.requestFullscreen?.().catch(() => {})
      },
    }
  }, [videoRef, containerRef, patch])

  return [state, actions]
}

/**
 * Carga HLS solo cuando hace falta. Safari reproduce .m3u8 de forma nativa, asi
 * que ahi no descargamos hls.js (son ~180 kB que no aportan nada).
 */
export function useHlsSource(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  src?: string
) {
  React.useEffect(() => {
    const video = videoRef.current
    if (!video || !src) return

    const isHls = src.includes(".m3u8")
    if (!isHls || video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src
      return
    }

    let destroyed = false
    let instance: { destroy: () => void } | null = null

    void import("hls.js").then(({ default: Hls }) => {
      if (destroyed || !Hls.isSupported()) return
      const hls = new Hls({ enableWorker: true, lowLatencyMode: false })
      hls.loadSource(src)
      hls.attachMedia(video)
      instance = hls
    })

    return () => {
      destroyed = true
      instance?.destroy()
    }
  }, [videoRef, src])
}

/** Atajos de teclado estandar de reproductor. Solo actua si el foco esta dentro. */
export function usePlayerShortcuts(
  containerRef: React.RefObject<HTMLElement | null>,
  actions: VideoPlayerActions,
  state: VideoPlayerState,
  enabled = true
) {
  React.useEffect(() => {
    if (!enabled) return
    const node = containerRef.current
    if (!node) return

    const onKeyDown = (event: KeyboardEvent) => {
      // No robamos teclas mientras alguien escribe
      const target = event.target as HTMLElement | null
      if (target?.closest("input, textarea, [contenteditable='true']")) return

      const map: Record<string, () => void> = {
        " ": actions.toggle,
        k: actions.toggle,
        ArrowRight: () => actions.seekBy(5),
        ArrowLeft: () => actions.seekBy(-5),
        l: () => actions.seekBy(10),
        j: () => actions.seekBy(-10),
        ".": () => actions.stepFrame(1),
        ",": () => actions.stepFrame(-1),
        m: actions.toggleMute,
        f: actions.toggleFullscreen,
        ArrowUp: () => actions.setVolume(state.volume + 0.1),
        ArrowDown: () => actions.setVolume(state.volume - 0.1),
      }

      const handler = map[event.key]
      if (handler) {
        event.preventDefault()
        handler()
        return
      }

      if (/^[0-9]$/.test(event.key) && state.duration > 0) {
        event.preventDefault()
        actions.seek((Number(event.key) / 10) * state.duration)
      }
    }

    node.addEventListener("keydown", onKeyDown)
    return () => node.removeEventListener("keydown", onKeyDown)
  }, [containerRef, actions, state.volume, state.duration, enabled])
}
