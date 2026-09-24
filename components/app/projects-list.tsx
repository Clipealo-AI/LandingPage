"use client"

import { ArrowRight, RotateCcw } from "lucide-react"
import { useTranslations } from "next-intl"

import { hrefDinamico, Link } from "@/i18n/navigation"
import { formatTimecode } from "@/lib/format"
import type { SourceVideo } from "@/lib/types"
import { AHORA_DEMO } from "@/lib/fechas"
import { useFormat } from "@/hooks/use-format"
import { useJobs, useRetryJob } from "@/hooks/use-jobs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { MediaFrame } from "@/components/video/media-frame"
import { ProcessingStatus } from "@/components/video/processing-status"

export function ProjectsList({ initialData }: { initialData: SourceVideo[] }) {
  const t = useTranslations("app.projectsList")
  const tv = useTranslations("common.video.operacion")
  const f = useFormat()
  const { data: projects, isFetching } = useJobs(initialData)
  const retry = useRetryJob()

  return (
    <div className="space-y-3">
      <p className="flex h-4 items-center gap-2 text-xs text-muted-foreground">
        {isFetching && (
          <>
            <Spinner className="size-3" />
            {t("refreshing")}
          </>
        )}
      </p>

      <ul className="space-y-3">
        {projects.map((video) => (
          <li
            key={video.id}
            className="rounded-xl bg-card p-3 ring-1 ring-border transition-shadow hover:shadow-sm sm:p-4"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="w-full shrink-0 sm:w-40">
                <MediaFrame
                  aspect="16:9"
                  duration={video.duration}
                  className="rounded-lg"
                />
              </div>

              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="min-w-0 truncate text-sm font-semibold sm:text-base">
                    {video.title}
                  </h2>
                  {/* Una operación no es un análisis: se dice cuál es */}
                  {video.operacion && (
                    <Badge variant="outline">
                      {tv(`${video.operacion.operacion}.label`)}
                    </Badge>
                  )}
                  {video.clipCount > 0 && (
                    <Badge variant="secondary">
                      {t("clipCount", { count: video.clipCount })}
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  {formatTimecode(video.duration)} · {f.bytes(video.sizeBytes)} ·{" "}
                  {f.relative(video.uploadedAt, new Date(AHORA_DEMO))}
                </p>

                <ProcessingStatus
                  stage={video.stage}
                  status={video.status}
                  progress={video.progress}
                />
              </div>

              <div className="flex shrink-0 gap-2 max-sm:w-full">
                {video.status === "error" && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="max-sm:flex-1"
                    disabled={retry.isPending && retry.variables === video.id}
                    onClick={() => retry.mutate(video.id)}
                  >
                    {retry.isPending && retry.variables === video.id ? (
                      <Spinner />
                    ) : (
                      <RotateCcw />
                    )}
                    {t("retry")}
                  </Button>
                )}

                <Button
                  variant={video.status === "listo" ? "default" : "outline"}
                  size="lg"
                  asChild
                  className="max-sm:flex-1"
                >
                  <Link href={hrefDinamico("/proyectos/[id]", { id: video.id })}>
                    {video.status === "listo" ? t("openStudio") : t("viewStatus")}
                    <ArrowRight />
                  </Link>
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
