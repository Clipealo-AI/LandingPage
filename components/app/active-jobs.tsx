"use client"

import { ArrowRight, CircleCheck, RotateCcw } from "lucide-react"
import { useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"
import { formatTimecode } from "@/lib/format"
import type { SourceVideo } from "@/lib/types"
import { isJobActive } from "@/lib/api/jobs"
import { AHORA_DEMO } from "@/lib/fechas"
import { useFormat } from "@/hooks/use-format"
import { useJobs, useRetryJob } from "@/hooks/use-jobs"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { MediaFrame } from "@/components/video/media-frame"
import { ProcessingStatus } from "@/components/video/processing-status"

/**
 * Tarjeta «En proceso» del panel.
 *
 * Comparte la misma consulta que `/proyectos` (misma `queryKey`), así que las
 * dos vistas se actualizan a la vez y solo hay un sondeo en marcha.
 */
export function ActiveJobs({ initialData }: { initialData: SourceVideo[] }) {
  const t = useTranslations("app.activeJobs")
  const tp = useTranslations("app.projectsList")
  const f = useFormat()
  const { data } = useJobs(initialData)
  const reintentar = useRetryJob()
  const activos = data.filter((video) => isJobActive(video) || video.status === "error")

  if (activos.length === 0) {
    return (
      <div className="space-y-4">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <CircleCheck className="size-4 text-success" aria-hidden />
          {t("allDone")}
        </p>
        <Button variant="outline" size="sm" asChild className="w-full">
          <Link href="/proyectos">
            {t("seeAll")} <ArrowRight />
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {activos.map((video) => (
        <div key={video.id} className="space-y-2">
          <div className="flex items-start gap-3">
            <div className="w-16 shrink-0">
              <MediaFrame aspect="16:9" className="rounded-md" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{video.title}</p>
              <p className="text-xs text-muted-foreground">
                {formatTimecode(video.duration)} ·{" "}
                {f.relative(video.uploadedAt, new Date(AHORA_DEMO))}
              </p>
            </div>
          </div>
          <ProcessingStatus
            stage={video.stage}
            status={video.status}
            progress={video.progress}
          />
          {/* Un error sin salida deja al usuario adivinando: el mismo reintento
              de /proyectos, aquí mismo y sobre ese proyecto */}
          {video.status === "error" && (
            <Button
              variant="outline"
              size="sm"
              disabled={reintentar.isPending && reintentar.variables === video.id}
              onClick={() => reintentar.mutate(video.id)}
            >
              {reintentar.isPending && reintentar.variables === video.id ? (
                <Spinner />
              ) : (
                <RotateCcw />
              )}
              {tp("retry")}
            </Button>
          )}
        </div>
      ))}

      <Button variant="outline" size="sm" asChild className="w-full">
        <Link href="/proyectos">
          {t("seeAll")} <ArrowRight />
        </Link>
      </Button>
    </div>
  )
}
