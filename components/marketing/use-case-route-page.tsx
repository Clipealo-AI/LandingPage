import Image from "next/image"
import { getTranslations } from "next-intl/server"
import { ArrowLeft, Check } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { Link } from "@/i18n/navigation"
import type { Locale } from "@/i18n/routing"
import { useCaseNavigation } from "@/lib/marketing/navigation"
import { useCasePages } from "@/lib/marketing/use-case-pages"
import {
  RouteCallToAction,
  RouteHero,
  RouteSection,
  WorkflowGrid,
} from "@/components/marketing/route-page-ui"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { WhatsAppIcon } from "@/components/brand/whatsapp-icon"
import { WHATSAPP_URL } from "@/lib/contact"

type Translator = (key: string) => string

function workflowSteps(t: Translator) {
  return (["upload", "analyze", "review"] as const).map((step) => ({
    title: t(`shared.steps.${step}.title`),
    description: t(`shared.steps.${step}.description`),
  }))
}

type UseCaseData = {
  hero: {
    emoji: string
    tagline: string
    title: string
    description: string
    image: string
  }
  context?: { title: string; stat?: string; description: string }
  problem?: { title: string; subtitle?: string; description: string }
  solution?: { title: string; steps: { title: string; description: string }[] }
  highlight?: { title: string; description: string }
  contentTypes?: {
    title: string
    items: { icon: LucideIcon; label: string; description: string }[]
  }
  platforms?: { title: string; items: { name: string; note?: string }[] }
  metrics?: { value: string; label: string }[]
  bottomCTA?: { title: string; subtitle: string }
}

export async function UseCaseRoutePage({
  locale,
  slug,
}: {
  locale: Locale
  slug: string
}) {
  const route = useCaseNavigation.find((item) => item.slug === slug)
  const raw = useCasePages[slug as keyof typeof useCasePages] as unknown as
    UseCaseData | undefined
  if (!route || !raw) return null

  const routeT = await getTranslations({ locale, namespace: "routes" })
  const menuT = await getTranslations({ locale, namespace: "marketing.header" })
  const t = routeT as unknown as Translator
  const menuText = menuT as unknown as Translator
  const isSpanish = locale === "es"
  const title = isSpanish ? raw.hero.title : menuText(`menuItems.${route.id}.title`)
  const lead = isSpanish
    ? raw.hero.description
    : menuText(`menuItems.${route.id}.description`)
  const steps = isSpanish ? (raw.solution?.steps ?? []) : workflowSteps(t)
  const metrics = (raw.metrics ?? []).filter(
    (metric) =>
      !/s\s*\/?\.?\s*\d|\$|cr[eé]dit|plan|precio|costo|\/precios/i.test(
        `${metric.value} ${metric.label}`
      )
  )

  return (
    <>
      <RouteHero
        eyebrow={menuText("menus.useCases")}
        title={`${raw.hero.emoji} ${title}`}
        lead={lead}
      >
        <Button variant="brand" asChild>
          <Link href="/precios">{t("shared.viewPricing")}</Link>
        </Button>
        <Button variant="outline" asChild>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
            <WhatsAppIcon className="mr-2 inline-block align-[-0.2em]" />
            {t("shared.contactWhatsApp")}
          </a>
        </Button>
      </RouteHero>

      <div className="container-page space-y-12 py-12 md:space-y-16 md:py-16">
        <section className="grid items-center gap-8 lg:grid-cols-[1fr_0.85fr]">
          <div>
            {isSpanish && (
              <p className="text-sm font-semibold tracking-wide text-primary uppercase">
                {raw.hero.tagline}
              </p>
            )}
            <h2 className="mt-3 display text-[clamp(1.75rem,4vw,3rem)] leading-tight text-balance">
              {isSpanish
                ? (raw.problem?.title ?? raw.hero.title)
                : t("shared.caseValueTitle")}
            </h2>
            <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
              {isSpanish ? (raw.problem?.description ?? raw.hero.description) : lead}
            </p>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-frame border border-border bg-muted shadow-lg">
            <Image
              src={raw.hero.image}
              alt={title}
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover"
              priority
            />
          </div>
        </section>

        {isSpanish && raw.context && (
          <section className="grid gap-5 rounded-frame border border-border bg-card p-6 sm:p-8 md:grid-cols-[auto_1fr] md:items-center">
            {raw.context.stat && (
              <p className="display text-4xl text-primary md:text-5xl">
                {raw.context.stat}
              </p>
            )}
            <div>
              <h2 className="text-xl font-semibold">{raw.context.title}</h2>
              <p className="mt-2 max-w-4xl leading-relaxed text-muted-foreground">
                {raw.context.description}
              </p>
            </div>
          </section>
        )}

        <RouteSection
          title={
            isSpanish
              ? (raw.solution?.title ?? t("shared.howItWorks"))
              : t("shared.howItWorks")
          }
        >
          <WorkflowGrid steps={steps} />
        </RouteSection>

        {isSpanish && raw.highlight && (
          <section className="rounded-2xl border border-primary/20 bg-primary/5 p-6 sm:p-8">
            <h2 className="text-xl font-semibold tracking-tight">
              {raw.highlight.title}
            </h2>
            <p className="mt-3 max-w-4xl leading-relaxed text-muted-foreground">
              {raw.highlight.description}
            </p>
          </section>
        )}

        {isSpanish && raw.contentTypes && (
          <RouteSection title={raw.contentTypes.title}>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {raw.contentTypes.items.map(({ icon: Icon, label, description }) => (
                <Card key={label} className="border-border/80 bg-card">
                  <CardContent className="flex gap-4 p-5">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="font-semibold">{label}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </RouteSection>
        )}

        {raw.platforms && (
          <section className="rounded-2xl border border-border bg-muted/40 p-6 sm:p-8">
            <h2 className="text-xl font-semibold tracking-tight">
              {isSpanish ? raw.platforms.title : t("shared.examples")}
            </h2>
            <ul className="mt-5 flex flex-wrap gap-2">
              {raw.platforms.items.map(({ name }) => (
                <li
                  key={name}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium"
                >
                  <Check className="size-4 text-primary" aria-hidden="true" /> {name}
                </li>
              ))}
            </ul>
          </section>
        )}

        {isSpanish && metrics.length > 0 && (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {metrics.map(({ value, label }) => (
              <Card key={`${value}-${label}`} className="border-border/80 bg-card">
                <CardContent className="p-6">
                  <p className="display text-3xl text-primary">{value}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {label}
                  </p>
                </CardContent>
              </Card>
            ))}
          </section>
        )}

        <nav
          className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6"
          aria-label={t("shared.related")}
        >
          <Link
            href="/casos"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />{" "}
            {t("shared.backToAllUseCases")}
          </Link>
          <div className="flex flex-wrap gap-4">
            {useCaseNavigation
              .filter((item) => item.slug !== slug)
              .slice(0, 3)
              .map((item) => (
                <Link
                  key={item.slug}
                  href={`/casos/${item.slug}` as never}
                  className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  {menuText(`menuItems.${item.id}.title`)}
                </Link>
              ))}
          </div>
        </nav>
      </div>

      <RouteCallToAction
        heading={
          isSpanish && raw.bottomCTA ? raw.bottomCTA.title : t("shared.caseCtaHeading")
        }
        lead={isSpanish && raw.bottomCTA ? raw.bottomCTA.subtitle : lead}
        pricingLabel={t("shared.viewPricing")}
        contactLabel={t("shared.contactWhatsApp")}
      />
    </>
  )
}
