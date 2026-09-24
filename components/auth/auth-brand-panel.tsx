import * as React from "react"
import { Captions, Scissors, Wallet } from "lucide-react"
import { useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"
import { useFormat } from "@/hooks/use-format"
import { AUTH_DEMO_TESTIMONIAL } from "@/lib/comunidad"
import { SOCIAL_NETWORKS } from "@/lib/social"
import { BrandGlow, PatternIsotipos } from "@/components/brand/patterns"
import { Logo } from "@/components/brand/logo"
import { SocialBadge } from "@/components/brand/social"

/** Textos en `auth.brand.benefits`, en este orden. */
const VENTAJAS = [
  { id: "moments", icono: Scissors },
  { id: "ready", icono: Captions },
  { id: "earn", icono: Wallet },
] as const

const ESQUINAS = [
  "top-0 left-0 rounded-tl-[6px] border-r-0 border-b-0",
  "top-0 right-0 rounded-tr-[6px] border-b-0 border-l-0",
  "bottom-0 left-0 rounded-bl-[6px] border-t-0 border-r-0",
  "right-0 bottom-0 rounded-br-[6px] border-t-0 border-l-0",
]

/**
 * Mitad de marca de /login: el escenario oscuro del hero con lo que se gana al
 * entrar. Es siempre oscuro, en los dos temas, como el hero y el pie. En móvil
 * no se pinta: el formulario va primero y la marca queda en la cabecera.
 *
 * El ritmo vertical está apretado a propósito: esta mitad tiene que caber
 * entera en una pantalla de portátil (800 px de alto) sin recortar la cita,
 * porque /login no hace scroll.
 */
export function AuthBrandPanel() {
  const t = useTranslations("auth")
  const f = useFormat()
  // Creadora y cita de demostración, como el resto de la prueba social (`lib/comunidad.ts`)
  const testimonio = AUTH_DEMO_TESTIMONIAL

  return (
    <aside className="relative isolate hidden overflow-hidden bg-ink-950 text-ink-50 lg:flex lg:flex-col">
      <PatternIsotipos opacity={0.14} fade="bottom" />
      <BrandGlow />

      <div className="relative flex flex-1 flex-col justify-between gap-8 p-8 xl:p-10 2xl:p-14">
        <Link href="/" aria-label={t("page.homeLabel")} className="w-fit">
          <Logo size="lg" className="text-ink-50" />
        </Link>

        <div className="max-w-xl space-y-6">
          <div className="relative w-fit px-4 py-3">
            {ESQUINAS.map((c) => (
              <span
                key={c}
                aria-hidden
                className={`absolute size-7 border-4 border-brand ${c}`}
              />
            ))}
            <p className="display text-[clamp(1.75rem,2.6vw,3rem)] leading-[1.05]">
              {t("brand.headline")}
            </p>
          </div>

          <ul className="space-y-4">
            {VENTAJAS.map(({ id, icono: Icono }) => (
              <li key={id} className="flex gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/8 ring-1 ring-white/10">
                  <Icono className="size-5 text-brand-400" aria-hidden />
                </span>
                <span className="space-y-1">
                  <span className="block font-semibold">
                    {t(`brand.benefits.${id}.title`)}
                  </span>
                  <span className="block text-sm text-pretty text-mist/80">
                    {t(`brand.benefits.${id}.text`)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <figure className="max-w-xl space-y-3 rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
          <blockquote className="text-pretty">{t("brand.testimonial.quote")}</blockquote>
          <figcaption className="flex items-center gap-3">
            <SocialBadge network={testimonio.network} tone="marca" size="sm" />
            <span className="text-sm">
              <span className="block font-semibold">{testimonio.name}</span>
              <span className="block text-mist/70">
                {t("brand.testimonial.followers", {
                  followers: f.compact(testimonio.followers),
                  network: SOCIAL_NETWORKS[testimonio.network].name,
                })}
              </span>
            </span>
          </figcaption>
        </figure>
      </div>
    </aside>
  )
}
