"use client"

import Image from "next/image"
import { useMemo, useState } from "react"
import { ArrowRight, CalendarDays, Clock3 } from "lucide-react"

import { Link } from "@/i18n/navigation"
import type { BlogArticle, BlogCategory } from "@/lib/marketing/blog-articles"

type ArticleCard = Pick<BlogArticle, "id" | "category" | "cover" | "author"> & {
  title: string
  metaDescription: string
  readingTime: string
  displayDate: string
}
type CategoryLabels = Record<BlogCategory, string>

export function BlogDirectory({
  articles,
  allCategoriesLabel,
  categoryLabels,
  featuredLabel,
  readLabel,
  coverAltTemplate,
}: {
  articles: ArticleCard[]
  allCategoriesLabel: string
  categoryLabels: CategoryLabels
  featuredLabel: string
  readLabel: string
  coverAltTemplate: string
}) {
  const [activeCategory, setActiveCategory] = useState<BlogCategory | "all">("all")
  const categories = [...new Set(articles.map(({ category }) => category))]
  const visible = useMemo(
    () =>
      activeCategory === "all"
        ? articles
        : articles.filter(({ category }) => category === activeCategory),
    [activeCategory, articles]
  )
  const [featured, ...rest] = visible
  const coverAlt = (title: string) => coverAltTemplate.replace("{title}", title)

  return (
    <>
      <div className="flex flex-wrap gap-2" role="group" aria-label={allCategoriesLabel}>
        <button
          type="button"
          aria-pressed={activeCategory === "all"}
          onClick={() => setActiveCategory("all")}
          className="rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground"
        >
          {allCategoriesLabel}
        </button>
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            aria-pressed={activeCategory === category}
            onClick={() => setActiveCategory(category)}
            className="rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground"
          >
            {categoryLabels[category]}
          </button>
        ))}
      </div>

      {featured && (
        <Link
          href={`/blog/${featured.id}` as never}
          className="group mt-8 grid overflow-hidden rounded-frame border border-border bg-card transition-[border-color,box-shadow] hover:border-primary/40 hover:shadow-lg lg:grid-cols-2"
        >
          <div className="relative min-h-64 bg-muted sm:min-h-80">
            <Image
              src={featured.cover}
              alt={coverAlt(featured.title)}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              priority
            />
          </div>
          <div className="flex flex-col justify-center p-6 sm:p-9 lg:p-12">
            <span className="text-sm font-semibold text-brand">{featuredLabel}</span>
            <span className="mt-2 w-fit rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
              {categoryLabels[featured.category]}
            </span>
            <h2 className="mt-4 text-2xl leading-tight font-semibold tracking-tight text-balance text-card-foreground sm:text-3xl">
              {featured.title}
            </h2>
            <p className="mt-3 line-clamp-3 leading-relaxed text-muted-foreground">
              {featured.metaDescription}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{featured.author.name}</span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-3.5" aria-hidden="true" />
                {featured.displayDate}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="size-3.5" aria-hidden="true" />
                {featured.readingTime}
              </span>
            </div>
            <span className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-primary">
              {readLabel}
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </span>
          </div>
        </Link>
      )}

      {rest.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rest.map((article) => (
            <Link
              key={article.id}
              href={`/blog/${article.id}` as never}
              className="group overflow-hidden rounded-2xl border border-border bg-card transition-[border-color,box-shadow,translate] hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <div className="relative aspect-[16/10] bg-muted">
                <Image
                  src={article.cover}
                  alt={coverAlt(article.title)}
                  fill
                  sizes="(min-width: 1280px) 30vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
              </div>
              <div className="p-5">
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
                  {categoryLabels[article.category]}
                </span>
                <h2 className="mt-3 text-lg leading-snug font-semibold tracking-tight text-balance text-card-foreground">
                  {article.title}
                </h2>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                  {article.metaDescription}
                </p>
                <div className="mt-5 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {article.author.name}
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1.5">
                    <Clock3 className="size-3.5" aria-hidden="true" />
                    {article.readingTime}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
