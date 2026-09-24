import * as React from "react"
import Image from "next/image"
import {
  GraduationCap,
  Headphones,
  Landmark,
  Mic,
  Newspaper,
  Podcast,
  Radio,
  Store,
  Tv,
  Users,
} from "lucide-react"
import { useTranslations } from "next-intl"

import { cn } from "@/lib/utils"
import {
  BRANDS,
  CLIENT_CHANNELS,
  type BrandProof,
  type ClientNetwork,
} from "@/lib/comunidad"
import { SocialGlyph } from "@/components/brand/social"
import {
  KickIcon,
  TwitchIcon,
  type SocialIconProps,
} from "@/components/brand/social-icons"
import { Marquee } from "@/components/shared/marquee"

const ICONO: Record<
  BrandProof["icon"],
  React.ComponentType<React.ComponentProps<"svg">>
> = {
  podcast: Podcast,
  radio: Radio,
  newspaper: Newspaper,
  store: Store,
  graduation: GraduationCap,
  headphones: Headphones,
  tv: Tv,
  landmark: Landmark,
  mic: Mic,
  users: Users,
}

function ChannelNetworkGlyph({
  network,
  ...props
}: { network: ClientNetwork } & SocialIconProps) {
  if (network === "kick") return <KickIcon {...props} />
  if (network === "twitch") return <TwitchIcon {...props} />
  return <SocialGlyph network={network} {...props} />
}

/**
 * Prueba social: quién publica con Clipealo.
 *
 * Tiene el único bucle de la landing (AGENTS.md, regla 5): dos filas en
 * carrusel continuo, los creadores de derecha a izquierda y las marcas de
 * izquierda a derecha, para que la franja entre el hero y el reencuadre tenga
 * vida sin pedir un clic. Va sobre el mismo ink-950 que las secciones vecinas
 * para leerse como una sola superficie oscura.
 *
 * El carrusel se mueve siempre, también con «reducir movimiento» activado en el
 * sistema (decisión de producto). Sin botón de pausa, también por decisión de
 * producto; pasar el ratón por encima detiene la fila.
 *
 * Su único gesto de marca: la cifra de la audiencia se encuadra una vez con la
 * marca de recorte (`data-crop-mark`, `app/motion/comunidad.css`). Si ya se ve
 * al cargar, espera a que terminen las esquinas del hero (`data-motion-after`);
 * si no, se lanza al entrar en pantalla. Parte invisible, así que no oculta
 * nada. Con «reducir» la marca aparece y se va en su sitio, sin escalar. La
 * cifra no se parte (`whitespace-nowrap`): partida en dos líneas no se lee.
 */
export function Comunidad() {
  const t = useTranslations("marketing.community")

  return (
    <section
      aria-labelledby="comunidad"
      className="relative overflow-hidden bg-ink-950 pt-4 pb-13 md:pt-6 md:pb-19"
    >
      <div className="container-page">
        <h2
          id="comunidad"
          data-motion-group
          data-motion-visible="play"
          data-motion-after="1400"
          className="text-center text-sm font-medium text-balance text-mist/60 sm:text-base"
        >
          {t.rich("title", {
            b: (chunks) => (
              <span
                data-crop-mark
                className="m-audiencia font-semibold whitespace-nowrap text-ink-50 tabular-nums"
              >
                {chunks}
              </span>
            ),
          })}
        </h2>
      </div>

      <Marquee label={t("creators")} speed={45} gap="1rem" className="mt-9 md:mt-11">
        {CLIENT_CHANNELS.map((c) => (
          <li
            key={c.name}
            className="flex w-40 shrink-0 flex-col items-center gap-2.5 text-center"
          >
            <span className="relative">
              <Image
                src={c.photo}
                alt=""
                width={64}
                height={64}
                sizes="64px"
                className="size-16 rounded-full object-cover ring-2 ring-white/10"
              />
              <span className="absolute -right-2 -bottom-1 flex -space-x-1.5">
                {c.networks.map((network) => (
                  <span
                    key={network}
                    className="grid size-5 place-items-center rounded-full bg-white text-black ring-2 ring-ink-950"
                    title={network}
                  >
                    <ChannelNetworkGlyph
                      network={network}
                      tone="official"
                      className="size-3"
                      aria-hidden="true"
                    />
                  </span>
                ))}
              </span>
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-ink-50">
                {c.name}
              </span>
              <span className="block text-xs text-mist/60 tabular-nums">{c.metric}</span>
            </span>
          </li>
        ))}
      </Marquee>

      <Marquee
        label={t("brands")}
        speed={45}
        reverse
        gap="3.5rem"
        className="mt-8 md:mt-10"
      >
        {BRANDS.map((b) => {
          const Icono = ICONO[b.icon]
          return (
            <li
              key={b.name}
              className="flex shrink-0 items-center gap-2.5 whitespace-nowrap text-mist/60 transition-colors duration-200 hover:text-ink-50"
            >
              <Icono className="size-6 shrink-0" aria-hidden />
              <span
                className={cn(
                  // La display de marca a este tamaño funde letras («di» parece «k»):
                  // el tratamiento pesado va en DM Sans negra.
                  b.style === "heavy"
                    ? "text-xl font-black tracking-tight"
                    : "text-sm font-bold tracking-[0.18em] uppercase"
                )}
              >
                {b.name}
              </span>
            </li>
          )
        })}
      </Marquee>
    </section>
  )
}
