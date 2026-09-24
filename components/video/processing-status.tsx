import * as React from "react"
import { Check, CircleAlert, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"

import { cn } from "@/lib/utils"
import { JOB_STAGES, type JobStage, type JobStatus } from "@/lib/types"
import { useFormat } from "@/hooks/use-format"
import { Progress } from "@/components/ui/progress"

export interface ProcessingStatusProps extends React.ComponentProps<"div"> {
  stage: JobStage
  status: JobStatus
  /** 0–100 de la etapa global. */
  progress: number
  /** `inline` para tarjetas de lista; `detail` para la pagina del proyecto. */
  variant?: "inline" | "detail"
}

/**
 * Estado del pipeline de proceso.
 *
 * Nombra la etapa en vez de mostrar solo un porcentaje: durante un render de
 * varios minutos, "Analizando momentos" explica la espera y un 43 % no.
 */
export function ProcessingStatus({
  stage,
  status,
  progress,
  variant = "inline",
  className,
  ...props
}: ProcessingStatusProps) {
  const t = useTranslations("common.video")
  const f = useFormat()
  const currentIndex = JOB_STAGES.indexOf(stage)
  const failed = status === "error"
  const done = status === "listo"

  if (variant === "inline") {
    return (
      <div className={cn("flex items-center gap-2", className)} {...props}>
        {failed ? (
          <CircleAlert className="size-4 shrink-0 text-destructive" aria-hidden />
        ) : done ? (
          <Check className="size-4 shrink-0 text-success" aria-hidden />
        ) : (
          <Loader2 className="size-4 shrink-0 animate-spin text-primary" aria-hidden />
        )}
        <span className="text-sm">
          {failed ? t("processing.failed") : t(`jobStage.${stage}`)}
        </span>
        {!done && !failed && (
          <span className="text-xs text-muted-foreground tabular-nums">
            {f.percent(Math.round(progress))}
          </span>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn("space-y-4", className)}
      role="status"
      aria-live="polite"
      aria-label={t("processing.status", {
        stage: failed ? t("processing.statusError") : t(`jobStage.${stage}`),
      })}
      {...props}
    >
      <Progress
        value={failed ? 100 : progress}
        className={cn(
          "h-2",
          failed && "[&_[data-slot=progress-indicator]]:bg-destructive"
        )}
      />

      <ol className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {JOB_STAGES.map((s, i) => {
          const isDone = done || i < currentIndex
          const isCurrent = !done && i === currentIndex

          return (
            <li key={s} className="flex items-center gap-2">
              <span
                className={cn(
                  "grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-bold transition-colors",
                  isDone && "bg-success/15 text-success",
                  isCurrent && !failed && "bg-brand text-brand-foreground",
                  isCurrent && failed && "bg-destructive text-destructive-foreground",
                  !isDone && !isCurrent && "bg-muted text-muted-foreground"
                )}
              >
                {isDone ? (
                  <Check className="size-3" aria-hidden />
                ) : isCurrent && !failed ? (
                  <span className="size-1.5 animate-pulse rounded-full bg-brand-foreground" />
                ) : (
                  i + 1
                )}
              </span>
              <span
                className={cn(
                  "truncate text-xs",
                  isCurrent ? "font-medium text-foreground" : "text-muted-foreground"
                )}
              >
                {t(`jobStage.${s}`)}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
