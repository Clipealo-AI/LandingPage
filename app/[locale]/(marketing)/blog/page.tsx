import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { BlogDirectory } from "@/components/marketing/blog-directory"
import { RouteCallToAction, RouteHero } from "@/components/marketing/route-page-ui"
import { alternates } from "@/i18n/metadata"
import { idiomaDe } from "@/i18n/server"
import { LOCALE_TAG } from "@/i18n/routing"
import { blogArticles, type BlogCategory } from "@/lib/marketing/blog-articles"

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/blog">): Promise<Metadata> {
  const locale = await idiomaDe(params)
  const t = await getTranslations({ locale, namespace: "routes" })
  return {
    title: t("blog.title"),
    description: t("blog.lead"),
    alternates: alternates("/blog", locale),
  }
}

export default async function BlogPage({ params }: PageProps<"/[locale]/blog">) {
  const locale = await idiomaDe(params)
  const t = await getTranslations({ locale, namespace: "routes" })
  const copy = await getTranslations({ locale, namespace: "articles" })
  const articles = [...blogArticles]
    .sort((a, b) => b.isoDate.localeCompare(a.isoDate))
    .map((article) => ({
      id: article.id,
      title: copy(`items.${article.id}.title` as never),
      category: article.category,
      metaDescription: copy(`items.${article.id}.description` as never),
      author: article.author,
      cover: article.cover,
      displayDate: new Intl.DateTimeFormat(LOCALE_TAG[locale], {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(article.isoDate)),
      readingTime: t("blog.readingTime", { minutes: 1 }),
    }))
  const categoryLabels: Record<BlogCategory, string> = {
    "Buenas Prácticas": t("blog.categories.Buenas Prácticas"),
    "Por Qué Importa": t("blog.categories.Por Qué Importa"),
    "Guía de Inicio": t("blog.categories.Guía de Inicio"),
  }

  return (
    <>
      <RouteHero
        eyebrow={t("blog.eyebrow")}
        title={t("blog.title")}
        lead={t("blog.lead")}
      />
      <section className="container-page py-10 md:py-14" aria-label={t("blog.eyebrow")}>
        <BlogDirectory
          articles={articles}
          allCategoriesLabel={t("blog.allCategories")}
          categoryLabels={categoryLabels}
          featuredLabel={t("blog.featured")}
          readLabel={t("blog.readArticle")}
          coverAltTemplate={t("blog.coverAlt", { title: "{title}" })}
        />
      </section>
      <RouteCallToAction
        heading={t("blog.ctaTitle")}
        lead={t("blog.ctaLead")}
        pricingLabel={t("shared.viewPricing")}
        contactLabel={t("shared.contactWhatsApp")}
      />
    </>
  )
}
