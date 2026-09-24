import * as React from "react"
import { Flame, Minus, TrendingUp } from "lucide-react"
import { useTranslations } from "next-intl"

import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export type ScoreTone = "alto" | "medio" | "bajo"

export function scoreTone(score: number): ScoreTone {
  if (score >= 85) return "alto"
  if (score >= 70) return "medio"
  return "bajo"
}

const TONE = {
  alto: {
    // El unico caso en que un dato lleva naranja: "este es el momento"
    className: "bg-brand text-brand-foreground",
    Icon: Flame,
  },
  medio: {
    className: "bg-secondary text-secondary-foreground",
    Icon: TrendingUp,
  },
  bajo: {
    className: "bg-muted text-muted-foreground",
    Icon: Minus,
  },
} as const

export interface ScoreBadgeProps extends React.ComponentProps<"span"> {
  /** 0–100. */
  score: number
  size?: "sm" | "md"
  showLabel?: boolean
  /**
   * Sobre un poster. Las tonalidades medio y bajo usan superficies claras que
   * desaparecen encima de una imagen, asi que ahi se cambian por la del escenario.
   */
  onMedia?: boolean
}

/** Puntuacion de retencion estimada de un clip. */
export function ScoreBadge({
  score,
  size = "md",
  showLabel = true,
  onMedia = false,
  className,
  ...props
}: ScoreBadgeProps) {
  const t = useTranslations("common.video.score")
  const key = scoreTone(score)
  const tone = TONE[key]
  const { Icon } = tone
  const surface =
    onMedia && key !== "alto"
      ? "bg-stage/85 text-stage-foreground backdrop-blur-sm"
      : tone.className

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex w-fit items-center gap-1 rounded-full font-semibold tabular-nums",
            size === "sm" ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-1 text-xs",
            surface,
            className
          )}
          {...props}
        >
          <Icon className={size === "sm" ? "size-3" : "size-3.5"} aria-hidden />
          {score}
          {showLabel && <span className="sr-only">{t("outOf")}</span>}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-56">{t(`help.${key}`)}</TooltipContent>
    </Tooltip>
  )
}
