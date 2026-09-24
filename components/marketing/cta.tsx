import * as React from "react"
import { ArrowRight } from "lucide-react"
import { useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"
import { footerNav, siteConfig } from "@/lib/site"
import { Logo } from "@/components/brand/logo"
import { Button } from "@/components/ui/button"
import { PatternLineas } from "@/components/brand/patterns"
import { LocaleSwitcher } from "@/components/shared/locale-switcher"
import { WhatsAppIcon } from "@/components/brand/whatsapp-icon"
import { WHATSAPP_NUMBER } from "@/lib/contact"
import { cn } from "@/lib/utils"

export function Cta() {
  const t = useTranslations("marketing")

  return (
    // Sobre naranja, el naranja no se ve (1,34:1): el foco, la marca de recorte
    // y la cuchilla del titular van en tinta
    <section
      id="subir"
      className="relative overflow-hidden bg-brand text-brand-foreground [--crop-color:var(--color-ink-950)] [--cut-color:var(--color-ink-950)] [--ring:var(--color-ink-950)]"
    >
      <PatternLineas />
      {/* Movimiento (app/motion/base.css): al entrar en pantalla el titular se
          corta a 12 fps y la entradilla sube; el botón no se anima. En /precios
          no hay observador y todo se ve terminado. */}
      <div
        data-motion-group
        className="relative container-page py-20 text-center md:py-28"
      >
        <h2 className="m-anim m-cut mx-auto max-w-3xl display text-[clamp(2.25rem,6vw,4rem)]">
          {t("cta.title")}
        </h2>
        <p className="m-anim m-rise mx-auto mt-5 max-w-md text-base text-pretty opacity-80 [--i:1]">
          {t("cta.lead")}
        </p>
        {/* La acción principal de la vista, en tinta porque sobre naranja no
            puede ser `brand`: suena y se encuadra como si lo fuera (AGENTS.md,
            regla 7). Al pasar el ratón apunta con las esquinas y la flecha
            avanza (app/motion/acciones.css). */}
        <Button
          size="xl"
          asChild
          sound="pop"
          effect="crop"
          className="mt-9 bg-ink-950 text-ink-50 shadow-lg hover:bg-ink-900"
        >
          <Link href="https://app.clipealo-ai.com/">
            {t("actions.upload")} <ArrowRight className="m-nudge" />
          </Link>
        </Button>
      </div>
    </section>
  )
}

type FooterLink = {
  href: string | { pathname: string; hash: string }
  label: string
  icon?: React.ReactNode
  ariaLabel?: string
}

export function SiteFooter() {
  const t = useTranslations("marketing")
  const tc = useTranslations("common")

  return (
    <footer className="bg-ink-950 text-mist">
      <div className="container-page py-14">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xs">
            <Logo size="md" className="text-white" />
            <p className="mt-3 text-sm opacity-55">{tc("meta.tagline")}.</p>
          </div>

          <div className="grid grid-cols-2 gap-x-12 gap-y-8 sm:grid-cols-3">
            <FooterColumn
              title={t("footer.product")}
              links={footerNav.product.map((link) => ({
                href: link.href,
                label: t(`footer.links.${link.id}`),
              }))}
            />
            <FooterColumn
              title={t("footer.resources")}
              links={footerNav.resources.map((link) => ({
                href: link.href,
                label: t(`footer.links.${link.id}`),
                icon:
                  link.id === "whatsapp" ? (
                    <WhatsAppIcon className="size-4" />
                  ) : undefined,
                ariaLabel:
                  link.id === "whatsapp" ? `WhatsApp · ${WHATSAPP_NUMBER}` : undefined,
              }))}
            />
            <FooterColumn
              title={t("footer.legal")}
              links={footerNav.legal.map((link) => ({
                href: link.href,
                label: t(`legalNav.${link.id}`),
              }))}
            />
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs opacity-50 sm:flex-row sm:items-center sm:justify-between">
          <p>
            {t("footer.copyright", {
              year: String(new Date().getFullYear()),
              name: siteConfig.name,
            })}
          </p>
          <div className="flex items-center gap-2">
            <p>{t("claim")}</p>
            {/* Idioma, discreto: el margen negativo evita que el botón engorde la franja */}
            <LocaleSwitcher className="-my-2 hover:bg-white/10 hover:text-white active:bg-white/15 aria-expanded:bg-white/10 aria-expanded:text-white" />
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({ title, links }: { title: string; links: readonly FooterLink[] }) {
  return (
    <div>
      <h3 className="text-xs font-semibold tracking-wide uppercase opacity-50">
        {title}
      </h3>
      <ul className="mt-3 space-y-2.5 text-sm">
        {links.map((link) => {
          // Los destinos externos (web y WhatsApp) no necesitan `next/link`.
          const { href } = link
          const isExternal =
            typeof href === "string" && /^(https?:|mailto:|tel:)/i.test(href)
          const className = "opacity-75 transition-opacity hover:opacity-100"
          return (
            <li key={link.label}>
              {isExternal ? (
                <a
                  href={href}
                  aria-label={link.ariaLabel}
                  className={cn(className, link.icon && "inline-flex items-center gap-2")}
                >
                  {link.icon}
                  {link.label}
                </a>
              ) : (
                <Link href={href as never} className={className}>
                  {link.label}
                </Link>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
