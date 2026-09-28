import Image from "next/image"
import { Check } from "lucide-react"
import { useTranslations } from "next-intl"

import { socialList } from "@/lib/social"
import { PatternIsotipos } from "@/components/brand/patterns"
import { SocialBadge } from "@/components/brand/social"
import { MediaFrame } from "@/components/video/media-frame"

const VENTAJAS = ["formats", "limit", "schedule"] as const

const FORMATS = [
  { id: "wide", label: "16:9", className: "w-full max-w-[236px]" },
  { id: "square", label: "1:1", className: "w-full max-w-[148px]" },
  { id: "portrait", label: "9:16", className: "w-full max-w-[132px]" },
  { id: "blur", label: "9:16", className: "w-full max-w-[132px]" },
] as const

const WIDE = "/media/networks-podcast-16x9.avif"
const SQUARE = "/media/networks-podcast-1x1.avif"
const PORTRAIT = "/media/networks-podcast-man-9x16.avif"

/** Una sola muestra del mismo contenido en cuatro encuadres. */
export function Redes() {
  const t = useTranslations("marketing.networks")
  const tc = useTranslations("common")

  return (
    <section id="redes" className="container-page scroll-mt-24 py-20 md:py-28">
      <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,32rem)_1fr] lg:gap-16">
        <div data-motion-group="">
          <p className="m-anim m-rise text-sm font-semibold tracking-wide text-brand uppercase">
            {t("eyebrow")}
          </p>
          <h2 className="m-anim m-cut mt-3 display text-[clamp(1.75rem,3.4vw,2.75rem)] [--i:1]">
            {t.rich("title", { br: () => <br /> })}
          </h2>
          <p className="m-anim m-rise mt-5 max-w-md text-lg text-pretty text-muted-foreground [--i:2]">
            {t("lead")}
          </p>

          <ul className="mt-8 grid gap-2 min-[360px]:grid-cols-2" aria-label={t("list")}>
            {socialList.map((red) => (
              <li key={red.id} data-social-card={red.id}>
                <div
                  data-light="claro"
                  className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5"
                >
                  <SocialBadge network={red.id} size="sm" tone="marca" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">
                      {red.name}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {tc(`social.surface.${red.id}`)}
                    </span>
                  </span>
                </div>
              </li>
            ))}
          </ul>

          <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
            {VENTAJAS.map((id) => (
              <li key={id} className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                {t(`bullets.${id}`)}
              </li>
            ))}
          </ul>
          <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
            {t("planNote")}
          </p>
        </div>

        <div
          data-motion-group=""
          className="relative w-full max-w-[860px] justify-self-center overflow-hidden rounded-frame bg-stage p-4 sm:p-5 xl:p-6"
        >
          <PatternIsotipos opacity={0.16} data-redes-patron />
          <div
            role="region"
            aria-label={t("formatsGallery")}
            tabIndex={0}
            className="relative overflow-x-auto py-3 focus-visible:rounded-md focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand"
          >
            <div className="mx-auto grid max-w-[760px] min-w-[580px] grid-cols-[minmax(0,1.7fr)_minmax(0,1.05fr)_minmax(0,.92fr)_minmax(0,.92fr)] items-end gap-4 px-2">
              {FORMATS.map((format) => (
                <figure
                  key={format.id}
                  className="flex min-w-0 flex-col items-center gap-3"
                >
                  <div className={format.className}>
                    {format.id === "wide" && (
                      <MediaFrame aspect="16:9" className="ring-white/15">
                        <Image
                          src={WIDE}
                          alt=""
                          fill
                          sizes="236px"
                          className="object-cover"
                        />
                      </MediaFrame>
                    )}
                    {format.id === "square" && (
                      <div className="relative aspect-square overflow-hidden rounded-xl bg-ink-950 ring-1 ring-white/15">
                        <Image
                          src={SQUARE}
                          alt=""
                          fill
                          sizes="148px"
                          className="object-cover"
                        />
                      </div>
                    )}
                    {format.id === "portrait" && (
                      <MediaFrame aspect="9:16" className="ring-white/15">
                        <Image
                          src={PORTRAIT}
                          alt=""
                          fill
                          sizes="132px"
                          className="object-cover"
                        />
                      </MediaFrame>
                    )}
                    {format.id === "blur" && (
                      <MediaFrame aspect="9:16" className="ring-white/15">
                        <Image
                          src={WIDE}
                          alt=""
                          fill
                          sizes="132px"
                          className="scale-110 object-cover blur-md"
                        />
                        <div className="absolute inset-x-0 top-[38%] aspect-video overflow-hidden">
                          <Image
                            src={WIDE}
                            alt=""
                            fill
                            sizes="132px"
                            className="object-cover"
                          />
                        </div>
                        <span className="absolute inset-x-1 top-[11%] text-center text-[11px] leading-tight font-bold text-white [text-shadow:0_1px_3px_#000]">
                          {t("hook")}
                        </span>
                        <span className="absolute inset-x-1 bottom-[10%] text-center text-[11px] leading-tight font-bold text-white [text-shadow:0_1px_3px_#000]">
                          {t("transcript")}
                        </span>
                      </MediaFrame>
                    )}
                  </div>
                  <figcaption className="text-center text-xs font-semibold text-stage-foreground">
                    {format.id === "blur" ? t("blurFormat") : format.label}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
