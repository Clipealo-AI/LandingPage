import { ArrowLeft } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { Link } from "@/i18n/navigation"
import type { Locale } from "@/i18n/routing"
import { useCaseNavigation } from "@/lib/marketing/navigation"
import { Button } from "@/components/ui/button"
import {
  RouteCallToAction,
  RouteHero,
  RouteSection,
  WorkflowGrid,
} from "@/components/marketing/route-page-ui"

type Translator = (key: string) => string

/** Every audience page uses localized copy and one shared, responsive layout. */
export async function UseCaseRoutePage({
  locale,
  slug,
}: {
  locale: Locale
  slug: string
}) {
  const useCase = useCaseNavigation.find((item) => item.slug === slug)
  if (!useCase) return null

  const routes = await getTranslations({ locale, namespace: "routes" })
  const menu = await getTranslations({ locale, namespace: "marketing.header" })
  const pages = await getTranslations({ locale, namespace: "pages" })
  const label = routes as unknown as Translator
  const copy = menu as unknown as Translator
  const detail = pages as unknown as Translator
  const Icon = useCase.icon
  const steps = (["upload", "analyze", "review"] as const).map((id) => ({
    title: label(`shared.steps.${id}.title`),
    description: label(`shared.steps.${id}.description`),
  }))

  return (
    <>
      <RouteHero
        eyebrow={copy("menus.useCases")}
        title={copy(`menuItems.${useCase.id}.title`)}
        lead={copy(`menuItems.${useCase.id}.description`)}
      >
        <Button variant="brand" asChild>
          <Link href="/precios">{label("shared.viewPricing")}</Link>
        </Button>
      </RouteHero>

      <section className="container-page grid items-center gap-8 py-14 md:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:gap-14">
        <div className="max-w-2xl">
          <h2 className="display text-[clamp(1.75rem,4vw,2.75rem)] leading-tight text-balance">
            {detail(`cases.${useCase.id}.heading`)}
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            {detail(`cases.${useCase.id}.body`)}
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            {detail("shared.planNote")}
          </p>
        </div>
        <div className="relative grid aspect-[4/3] place-items-center overflow-hidden rounded-frame border border-white/15 bg-ink-950 text-mist shadow-lg">
          <div
            className="absolute inset-0 pattern-isotipos opacity-[0.16]"
            aria-hidden="true"
          />
          <div
            className="absolute size-52 rounded-full border border-mist/25 bg-blue-500/10 blur-sm sm:size-64"
            aria-hidden="true"
          />
          <div className="relative grid size-28 place-items-center rounded-3xl border border-mist/30 bg-ink-900 shadow-[0_24px_70px_rgba(20,114,253,0.22)] sm:size-36">
            <Icon
              className="size-14 text-brand sm:size-18"
              strokeWidth={1.5}
              aria-hidden="true"
            />
          </div>
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
          href="/casos"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />{" "}
          {label("shared.backToAllUseCases")}
        </Link>
        <div className="flex flex-wrap gap-4">
          {useCaseNavigation
            .filter((item) => item.slug !== slug)
            .slice(0, 2)
            .map((item) => (
              <Link
                key={item.slug}
                href={`/casos/${item.slug}` as never}
                className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                {copy(`menuItems.${item.id}.title`)}
              </Link>
            ))}
        </div>
      </nav>

      <RouteCallToAction
        heading={label("shared.caseCtaHeading")}
        lead={copy(`menuItems.${useCase.id}.description`)}
        pricingLabel={label("shared.viewPricing")}
        contactLabel={label("shared.contactWhatsApp")}
      />
    </>
  )
}
