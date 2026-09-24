"use client"

import * as React from "react"
import { useTranslations } from "next-intl"

import type { UploadItem } from "@/lib/types"
import { simulatedTransport, type UploadTransport } from "@/lib/api/upload"
import { codigoDeError } from "@/lib/api/errores"

export interface UseResumableUploadOptions {
  /** Sustituible por tus-js-client o multipart de S3 sin tocar la interfaz. */
  transport?: UploadTransport
  /** Subidas simultáneas. Más de 3 satura la conexión y ralentiza todas. */
  concurrency?: number
  onCompleted?: (item: UploadItem) => void
  onAllCompleted?: (items: UploadItem[]) => void
}

export interface ResumableUpload {
  items: UploadItem[]
  add: (files: File[]) => void
  pause: (id: string) => void
  resume: (id: string) => void
  retry: (id: string) => void
  remove: (id: string) => void
  clear: () => void
  /** Progreso agregado 0–100, ponderado por tamaño. */
  totalProgress: number
  isUploading: boolean
}

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `up_${Math.random().toString(36).slice(2)}`

/**
 * Cola de subida reanudable.
 *
 * El progreso es **por archivo**, no un número único: es la diferencia entre
 * una barra decorativa y algo que sirve cuando el usuario suelta cuatro videos
 * de 2 GB y uno falla.
 *
 * Los `File` y los `AbortController` viven en refs, no en estado: son objetos
 * no serializables y meterlos en el estado provoca un re-render por cada trozo.
 */
export function useResumableUpload({
  transport = simulatedTransport,
  concurrency = 2,
  onCompleted,
  onAllCompleted,
}: UseResumableUploadOptions = {}): ResumableUpload {
  const tErrores = useTranslations("common.errors")
  const [items, setItems] = React.useState<UploadItem[]>([])
  const files = React.useRef(new Map<string, File>())
  const controllers = React.useRef(new Map<string, AbortController>())
  const running = React.useRef(new Set<string>())

  const patch = React.useCallback((id: string, next: Partial<UploadItem>) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...next } : item))
    )
  }, [])

  const run = React.useCallback(
    async (id: string, offset: number) => {
      const file = files.current.get(id)
      if (!file || running.current.has(id)) return

      running.current.add(id)
      const controller = new AbortController()
      controllers.current.set(id, controller)
      patch(id, { status: "subiendo", error: undefined })

      try {
        const result = await transport.upload({
          file,
          offset,
          signal: controller.signal,
          onProgress: (uploadedBytes) => patch(id, { uploadedBytes }),
        })

        if (result.completed) {
          patch(id, {
            status: "completado",
            uploadedBytes: result.uploadedBytes,
            url: result.url,
          })
          // El elemento actualizado no está aún en `items`: se recompone aquí
          const file = files.current.get(id)
          if (file) {
            onCompleted?.({
              id,
              name: file.name,
              size: file.size,
              uploadedBytes: result.uploadedBytes,
              status: "completado",
              // Vacío mientras no haya almacenamiento: quien lo reciba lo sabe
              url: result.url,
            })
          }
        } else if (controller.signal.aborted) {
          patch(id, { status: "pausado", uploadedBytes: result.uploadedBytes })
        }
      } catch (error) {
        // El código, no el `error.message`: ese texto lo escribe el servidor,
        // en su idioma, y acababa pintado en la fila del archivo
        patch(id, { status: "error", error: tErrores(codigoDeError(error)) })
      } finally {
        running.current.delete(id)
        controllers.current.delete(id)
      }
    },
    [transport, patch, onCompleted, tErrores]
  )

  // Planificador: arranca lo que esté en cola hasta el límite de concurrencia
  React.useEffect(() => {
    const libres = concurrency - running.current.size
    if (libres <= 0) return

    const pendientes = items
      .filter((item) => item.status === "en-cola" && !running.current.has(item.id))
      .slice(0, libres)

    for (const item of pendientes) void run(item.id, item.uploadedBytes)
  }, [items, concurrency, run])

  // Aviso de fin de tanda
  const previousDone = React.useRef(0)
  React.useEffect(() => {
    if (items.length === 0) {
      previousDone.current = 0
      return
    }
    const done = items.filter((item) => item.status === "completado").length
    if (done === items.length && previousDone.current !== done) {
      onAllCompleted?.(items)
    }
    previousDone.current = done
  }, [items, onAllCompleted])

  React.useEffect(() => {
    const pending = controllers.current
    return () => {
      pending.forEach((controller) => controller.abort())
      pending.clear()
    }
  }, [])

  const add = React.useCallback((incoming: File[]) => {
    const nuevos = incoming.map((file) => {
      const id = newId()
      files.current.set(id, file)
      return {
        id,
        name: file.name,
        size: file.size,
        uploadedBytes: 0,
        status: "en-cola" as const,
      }
    })
    setItems((current) => [...current, ...nuevos])
  }, [])

  const pause = React.useCallback(
    (id: string) => {
      controllers.current.get(id)?.abort()
      patch(id, { status: "pausado" })
    },
    [patch]
  )

  const resume = React.useCallback(
    (id: string) => patch(id, { status: "en-cola" }),
    [patch]
  )

  const retry = React.useCallback(
    // Reintentar conserva los bytes ya confirmados: eso es reanudar, no repetir
    (id: string) => patch(id, { status: "en-cola", error: undefined }),
    [patch]
  )

  const remove = React.useCallback((id: string) => {
    controllers.current.get(id)?.abort()
    controllers.current.delete(id)
    files.current.delete(id)
    setItems((current) => current.filter((item) => item.id !== id))
  }, [])

  const clear = React.useCallback(() => {
    controllers.current.forEach((controller) => controller.abort())
    controllers.current.clear()
    files.current.clear()
    setItems([])
  }, [])

  const totalBytes = items.reduce((sum, item) => sum + item.size, 0)
  const doneBytes = items.reduce((sum, item) => sum + item.uploadedBytes, 0)

  return {
    items,
    add,
    pause,
    resume,
    retry,
    remove,
    clear,
    totalProgress: totalBytes === 0 ? 0 : (doneBytes / totalBytes) * 100,
    isUploading: items.some(
      (item) => item.status === "subiendo" || item.status === "en-cola"
    ),
  }
}
