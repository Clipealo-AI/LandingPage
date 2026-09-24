"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"

import type { SourceVideo } from "@/lib/types"
import {
  createJob,
  jobKeys,
  getJob,
  isJobActive,
  JobNotFoundError,
  listJobs,
  retryJob,
  type NuevoTrabajo,
} from "@/lib/api/jobs"
import { toast } from "@/lib/toast"
import { codigoDeError } from "@/lib/api/errores"

export { jobKeys }

/** Cada cuánto se pregunta mientras hay trabajo en curso. */
const POLL_MS = 2_000

/**
 * Listado de proyectos con sondeo automático.
 *
 * `refetchInterval` devuelve `false` en cuanto no queda ningún trabajo activo:
 * el sondeo se apaga solo, sin un `useEffect` que limpie temporizadores ni
 * riesgo de dejar la pestaña preguntando para siempre.
 *
 * `initialData` es obligatorio y viene del render de servidor: la primera
 * pintura no tiene estado de carga, no hay desajuste de hidratación y `data`
 * queda tipado como definido, sin comprobaciones de `undefined` en cada vista.
 */
export function useJobs(initialData: SourceVideo[]) {
  return useQuery({
    queryKey: jobKeys.list(),
    queryFn: listJobs,
    initialData,
    refetchInterval: (query) => (query.state.data?.some(isJobActive) ? POLL_MS : false),
    // Mientras algo procesa sí interesa refrescar al volver a la pestaña
    refetchOnWindowFocus: (query) => Boolean(query.state.data?.some(isJobActive)),
  })
}

export function useJobStatus(id: string, initialData?: SourceVideo) {
  return useQuery({
    queryKey: jobKeys.detail(id),
    queryFn: () => getJob(id),
    initialData,
    refetchInterval: (query) => (isJobActive(query.state.data) ? POLL_MS : false),
  })
}

/**
 * Dar de alta un proyecto: lo que pasa al pulsar «Procesar videos».
 *
 * Escribe el trabajo en la caché de la lista en vez de invalidarla, igual que
 * el reintento: quien acaba de pulsar ve su proyecto en /proyectos sin esperar
 * al siguiente sondeo, y el sondeo arranca solo porque nace «en cola».
 */
export function useCrearTrabajo() {
  const queryClient = useQueryClient()
  const t = useTranslations("app.jobs")
  const tErrores = useTranslations("common.errors")

  return useMutation({
    mutationFn: (entrada: NuevoTrabajo) => createJob(entrada),
    onSuccess: (job) => {
      queryClient.setQueryData(jobKeys.detail(job.id), job)
      queryClient.setQueryData<SourceVideo[]>(jobKeys.list(), (current) =>
        current ? [job, ...current] : [job]
      )
    },
    onError: (error) =>
      toast.error(t("createFailed"), { description: tErrores(codigoDeError(error)) }),
  })
}

export function useRetryJob() {
  const queryClient = useQueryClient()
  const t = useTranslations("app.jobs")
  const tErrores = useTranslations("common.errors")

  return useMutation({
    mutationFn: retryJob,
    onSuccess: (job) => {
      // Se escribe el resultado en la caché en vez de invalidar: la fila cambia
      // de estado al instante y el sondeo arranca en el siguiente ciclo.
      queryClient.setQueryData(jobKeys.detail(job.id), job)
      queryClient.setQueryData<SourceVideo[]>(jobKeys.list(), (current) =>
        current?.map((item) => (item.id === job.id ? job : item))
      )
      toast.success(t("requeued"), { description: job.title })
    },
    onError: (error) =>
      toast.error(t("retryFailed"), {
        // Un error conocido se traduce; uno ajeno (red, servidor) llega con su propio texto
        // Un error conocido del dominio se dice con su id; cualquier otro, con
        // su código traducido, nunca con el texto que mandó el servidor
        description:
          error instanceof JobNotFoundError
            ? t("notFound", { id: error.jobId })
            : tErrores(codigoDeError(error)),
      }),
  })
}
