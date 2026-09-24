import Image from "next/image"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { ArrowLeft, CalendarDays, Clock3 } from "lucide-react"

import { Link } from "@/i18n/navigation"
import { alternates } from "@/i18n/metadata"
import { idiomaDe } from "@/i18n/server"
import { LOCALE_TAG } from "@/i18n/routing"
import { blogArticles } from "@/lib/marketing/blog-articles"
import { RouteCallToAction } from "@/components/marketing/route-page-ui"
import { RichContent } from "@/components/marketing/rich-content"

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

  return {
    title: article.title,
    description: article.metaDescription,
    alternates: alternates(`/blog/${slug}`, locale),
    openGraph: {
      type: "article",
      title: article.title,
      description: article.metaDescription,
      images: [{ url: article.cover, alt: `Clipealo: ${article.title}` }],
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
  const date = new Intl.DateTimeFormat(LOCALE_TAG[locale], {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(article.isoDate))
  const readingTime = t("blog.readingTime", {
    minutes: article.readingTime.replace(/\s*min(?:utos?)?/i, ""),
  })
  const category = t(`blog.categories.${article.category}`)

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
                {category}
              </span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="size-4" aria-hidden="true" />
                {readingTime}
              </span>
            </div>
            <h1 className="mt-5 display text-[clamp(2rem,5vw,3.75rem)] leading-[1.08] text-balance">
              {article.title}
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted-foreground">
              {article.metaDescription}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{article.author.name}</span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-4" aria-hidden="true" />
                {t("blog.published", { date })}
              </span>
            </div>
          </header>

          <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-frame border border-border bg-muted">
            <Image
              src={article.cover}
              alt={t("blog.coverAlt", { title: article.title })}
              fill
              sizes="(min-width: 1024px) 70vw, 100vw"
              className="object-cover"
              priority
            />
          </div>

          {locale !== "es" && (
            <p
              className="mt-5 rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground"
              lang="es"
            >
              {t("blog.originalLanguage")}
            </p>
          )}

          <div className="mt-8">
            {article.content.map((block, index) => (
              <RichContent key={`${article.id}-${index}`} text={block} />
            ))}
          </div>

          {article.internalLinks.length > 0 && (
            <aside className="mt-10 rounded-2xl border border-border bg-card p-6 sm:p-8">
              <h2 className="text-xl font-semibold tracking-tight">
                {t("blog.related")}
              </h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {article.internalLinks.map((item) => (
                  <li key={`${item.href}-${item.label}`}>
                    <Link
                      href={item.href as never}
                      className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </aside>
          )}
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
