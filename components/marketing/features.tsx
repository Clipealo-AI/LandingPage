import * as React from "react"
import {
  BarChart3,
  Languages,
  PlaySquare,
  Scissors,
  Share2,
  SlidersHorizontal,
  Sparkles,
  Type,
  Users,
  Wand2,
} from "lucide-react"
import { useTranslations } from "next-intl"

import { cn } from "@/lib/utils"
import { useFormat } from "@/hooks/use-format"
import { buildWaveform } from "@/lib/mock-data"
import { PatternIsotipos } from "@/components/brand/patterns"
import { CropFrame } from "@/components/brand/logo"
import { MediaFrame } from "@/components/video/media-frame"
import { Waveform } from "@/components/video/waveform"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { TypeWords } from "@/components/shared/type-words"

/** Etiquetas: `marketing.features.toolbox.<id>`. */
const TOOLBOX = [
  { Icon: Scissors, id: "trim" },
  { Icon: SlidersHorizontal, id: "edit" },
  { Icon: Share2, id: "share" },
  { Icon: Sparkles, id: "ai" },
  { Icon: Users, id: "creators" },
  { Icon: PlaySquare, id: "clips" },
  { Icon: Type, id: "captions" },
  { Icon: BarChart3, id: "analytics" },
] as const

/** Códigos ISO de los subtítulos: no se traducen. */
const IDIOMAS = ["ES", "EN", "PT", "FR", "IT", "DE", "CA", "EU", "GL"] as const

/** Barra de la tarjeta de IA: el mismo valor pinta la barra, la cifra y su llenado. */
const PROGRESO_IA = 77

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
  const f = useFormat()

  return (
    <section id="producto" className="container-page scroll-mt-24 py-20 md:py-28">
      {/* Titular cortado a 12 fps (E5): antetítulo, titular y entradilla escalonados */}
      <div data-motion-group="" className="max-w-2xl">
        <p className="m-anim m-rise text-sm font-semibold tracking-wide text-brand uppercase">
          {t("eyebrow")}
        </p>
        {/* Por debajo de ~400 px «oportunidades.» no cabía en la columna: el titular baja solo
            ahí; desde 400 px mide como antes (2rem y luego 5vw) */}
        <h2 className="m-anim m-cut mt-3 display text-[length:clamp(1.5rem,max(min(calc(9vw_-_0.25rem),2rem),5vw),3.25rem)] [--i:1]">
          {t.rich("title", { br: () => <br /> })}
        </h2>
        <p className="m-anim m-rise mt-5 max-w-lg text-lg text-pretty text-muted-foreground [--i:2]">
          {t("lead")}
        </p>
      </div>

      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {/* IA · fila 1. Al terminar su entrada, la barra se llena */}
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

          <div className="mt-7 rounded-xl bg-background/60 p-4">
            <Waveform
              peaks={peaks}
              progress={0.55}
              selection={{ start: 0.24, end: 0.42 }}
              height={44}
            />
            <div
              className="m-fill mt-4 flex items-center gap-3"
              style={{ "--fill": `${PROGRESO_IA}%` } as React.CSSProperties}
            >
              <Progress value={PROGRESO_IA} className="h-2 flex-1" />
              <span className="text-xs font-semibold tabular-nums">
                {f.percent(PROGRESO_IA)}
              </span>
            </div>
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
              <div className="m-anim m-dim w-24 opacity-40">
                <MediaFrame aspect="16:9" className="ring-white/15" />
              </div>
              <CropFrame size="sm" className="m-crop-corners w-20">
                <MediaFrame aspect="9:16" className="ring-white/15" />
              </CropFrame>
            </div>
          </div>
        </Tile>

        {/* Cita · fila 2. Al terminar su entrada, la frase aparece palabra a
            palabra (E10). Sin luz: sobre naranja no aporta */}
        <Tile className="bg-brand text-brand-foreground ring-transparent">
          <span className="display text-5xl leading-none opacity-80">&ldquo;</span>
          <p className="mt-2 text-[23px] leading-snug font-bold tracking-tight text-balance">
            <TypeWords text={t("quote.text")} at="var(--m-fin-entrada, 250ms)" />
          </p>
          <p className="mt-4 text-sm opacity-75">{t("quote.author")}</p>
        </Tile>

        {/* Subtitulos · fila 2. Al terminar su entrada, los idiomas se iluminan
            en secuencia */}
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

        {/* Herramienta unica · fila 2 */}
        <Tile data-light="claro" className="bg-card md:[--i:2]">
          <h3 className="text-[23px] leading-tight font-bold tracking-tight">
            {t("allInOne.title")}
          </h3>
          <p className="mt-3 text-sm text-muted-foreground">{t("allInOne.body")}</p>
          <ul className="mt-8 grid grid-cols-4 gap-x-4 gap-y-6">
            {TOOLBOX.map(({ Icon, id }) => (
              <li key={id} className="flex flex-col items-center gap-2">
                <Icon className="size-5 text-foreground" aria-hidden />
                <span className="text-center text-[11px] text-muted-foreground">
                  {t(`toolbox.${id}`)}
                </span>
              </li>
            ))}
          </ul>
        </Tile>

        {/* Multiformato · fila 3 */}
        <Tile data-light="claro" className="bg-card md:col-span-1">
          <span className="inline-flex size-11 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
            <Wand2 className="size-5" aria-hidden />
          </span>
          <h3 className="mt-6 text-[23px] leading-tight font-bold tracking-tight">
            {t("multiformat.title")}
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {t("multiformat.body")}
          </p>
          <div className="mt-7 flex items-end gap-2">
            {(["9:16", "4:5", "1:1", "16:9"] as const).map((aspect) => (
              <div key={aspect} className="flex-1 text-center">
                <MediaFrame aspect={aspect} className="rounded-md" />
                <span className="mt-1.5 block text-[10px] text-muted-foreground tabular-nums">
                  {aspect}
                </span>
              </div>
            ))}
          </div>
        </Tile>
      </div>
    </section>
  )
}
