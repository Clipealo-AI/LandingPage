"use client"

import * as React from "react"
import { ArrowRight, Play, Sparkles } from "lucide-react"
import { useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BrandGlow, PatternIsotipos } from "@/components/brand/patterns"
import { RubiusPreview } from "@/components/marketing/rubius-preview"

const CORNERS = [
  {
    key: "tl",
    className: "-top-2 -left-2 rounded-tl-lg border-r-0 border-b-0",
    delay: 0.45,
  },
  {
    key: "tr",
    className: "-top-2 -right-2 rounded-tr-lg border-b-0 border-l-0",
    delay: 0.55,
  },
  {
    key: "bl",
    className: "-bottom-2 -left-2 rounded-bl-lg border-t-0 border-r-0",
    delay: 0.65,
  },
  {
    key: "br",
    className: "-bottom-2 -right-2 rounded-br-lg border-t-0 border-l-0",
    delay: 0.75,
  },
]

/**
 * Hero.
 *
 * La primera pantalla se monta al cargar, solo con CSS (`app/motion/hero.css`),
 * antes de hidratar y terminada en 2 s (AGENTS.md, regla 5): el badge y la
 * fila de acciones suben, las esquinas de recorte encuadran el titular, un
 * cabezal lo barre, el claim aparece con un brillo y el halo se enciende. El
 * `h1` y la descripción (candidatos a LCP) están pintados y quietos desde el
 * primer fotograma: ni ellos ni sus antepasados llevan animación.
 *
 * La vista previa hace una demo al revelarse. Con «reducir movimiento» todo se
 * sigue viendo: lo que sube o escala funde en su sitio y el barrido destella.
 */
export function Hero() {
  const t = useTranslations("marketing")
  const tc = useTranslations("common.meta")

  return (
    <section className="relative isolate overflow-hidden bg-ink-950 pt-32 pb-20 sm:pt-40 md:pb-28">
      <PatternIsotipos opacity={0.16} fade="bottom" />
      {/* Solo `className`: el `style` de BrandGlow define el fondo */}
      <BrandGlow className="m-load m-load-glow" />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-ink-950 to-transparent"
      />

      <div className="relative container-page">
        <div className="mx-auto max-w-5xl text-center">
          {/* El hero es una superficie siempre oscura: no puede heredar los
              tokens del tema claro o cambiaria de aspecto entre temas */}
          <Badge
            variant="outline"
            className="m-load m-load-rise mb-8 h-7 gap-1.5 border-white/15 bg-white/8 px-3 text-xs text-brand-300 backdrop-blur-sm"
            style={{ "--d": "100ms" } as React.CSSProperties}
          >
            <Sparkles aria-hidden />
            {t("hero.badge")}
          </Badge>

          <div className="relative inline-block px-4 py-5 sm:px-8 sm:py-6">
            {/* El movimiento de carga va en CSS a proposito: es la pieza de
                marca mas visible y no puede depender de que el JS haya
                hidratado para verse. */}
            {CORNERS.map((corner) => (
              <span
                key={corner.key}
                aria-hidden
                className={`absolute size-8 animate-crop-in border-4 border-brand sm:size-10 ${corner.className}`}
                style={{ animationDelay: `${corner.delay}s` }}
              />
            ))}

            <h1 className="display text-[clamp(1.9rem,5.6vw,5rem)] text-ink-50">
              {t.rich("hero.title", { br: () => <br /> })}
            </h1>

            {/* Barrido del cabezal (E2): capa hermana del h1, que no se anima */}
            <span aria-hidden className="m-sweep" />
          </div>

          <p className="mx-auto mt-8 max-w-xl text-base text-pretty text-mist/80 sm:text-lg">
            {tc("description")}
          </p>

          {/* Se anima la fila y no los botones: su pulsación queda intacta */}
          <div
            className="m-load m-load-rise mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
            style={{ "--d": "300ms" } as React.CSSProperties}
          >
            <Button variant="brand" size="xl" asChild className="w-full sm:w-auto">
              <Link href="https://app.clipealo-ai.com/">
                {t("actions.upload")} <ArrowRight className="m-nudge" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="xl"
              asChild
              className="w-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white active:bg-white/15 sm:w-auto"
            >
              <Link href="#como-funciona">
                <Play className="m-nudge fill-current" /> {t("hero.howItWorks")}
              </Link>
            </Button>
          </div>

          {/* El brillo va en el span: así mide lo que mide el texto en cada idioma */}
          <p className="mt-6 text-sm text-mist/45">
            <span className="m-claim-sweep">{t("claim")}</span>
          </p>
        </div>

        <RubiusPreview />
      </div>
    </section>
  )
}
