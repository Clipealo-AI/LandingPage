import Image from "next/image"
import { useTranslations } from "next-intl"

import { PlatformIcon, PLATFORM_LABELS } from "@/components/brand/platform-icon"
import { CLIENT_CHANNELS } from "@/lib/comunidad"
import { Marquee } from "@/components/shared/marquee"

/**
 * Prueba social: quién publica con Clipealo.
 *
 * Tiene el único bucle de la landing (AGENTS.md, regla 5): dos filas en
 * carrusel continuo, los creadores de derecha a izquierda y los canales de
 * izquierda a derecha, para que la franja entre el hero y el reencuadre tenga
 * vida sin pedir un clic. Va sobre el mismo ink-950 que las secciones vecinas
 * para leerse como una sola superficie oscura.
 *
 * El carrusel se mueve siempre, también con «reducir movimiento» activado en el
 * sistema (decisión de producto). Sin botón de pausa, también por decisión de
 * producto; pasar el ratón por encima detiene la fila.
 *
 * Los nombres, fotos, métricas y redes vienen de los canales que aparecen en
 * la landing de producción.
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
          {t("title")}
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
              <span className="absolute -right-1 -bottom-1 flex items-center -space-x-1">
                {c.networks.map((network) => (
                  <span
                    key={`${c.name}-${network}`}
                    className="grid size-6 place-items-center rounded-full bg-white ring-2 ring-ink-950"
                  >
                    <PlatformIcon
                      platform={network}
                      size={15}
                      alt={PLATFORM_LABELS[network]}
                      className="size-3.5"
                    />
                  </span>
                ))}
              </span>
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-ink-50">
                {c.name}
              </span>
              <span className="block text-xs text-mist/60 tabular-nums">
                {c.metric}
              </span>
            </span>
          </li>
        ))}
      </Marquee>

      <Marquee
        label={t("channels")}
        speed={45}
        reverse
        gap="3.5rem"
        className="mt-8 md:mt-10"
      >
        {CLIENT_CHANNELS.map((c) => {
          return (
            <li
              key={`channel-${c.name}`}
              className="flex shrink-0 items-center gap-2.5 whitespace-nowrap text-mist/60 transition-colors duration-200 hover:text-ink-50"
            >
              <span className="flex items-center gap-1.5">
                {c.networks.map((network) => (
                  <PlatformIcon
                    key={`${c.name}-${network}`}
                    platform={network}
                    size={22}
                    className="size-5 opacity-80"
                  />
                ))}
              </span>
              <span className="text-base font-bold tracking-tight">{c.name}</span>
            </li>
          )
        })}
      </Marquee>
    </section>
  )
}
