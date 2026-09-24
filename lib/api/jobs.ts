import { JOB_STAGES, type JobStage, type JobStatus, type SourceVideo } from "@/lib/types"
import { sourceVideos } from "@/lib/mock-data"
import { hayServidor, pedir } from "@/lib/api/cliente"
import type { ParametrosOperacion } from "@/lib/operaciones"

/**
 * FRONTERA DE DATOS.
 *
 * Es lo único que hay que tocar para conectar la API real, y ya está tocado:
 * cada función pregunta primero si hay servidor (`NEXT_PUBLIC_API_URL`) y, si
 * lo hay, pide por HTTP con `pedir`. Sin esa variable sigue la simulación, que
 * es lo que hace andar la demo. Los hooks de `hooks/use-jobs.ts` y todos los
 * componentes dependen solo de estas firmas y de los tipos de `lib/types.ts`.
 *
 * Este archivo es el patrón a copiar en las demás fronteras: la lista de lo que
 * falta está en `docs/costuras-backend.md`.
 */

/**
 * Claves de caché en un solo sitio: invalidar desde una mutación sin poder
 * escribir mal la clave es la mitad del valor de TanStack Query.
 */
export const jobKeys = {
  all: ["jobs"] as const,
  list: () => [...jobKeys.all, "list"] as const,
  detail: (id: string) => [...jobKeys.all, "detail", id] as const,
}

/**
 * El proyecto pedido no existe. Lleva el id y no una frase: el aviso lo
 * traduce quien lo muestra (`app.jobs.notFound`).
 */
export class JobNotFoundError extends Error {
  constructor(readonly jobId: string) {
    super(`Job not found: ${jobId}`)
    this.name = "JobNotFoundError"
  }
}

/** Estados en los que todavía merece la pena volver a preguntar. */
export function isJobActive(job?: Pick<SourceVideo, "status">) {
  return job?.status === "procesando" || job?.status === "en-cola"
}

/** Cada etapa ocupa el mismo tramo de la barra: 6 etapas, ~16,6 % cada una. */
function stageFromProgress(progress: number): JobStage {
  const index = Math.min(
    JOB_STAGES.length - 1,
    Math.floor((progress / 100) * JOB_STAGES.length)
  )
  return JOB_STAGES[index]
}

const SPEED_PER_SECOND = 1.6 // puntos de progreso por segundo
const startedAt = Date.now()

/**
 * EL ALMACÉN DE ESTA FRONTERA.
 *
 * Un `Map` en memoria sembrado con la demo; mañana, la tabla del servidor. Vive
 * aquí dentro a propósito: mientras `retryJob` escribía sobre el `const`
 * importado de `lib/mock-data`, reencolar un proyecto duraba lo que tardaba el
 * siguiente sondeo en volver a leer el original y deshacerlo. Una frontera que
 * no sabe escribir no es una frontera: es una lectura.
 */
const almacen = new Map<string, SourceVideo>(sourceVideos.map((v) => [v.id, v]))

/**
 * Desde cuándo cuenta el reloj de cada trabajo. Las semillas arrancan con el
 * módulo, como siempre; uno recién creado, desde que se creó, o nacería con el
 * progreso que le tocaría si llevara toda la sesión en marcha.
 */
const arrancadoEn = new Map<string, number>(sourceVideos.map((v) => [v.id, startedAt]))

function simulate(video: SourceVideo, now: number): SourceVideo {
  if (!isJobActive(video)) return video

  const elapsedSeconds = (now - (arrancadoEn.get(video.id) ?? startedAt)) / 1000
  const progress = Math.min(100, video.progress + elapsedSeconds * SPEED_PER_SECOND)
  const done = progress >= 100

  const status: JobStatus = done ? "listo" : "procesando"

  return {
    ...video,
    progress: Math.round(progress),
    status,
    stage: done ? "listo" : stageFromProgress(progress),
    clipCount: done ? video.clipCount || 8 : video.clipCount,
  }
}

/** Latencia fingida para que los estados de carga se vean de verdad. */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function listJobs(): Promise<SourceVideo[]> {
  if (hayServidor()) return pedir<SourceVideo[]>("/jobs")
  await delay(120)
  const now = Date.now()
  // Lo último arriba: un proyecto recién creado se ve sin buscarlo
  return [...almacen.values()]
    .map((video) => simulate(video, now))
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
}

export async function getJob(id: string): Promise<SourceVideo> {
  if (hayServidor()) return pedir<SourceVideo>(`/jobs/${id}`)
  await delay(120)
  const video = almacen.get(id)
  if (!video) throw new JobNotFoundError(id)
  return simulate(video, Date.now())
}

/** Lo que hace falta para dar de alta un trabajo. */
export interface NuevoTrabajo {
  /** El nombre del archivo, tal cual lo subió quien lo subió. */
  title: string
  /** Segundos de video. Cero mientras nadie lo haya medido. */
  duration?: number
  sizeBytes?: number
  /** Idioma declarado en la subida; el análisis lo confirmará. */
  language?: string
  /**
   * Dónde quedó el archivo. Lo rellena el transporte de `lib/api/upload.ts`
   * cuando hay almacenamiento; hoy llega vacío y por eso no se procesa nada de
   * verdad: lo que avanza es la simulación, igual que con las semillas.
   */
  sourceUrl?: string
  /** Una operación sobre el video, en vez del análisis. */
  operacion?: ParametrosOperacion
}

/**
 * Alta de un trabajo de render: la acción central del producto.
 *
 * Cuando exista el servidor, esta función POSTea y devuelve el trabajo con su
 * id de verdad; ni el panel de subida ni `hooks/use-jobs.ts` cambian.
 */
export async function createJob(
  entrada: NuevoTrabajo,
  ahora: number = Date.now()
): Promise<SourceVideo> {
  if (hayServidor()) return pedir<SourceVideo>("/jobs", { method: "POST", body: entrada })
  await delay(300)
  const id = `src_${ahora.toString(36)}`
  const video: SourceVideo = {
    id,
    title: entrada.title,
    duration: entrada.duration ?? 0,
    sizeBytes: entrada.sizeBytes ?? 0,
    uploadedAt: new Date(ahora).toISOString(),
    status: "en-cola",
    stage: "subiendo",
    progress: 0,
    clipCount: 0,
    language: entrada.language ?? "es",
    operacion: entrada.operacion,
  }
  almacen.set(id, video)
  arrancadoEn.set(id, ahora)
  return video
}

/**
 * Reintento de un proyecto en error. Devuelve el trabajo ya reencolado para que
 * la mutación pueda escribirlo en la caché sin esperar al siguiente sondeo.
 */
export async function retryJob(id: string): Promise<SourceVideo> {
  if (hayServidor()) return pedir<SourceVideo>(`/jobs/${id}/retry`, { method: "POST" })
  await delay(400)
  const video = almacen.get(id)
  if (!video) throw new JobNotFoundError(id)
  const reencolado: SourceVideo = {
    ...video,
    status: "en-cola",
    stage: "subiendo",
    progress: 0,
  }
  // Se guarda: si solo se devolviera, el siguiente sondeo leería el original y
  // el reintento se desharía solo a los dos segundos
  almacen.set(id, reencolado)
  arrancadoEn.set(id, Date.now())
  return reencolado
}
