import { ArrowLeft, ArrowRight, Check } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { Link } from "@/i18n/navigation"
import type { Locale } from "@/i18n/routing"
import { featureNavigation } from "@/lib/marketing/navigation"
import { Button } from "@/components/ui/button"
import {
  RouteCallToAction,
  RouteHero,
  RouteSection,
  WorkflowGrid,
} from "@/components/marketing/route-page-ui"

type Translator = (key: string) => string

/** A feature has the same information architecture and localized depth in every language. */
export async function FeatureRoutePage({
  locale,
  slug,
}: {
  locale: Locale
  slug: string
}) {
  const feature = featureNavigation.find((item) => item.slug === slug)
  if (!feature) return null

  const routes = await getTranslations({ locale, namespace: "routes" })
  const menu = await getTranslations({ locale, namespace: "marketing.header" })
  const pages = await getTranslations({ locale, namespace: "pages" })
  const label = routes as unknown as Translator
  const copy = menu as unknown as Translator
  const detail = pages as unknown as Translator
  const Icon = feature.icon
  const steps = (["upload", "analyze", "review"] as const).map((id) => ({
    title: label(`shared.steps.${id}.title`),
    description: label(`shared.steps.${id}.description`),
  }))

  return (
    <>
      <RouteHero
        eyebrow={copy("menus.features")}
        title={copy(`menuItems.${feature.id}.title`)}
        lead={copy(`menuItems.${feature.id}.description`)}
      >
        <Button variant="brand" asChild>
          <Link href="/precios">{label("shared.viewPricing")}</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="https://app.clipealo-ai.com/">
            {label("shared.tryClipealo")} <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </RouteHero>

      <section className="container-page py-14 md:py-20">
        <div className="mx-auto grid max-w-5xl items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:gap-14">
          <div>
            <span className="grid size-12 place-items-center rounded-xl bg-secondary text-primary">
              <Icon className="size-6" aria-hidden="true" />
            </span>
            <h2 className="mt-6 display text-[clamp(1.75rem,4vw,2.75rem)] leading-tight text-balance">
              {detail(`features.${feature.id}.heading`)}
            </h2>
            <p className="mt-5 max-w-2xl leading-relaxed text-muted-foreground">
              {detail(`features.${feature.id}.body`)}
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              {detail("shared.planNote")}
            </p>
          </div>
          <ul className="grid gap-3" aria-label={label("shared.whatYouCanDo")}>
            {(["first", "second", "third"] as const).map((point) => (
              <li
                key={point}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-sm font-medium shadow-sm"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-secondary text-primary">
                  <Check className="size-4" aria-hidden="true" />
                </span>
                {detail(`features.${feature.id}.points.${point}`)}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <RouteSection title={detail("shared.workflowTitle")} className="bg-muted/40">
        <WorkflowGrid steps={steps} />
      </RouteSection>

      <nav
        className="container-page flex flex-wrap items-center justify-between gap-4 py-12"
        aria-label={label("shared.related")}
      >
        <Link
          href="/funciones"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />{" "}
          {label("shared.backToAllFeatures")}
        </Link>
        <div className="flex flex-wrap gap-4">
          {featureNavigation
            .filter((item) => item.slug !== slug)
            .slice(0, 2)
            .map((item) => (
              <Link
                key={item.slug}
                href={`/funciones/${item.slug}` as never}
                className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                {copy(`menuItems.${item.id}.title`)}
              </Link>
            ))}
        </div>
      </nav>

      <RouteCallToAction
        heading={label("shared.featureCtaHeading")}
        lead={label("shared.featureCtaLead")}
        pricingLabel={label("shared.viewPricing")}
        contactLabel={label("shared.contactWhatsApp")}
      />
    </>
  )
}
