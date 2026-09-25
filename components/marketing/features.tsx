import * as React from "react"
import Image from "next/image"
import { Languages, Scissors, Share2, SlidersHorizontal, Sparkles } from "lucide-react"
import { useTranslations } from "next-intl"

import { cn } from "@/lib/utils"
import { buildWaveform } from "@/lib/mock-data"
import { PatternIsotipos } from "@/components/brand/patterns"
import { CropFrame } from "@/components/brand/logo"
import { MediaFrame } from "@/components/video/media-frame"
import { Waveform } from "@/components/video/waveform"
import { Badge } from "@/components/ui/badge"

/** Etiquetas: `marketing.features.toolbox.<id>`. */
const TOOLBOX = [
  { Icon: Scissors, id: "trim" },
  { Icon: SlidersHorizontal, id: "edit" },
  { Icon: Share2, id: "share" },
] as const

/** Tres idiomas visibles como muestra; el catálogo de cada plan decide el resto. */
const IDIOMAS = ["ES", "EN", "PT"] as const

const peaks = buildWaveform(56, 3, [0.3, 0.62])

/**
 * Tarjeta de la rejilla. Cada una es su propio grupo de movimiento (E9): sube
 * con fundido al entrar en pantalla, así que en móvil cada una entra al llegar.
 * En escritorio la de la derecha de cada fila entra 80 ms después: su `--i`
 * desde `md`, siempre como clase literal. `.m-tarjeta` calcula cuándo
 * termina esa entrada (`--m-fin-entrada`) y de ahí cuelgan sus gestos
 * (app/motion/features.css).
 *
 * Grupo, movimiento y luz son atributos y clases estáticos: la tarjeta sigue
 * siendo de servidor. Con `data-light` no lleva `transition-*` ni imagen de
 * fondo propias (las pisaría la luz de app/motion/base.css).
 */
function Tile({ className, children, ...props }: React.ComponentProps<"article">) {
  return (
    <article
      data-motion-group=""
      className={cn(
        "m-anim m-rise m-tarjeta relative overflow-hidden rounded-frame p-6 ring-1 ring-border sm:p-8",
        className
      )}
      {...props}
    >
      {children}
    </article>
  )
}

export function Features() {
  const t = useTranslations("marketing.features")

  return (
    <section id="producto" className="container-page scroll-mt-24 py-20 md:py-28">
      {/* Titular cortado a 12 fps (E5): antetítulo, titular y entradilla escalonados */}
      <div data-motion-group="" className="max-w-2xl">
        <p className="m-anim m-rise text-sm font-semibold tracking-wide text-brand uppercase">
          {t("eyebrow")}
        </p>
        {/* Tamaño fluido para conservar el titular completo en pantallas estrechas. */}
        <h2 className="m-anim m-cut mt-3 display text-[length:clamp(1.5rem,max(min(calc(9vw_-_0.25rem),2rem),5vw),3.25rem)] [--i:1]">
          {t.rich("title", { br: () => <br /> })}
        </h2>
        <p className="m-anim m-rise mt-5 max-w-lg text-lg text-pretty text-muted-foreground [--i:2]">
          {t("lead")}
        </p>
      </div>

      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {/* IA · fila 1. Una selección concreta, sin porcentaje de progreso ficticio. */}
        <Tile
          data-light="claro"
          className="bg-secondary text-secondary-foreground md:col-span-2"
        >
          <span className="inline-flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="size-5" aria-hidden />
          </span>
          <h3 className="mt-6 text-[23px] leading-tight font-bold tracking-tight">
            {t("ai.title")}
          </h3>
          <p className="mt-3 max-w-md text-sm leading-relaxed opacity-80">
            {t("ai.body")}
          </p>

          <div className="mt-7 rounded-xl bg-background/70 p-4">
            <Waveform
              peaks={peaks}
              progress={0.55}
              selection={{ start: 0.24, end: 0.42 }}
              height={44}
            />
            <p className="mt-3 text-xs font-medium opacity-75">{t("ai.visual")}</p>
          </div>
        </Tile>

        {/* Vertical · fila 1. Al terminar su entrada, el 16:9 se apaga y las
            esquinas del 9:16 se cierran: el único gesto de marca de recorte de
            la sección */}
        <Tile data-light="tinta" className="bg-ink-950 text-mist md:[--i:1]">
          <PatternIsotipos opacity={0.2} />
          <div className="relative">
            <h3 className="text-[23px] leading-tight font-bold tracking-tight text-white">
              {t("vertical.title")}
            </h3>
            <p className="mt-3 text-sm leading-relaxed opacity-75">
              {t("vertical.body")}
            </p>

            <div className="mt-7 flex items-end justify-center gap-3">
              <div className="m-anim m-dim w-32 opacity-70">
                <MediaFrame aspect="16:9" className="ring-white/15">
                  <Image
                    src="/media/podcast-source.webp"
                    alt=""
                    fill
                    sizes="128px"
                    className="object-cover"
                  />
                </MediaFrame>
              </div>
              <CropFrame size="sm" className="m-crop-corners w-24">
                <MediaFrame aspect="9:16" className="ring-white/15">
                  <Image
                    src="/media/podcast-source.webp"
                    alt=""
                    fill
                    sizes="96px"
                    className="object-cover object-[76%_center]"
                  />
                </MediaFrame>
              </CropFrame>
            </div>
          </div>
        </Tile>

        {/* Subtítulos · fila 2. La muestra evita atribuir nueve idiomas a todos
            los planes; la comparativa cuenta qué incluye cada uno. */}
        <Tile data-light="claro" className="bg-card md:[--i:1]">
          <span className="inline-flex size-11 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
            <Languages className="size-5" aria-hidden />
          </span>
          <h3 className="mt-6 text-[23px] leading-tight font-bold tracking-tight">
            {t("captions.title")}
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {t("captions.body")}
          </p>
          <div className="m-karaoke mt-6 flex flex-wrap gap-1.5">
            {IDIOMAS.map((lang, n) => (
              <Badge
                key={lang}
                variant="outline"
                className="m-anim m-light tabular-nums"
                style={{ "--i": n } as React.CSSProperties}
              >
                {lang}
              </Badge>
            ))}
          </div>
        </Tile>

        {/* Del corte a la publicación, sin una rejilla de funciones de relleno. */}
        <Tile data-light="claro" className="bg-card md:col-span-2 md:[--i:2]">
          <h3 className="text-[23px] leading-tight font-bold tracking-tight">
            {t("allInOne.title")}
          </h3>
          <p className="mt-3 text-sm text-muted-foreground">{t("allInOne.body")}</p>
          <ul className="mt-8 grid grid-cols-3 gap-4 border-t border-border pt-6">
            {TOOLBOX.map(({ Icon, id }) => (
              <li
                key={id}
                className="flex min-w-0 flex-col items-center gap-2 text-center"
              >
                <span className="grid size-11 place-items-center rounded-xl bg-secondary">
                  <Icon className="size-5 text-foreground" aria-hidden />
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  {t(`toolbox.${id}`)}
                </span>
              </li>
            ))}
          </ul>
        </Tile>
      </div>
    </section>
  )
}
