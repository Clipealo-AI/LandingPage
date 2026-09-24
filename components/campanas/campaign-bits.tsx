"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  Check,
  GraduationCap,
  Info,
  LayoutGrid,
  Lock,
  Music,
  Star,
  Store,
  Users,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import type { Campana, Categoria, EstadoVisto } from "@/lib/campanas"
import { SOCIAL_NETWORKS } from "@/lib/social"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { PatternIsotipos } from "@/components/brand/patterns"
import { SocialGlyph } from "@/components/brand/social"

export const ICONO_CATEGORIA: Record<Categoria | "todas", LucideIcon> = {
  todas: LayoutGrid,
  influencers: Users,
  musica: Music,
  marcas: Store,
  infoproductores: GraduationCap,
}

// Qué significa cada cifra de una campaña: los textos de ayuda viven en `campaigns.help`

/** Icono (i) con su explicación. Se abre con el ratón y con el teclado. */
export function InfoHint({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  const t = useTranslations("campaigns.bits")
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={t("whatIs", { label })}
          className="-my-1 size-5 rounded-full text-muted-foreground"
        >
          <Info className="size-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent className="max-w-64 text-pretty">{children}</TooltipContent>
    </Tooltip>
  )
}

const TONO_ESTADO: Record<EstadoVisto, React.ComponentProps<typeof Badge>["variant"]> = {
  activa: "success",
  pausada: "secondary",
  agotada: "outline",
  finalizada: "success",
  // Vencida y cerrada no son un fallo: son el final normal de una campaña
  vencida: "outline",
  cerrada: "secondary",
}

export function EstadoBadge({
  estado,
  className,
  sobreOscuro = false,
}: {
  estado: EstadoVisto
  className?: string
  /**
   * Sobre la portada, que es oscura en los dos temas. Los tonos «outline» y
   * «secondary» llevan el texto en tinta y ahí no se leían («Agotada» en
   * claro): va en píldora blanca, como la de las redes.
   */
  sobreOscuro?: boolean
}) {
  const t = useTranslations("campaigns.status")
  // «Finalizada» en verde sólido con check: se lee como terminada y no se confunde con
  // «Activa», que va en verde suave. Tinta sobre success-500 (7:1) en los dos temas.
  if (estado === "finalizada") {
    return (
      <Badge
        className={cn(
          "gap-1 border-transparent bg-success-500 text-ink-950",
          sobreOscuro && "shadow-sm",
          className
        )}
      >
        <Check aria-hidden data-icon="inline-start" strokeWidth={3} />
        {t(estado)}
      </Badge>
    )
  }
  if (sobreOscuro) {
    return (
      <Badge
        className={cn("border-transparent bg-white text-ink-900 shadow-sm", className)}
      >
        {t(estado)}
      </Badge>
    )
  }
  return (
    <Badge variant={TONO_ESTADO[estado]} className={className}>
      {t(estado)}
    </Badge>
  )
}

export function RedesPill({
  redes,
  className,
}: {
  redes: Campana["redes"]
  className?: string
}) {
  const t = useTranslations("campaigns.bits")
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-white px-2 py-1 shadow-sm",
        className
      )}
      aria-label={t("networks", {
        list: redes.map((r) => SOCIAL_NETWORKS[r].name).join(", "),
      })}
      role="img"
    >
      {redes.map((r) => (
        <SocialGlyph
          key={r}
          network={r}
          tone="official"
          className="size-4 text-black"
          aria-hidden
        />
      ))}
    </span>
  )
}

/**
 * Portada de la campaña. Sin imágenes subidas, es la superficie de escenario de
 * la marca (tinta con isotipos) con el nombre del anunciante: se distinguen por
 * el nombre y la categoría, no por una foto. Es siempre oscura, en los dos temas.
 */
export function CampaignCover({
  campana,
  estado,
  className,
  size = "md",
}: {
  campana: Campana
  estado: EstadoVisto
  className?: string
  size?: "md" | "lg"
}) {
  const t = useTranslations("campaigns.bits")
  const Icono = ICONO_CATEGORIA[campana.categoria]
  return (
    <div
      className={cn(
        "relative isolate overflow-hidden bg-ink-950",
        size === "lg" ? "aspect-[21/9]" : "aspect-[16/9]",
        className
      )}
    >
      <PatternIsotipos opacity={0.12} />
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(70% 80% at 80% 0%, color-mix(in oklab, var(--color-blue-500) 22%, transparent), transparent 70%)",
        }}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
        <Icono className="size-5 text-brand-400" aria-hidden />
        <span
          className={cn(
            "line-clamp-2 font-black tracking-tight text-balance text-ink-50",
            size === "lg" ? "text-3xl" : "text-xl"
          )}
        >
          {campana.marca}
        </span>
        {campana.serie && (
          <span className="text-xs font-medium tracking-[0.16em] text-mist uppercase">
            {t("series")}
          </span>
        )}
      </div>

      <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
        <span className="flex flex-wrap gap-1.5">
          {campana.destacada && (
            <Badge variant="brand" className="gap-1">
              <Star className="fill-current" aria-hidden /> {t("featured")}
            </Badge>
          )}
          {campana.privada && (
            <Badge className="gap-1 border-transparent bg-white text-ink-900 shadow-sm">
              <Lock aria-hidden /> {t("private")}
            </Badge>
          )}
        </span>
        {estado !== "activa" && <EstadoBadge estado={estado} sobreOscuro />}
      </div>

      <RedesPill redes={campana.redes} className="absolute bottom-3 left-3" />
    </div>
  )
}
