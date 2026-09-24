"use client"

import { RotateCcw } from "lucide-react"
import { useTranslations } from "next-intl"

import { useRouter } from "@/i18n/navigation"
import { formatTimecode } from "@/lib/format"
import type { SourceVideo } from "@/lib/types"
import { useJobs, useRetryJob } from "@/hooks/use-jobs"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { ProcessingStatus } from "@/components/video/processing-status"

/**
 * Un proyecto que todavía no tiene clips: en cola, procesando o en error.
 *
 * Sondea como la lista (`hooks/use-jobs.ts`) y, cuando termina, ofrece ver los
 * clips en vez de aparecerlos solo: los clips los pinta el servidor, así que
 * hace falta volver a pedir la página y es más honesto decirlo que dejar la
 * pantalla en «listo» y vacía.
 */
export function ProyectoProceso({
  video,
  proyectos,
}: {
  video: SourceVideo
  /**
   * TODOS los proyectos, no solo este. La consulta es compartida (misma
   * `queryKey` que /proyectos y que «En proceso» del panel), así que sembrarla
   * con una lista de uno dejaba la lista entera y la tarjeta del panel con un
   * solo proyecto hasta recargar.
   */
  proyectos: SourceVideo[]
}) {
  const t = useTranslations("app.proyecto")
  const tl = useTranslations("app.projectsList")
  const router = useRouter()
  const { data } = useJobs(proyectos)
  const retry = useRetryJob()
  const actual = data.find((v) => v.id === video.id) ?? video
  const reintentando = retry.isPending && retry.variables === video.id

  return (
    <section
      className="space-y-4 rounded-xl bg-card p-6 ring-1 ring-border"
      aria-label={t("procesoTitulo")}
    >
      <div className="space-y-1">
        <h2 className="text-sm font-semibold">{t("procesoTitulo")}</h2>
        <p className="text-xs text-muted-foreground">
          {formatTimecode(actual.duration)} · {t("procesoAyuda")}
        </p>
      </div>

      <ProcessingStatus
        stage={actual.stage}
        status={actual.status}
        progress={actual.progress}
      />

      <div className="flex flex-wrap gap-2">
        {actual.status === "error" && (
          <Button
            variant="outline"
            disabled={reintentando}
            onClick={() => retry.mutate(video.id)}
          >
            {reintentando ? <Spinner /> : <RotateCcw />}
            {tl("retry")}
          </Button>
        )}
        {actual.status === "listo" && (
          <Button onClick={() => router.refresh()}>{t("verClips")}</Button>
        )}
      </div>
    </section>
  )
}
