/**
 * Modelo de dominio de la plataforma de clipping.
 * Estos tipos son el contrato entre la UI y la API: los componentes de
 * `components/video` no conocen ninguna otra forma de datos.
 */

/**
 * Formatos de salida soportados. El ratio se usa para dimensionar previews.
 * El nombre y el destino de cada formato viven en los mensajes:
 * ``t(`common.video.aspect.${key}.label`)`` y `.destination`.
 */
export const ASPECT_RATIOS = {
  "9:16": { ratio: 9 / 16, css: "9 / 16" },
  "1:1": { ratio: 1, css: "1 / 1" },
  "4:5": { ratio: 4 / 5, css: "4 / 5" },
  "16:9": { ratio: 16 / 9, css: "16 / 9" },
} as const

export type AspectRatioKey = keyof typeof ASPECT_RATIOS

/**
 * Estado del pipeline de proceso. El orden importa: la UI lo usa como progreso.
 * Nombre de cada etapa: ``t(`common.video.jobStage.${stage}`)``.
 */
export const JOB_STAGES = [
  "subiendo",
  "transcribiendo",
  "analizando",
  "recortando",
  "reencuadrando",
  "listo",
] as const

export type JobStage = (typeof JOB_STAGES)[number]

export type JobStatus = "en-cola" | "procesando" | "listo" | "error"

export interface SourceVideo {
  id: string
  title: string
  /** Duracion total en segundos. */
  duration: number
  posterUrl?: string
  /** URL del master. En el arquetipo puede ser un .m3u8 o un .mp4. */
  src?: string
  sizeBytes: number
  uploadedAt: string
  status: JobStatus
  stage: JobStage
  /** 0–100. Solo relevante mientras `status === "procesando"`. */
  progress: number
  clipCount: number
  language: string
  /**
   * Si el trabajo es una operación (recortar, reducir) y no un análisis. Sin
   * él es el proceso de siempre: transcribir, analizar, recortar, reencuadrar.
   * Los parámetros viven en `lib/operaciones.ts`.
   */
  operacion?: import("@/lib/operaciones").ParametrosOperacion
}

export interface ClipRange {
  /** Segundos desde el inicio del video fuente. */
  start: number
  end: number
}

export interface Clip {
  id: string
  sourceId: string
  title: string
  /** Frase que justifica el recorte: es lo que hace confiable a la IA. */
  hook: string
  range: ClipRange
  aspect: AspectRatioKey
  posterUrl?: string
  src?: string
  /** 0–100: probabilidad estimada de retencion. */
  score: number
  /** Etiquetas semanticas devueltas por el analisis. */
  tags: string[]
  hasCaptions: boolean
  /** Nombre visible: ``t(`common.video.clipStatus.${status}`)``. */
  status: "borrador" | "listo" | "publicado"
  createdAt: string
  metrics?: ClipMetrics
}

export interface ClipMetrics {
  views: number
  likes: number
  shares: number
  /** 0–100, porcentaje medio de reproduccion completada. */
  retention: number
}

export interface TranscriptCue {
  id: string
  start: number
  end: number
  text: string
  speaker?: string
  /** Marca los cues que la IA considero parte de un momento fuerte. */
  highlighted?: boolean
}

export interface Speaker {
  id: string
  name: string
  color: string
  avatarUrl?: string
}

/** Fila de la linea de tiempo: cada pista se dibuja con el mismo componente. */
export interface TimelineTrack {
  id: string
  kind: "video" | "audio" | "captions" | "clips"
  label: string
  items: TimelineItem[]
}

export interface TimelineItem extends ClipRange {
  id: string
  label?: string
  /** Intensidad 0–1: en la pista de audio pinta la forma de onda. */
  intensity?: number
  selected?: boolean
}

/** Estado de un archivo dentro de la cola de subida. */
export type UploadStatus = "en-cola" | "subiendo" | "pausado" | "completado" | "error"

export interface UploadItem {
  id: string
  name: string
  /** Tamaño total en bytes. */
  size: number
  /** Bytes confirmados por el servidor: es lo que permite reanudar. */
  uploadedBytes: number
  status: UploadStatus
  error?: string
  /** Dónde quedó el archivo, si el transporte lo supo (ver `lib/api/upload.ts`). */
  url?: string
}

/** 0–100 derivado, para no duplicar el porcentaje en el estado. */
export function uploadProgress(item: UploadItem) {
  return item.size === 0 ? 0 : Math.min(100, (item.uploadedBytes / item.size) * 100)
}
