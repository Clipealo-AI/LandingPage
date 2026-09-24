"use client"

import * as React from "react"
import { useTranslations } from "next-intl"

import { cn } from "@/lib/utils"
import { ASPECT_RATIOS, type AspectRatioKey } from "@/lib/types"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export interface AspectSwitcherProps {
  value: AspectRatioKey
  onValueChange: (value: AspectRatioKey) => void
  /** Subconjunto de formatos ofrecidos; por defecto los cuatro. */
  options?: AspectRatioKey[]
  size?: "sm" | "md"
  className?: string
}

/**
 * Selector de formato de salida.
 *
 * Cada opcion dibuja el rectangulo a escala real en lugar de escribir "9:16":
 * el usuario elige donde va a publicar, no una fraccion.
 */
export function AspectSwitcher({
  value,
  onValueChange,
  options = ["9:16", "4:5", "1:1", "16:9"],
  size = "md",
  className,
}: AspectSwitcherProps) {
  const t = useTranslations("common.video")
  const box = size === "sm" ? 16 : 20

  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(next) => next && onValueChange(next as AspectRatioKey)}
      aria-label={t("aspectSwitcher.label")}
      className={cn("w-fit", className)}
    >
      {options.map((key) => {
        const meta = ASPECT_RATIOS[key]
        const label = t(`aspect.${key}.label`)
        const w = meta.ratio >= 1 ? box : box * meta.ratio
        const h = meta.ratio >= 1 ? box / meta.ratio : box

        return (
          <Tooltip key={key}>
            <TooltipTrigger asChild>
              <ToggleGroupItem
                value={key}
                aria-label={`${label} ${key}`}
                className={cn("gap-1.5", size === "sm" ? "h-7 px-2" : "h-9 px-2.5")}
              >
                <span
                  aria-hidden
                  className="grid shrink-0 place-items-center rounded-[3px] border-2 border-current/70"
                  style={{ width: w, height: h }}
                />
                <span
                  className={cn("font-medium", size === "sm" ? "text-[11px]" : "text-xs")}
                >
                  {key}
                </span>
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent>
              {label} · {t(`aspect.${key}.destination`)}
            </TooltipContent>
          </Tooltip>
        )
      })}
    </ToggleGroup>
  )
}
