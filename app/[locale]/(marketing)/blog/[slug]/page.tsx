import Image from "next/image"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { ArrowLeft, CalendarDays, Check, Clock3 } from "lucide-react"

import { Link } from "@/i18n/navigation"
import { alternates } from "@/i18n/metadata"
import { idiomaDe } from "@/i18n/server"
import { LOCALE_TAG } from "@/i18n/routing"
import { blogArticles } from "@/lib/marketing/blog-articles"
import { RouteCallToAction } from "@/components/marketing/route-page-ui"

export function generateStaticParams() {
  return blogArticles.map(({ id }) => ({ slug: id }))
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/blog/[slug]">): Promise<Metadata> {
  const locale = await idiomaDe(params)
  const { slug } = await params
  const article = blogArticles.find(({ id }) => id === slug)
  if (!article) return {}
  const copy = await getTranslations({ locale, namespace: "articles" })
  const title = copy(`items.${slug}.title` as never)
  const description = copy(`items.${slug}.description` as never)
  return {
    title,
    description,
    alternates: alternates(`/blog/${slug}`, locale),
    openGraph: {
      type: "article",
      title,
      description,
      images: [{ url: article.cover, alt: title }],
      publishedTime: article.isoDate,
      modifiedTime: article.modifiedDate,
    },
  }
}

export default async function BlogArticlePage({
  params,
}: PageProps<"/[locale]/blog/[slug]">) {
  const locale = await idiomaDe(params)
  const { slug } = await params
  const article = blogArticles.find(({ id }) => id === slug)
  if (!article) notFound()

  const t = await getTranslations({ locale, namespace: "routes" })
  const copy = await getTranslations({ locale, namespace: "articles" })
  const title = copy(`items.${slug}.title` as never)
  const description = copy(`items.${slug}.description` as never)
  const date = new Intl.DateTimeFormat(LOCALE_TAG[locale], {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(article.isoDate))
  const related = blogArticles.filter((item) => item.id !== slug).slice(0, 2)

  return (
    <>
      <article className="container-page py-12 md:py-16">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 rounded-md text-sm font-semibold text-primary hover:underline"
          >
            <ArrowLeft className="size-4" aria-hidden="true" /> {t("blog.back")}
          </Link>
          <header className="mt-8">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="rounded-full bg-secondary px-3 py-1 font-semibold text-secondary-foreground">
                {t(`blog.categories.${article.category}`)}
              </span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="size-4" aria-hidden="true" />{" "}
                {t("blog.readingTime", { minutes: 1 })}
              </span>
            </div>
            <h1 className="mt-5 display text-[clamp(2rem,5vw,3.75rem)] leading-[1.08] text-balance break-words">
              {title}
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted-foreground">
              {description}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{article.author.name}</span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-4" aria-hidden="true" />{" "}
                {t("blog.published", { date })}
              </span>
            </div>
          </header>

          <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-frame border border-border bg-ink-950">
            <Image
              src={article.cover}
              alt={t("blog.coverAlt", { title })}
              fill
              sizes="(min-width: 1024px) 70vw, 100vw"
              className="object-cover"
              priority
            />
          </div>

          <section className="mt-10 rounded-frame border border-border bg-card p-6 sm:p-9">
            <h2 className="text-xl font-semibold tracking-tight">
              {copy("shared.guideTitle")}
            </h2>
            <ul className="mt-6 grid gap-4">
              {(["first", "second", "third"] as const).map((tip) => (
                <li
                  key={tip}
                  className="flex items-start gap-3 leading-relaxed text-muted-foreground"
                >
                  <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-secondary text-primary">
                    <Check className="size-4" aria-hidden="true" />
                  </span>
                  <span>{copy(`items.${slug}.tips.${tip}` as never)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-7 border-t border-border pt-6 text-sm leading-relaxed text-muted-foreground">
              {copy("shared.closing")}
            </p>
          </section>

          <nav
            className="mt-10 border-t border-border pt-6"
            aria-label={t("blog.related")}
          >
            <h2 className="text-lg font-semibold">{t("blog.related")}</h2>
            <div className="mt-4 flex flex-wrap gap-4">
              {related.map((item) => (
                <Link
                  key={item.id}
                  href={`/blog/${item.id}` as never}
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  {copy(`items.${item.id}.title` as never)}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      </article>

      <RouteCallToAction
        heading={t("blog.articleCtaTitle")}
        lead={t("blog.articleCtaLead")}
        pricingLabel={t("shared.viewPricing")}
        contactLabel={t("shared.contactWhatsApp")}
      />
    </>
  )
}
