import { getTranslations } from "next-intl/server"
import { ArrowLeft, ArrowRight } from "lucide-react"

import { Link } from "@/i18n/navigation"
import type { Locale } from "@/i18n/routing"
import { featureNavigation } from "@/lib/marketing/navigation"
import { featurePages } from "@/lib/marketing/feature-pages"
import { Button } from "@/components/ui/button"
import {
  RouteCallToAction,
  RouteHero,
  RouteSection,
  WorkflowGrid,
} from "@/components/marketing/route-page-ui"
import { RichContent } from "@/components/marketing/rich-content"

type Translator = (key: string) => string

function workflowSteps(t: Translator) {
  return (["upload", "analyze", "review"] as const).map((step) => ({
    title: t(`shared.steps.${step}.title`),
    description: t(`shared.steps.${step}.description`),
  }))
}

export async function FeatureRoutePage({
  locale,
  slug,
}: {
  locale: Locale
  slug: string
}) {
  const feature = featurePages.find((item) => item.slug === slug)
  if (!feature) return null

  const routeT = await getTranslations({ locale, namespace: "routes" })
  const marketingT = await getTranslations({ locale, namespace: "marketing" })
  const menuT = await getTranslations({ locale, namespace: "marketing.header" })
  const copy = menuT as unknown as Translator
  const labels = routeT as unknown as Translator
  const marketingText = marketingT as unknown as Translator
  const menuItem = featureNavigation.find((item) => item.slug === slug)
  const title = locale === "es" ? feature.h1 : copy(`menuItems.${menuItem?.id}.title`)
  const lead =
    locale === "es" ? feature.intro : copy(`menuItems.${menuItem?.id}.description`)

  return (
    <>
      <RouteHero eyebrow={copy("menus.features")} title={title} lead={lead}>
        <Button variant="brand" asChild>
          <Link href="/precios">{labels("shared.viewPricing")}</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="https://app.clipealo-ai.com/">
            {labels("shared.tryClipealo")} <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </RouteHero>

      <main className="container-page pb-16 md:pb-24">
        {locale === "es" ? (
          <div className="mx-auto max-w-4xl divide-y divide-border">
            {feature.sections.map((section) => (
              <section key={section.heading} className="py-10 first:pt-4 md:py-12">
                <h2 className="display text-[clamp(1.5rem,3vw,2.25rem)] leading-tight text-balance">
                  {section.heading}
                </h2>
                <RichContent text={section.content} className="mt-4" />
              </section>
            ))}
          </div>
        ) : (
          <RouteSection title={labels("shared.howItWorks")}>
            <WorkflowGrid steps={workflowSteps(labels)} />
          </RouteSection>
        )}

        <section className="mx-auto mt-8 max-w-4xl rounded-2xl border border-border bg-muted/50 p-6 sm:p-8">
          <h2 className="text-xl font-semibold tracking-tight">
            {labels("shared.faqTitle")}
          </h2>
          <div className="mt-5 divide-y divide-border">
            {[
              "processing",
              "fileFormats",
              "faces",
              "editCaptions",
              "afterCancel",
              "publish",
            ].map((id) => (
              <details key={id} className="group py-4 first:pt-0 last:pb-0">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium marker:hidden">
                  {marketingText(`faq.items.${id}.q`)}
                  <span
                    className="text-xl text-primary transition-transform group-open:rotate-45"
                    aria-hidden="true"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-3xl leading-relaxed text-muted-foreground">
                  {marketingText(`faq.items.${id}.a`)}
                </p>
              </details>
            ))}
          </div>
        </section>

        <nav
          className="mx-auto mt-10 flex max-w-4xl flex-wrap items-center justify-between gap-4 border-t border-border pt-6"
          aria-label={labels("shared.related")}
        >
          <Link
            href="/funciones"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />{" "}
            {labels("shared.backToAllFeatures")}
          </Link>
          <div className="flex flex-wrap gap-3">
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
      </main>

      <RouteCallToAction
        heading={labels("shared.featureCtaHeading")}
        lead={labels("shared.featureCtaLead")}
        pricingLabel={labels("shared.viewPricing")}
        contactLabel={labels("shared.contactWhatsApp")}
      />
    </>
  )
}
