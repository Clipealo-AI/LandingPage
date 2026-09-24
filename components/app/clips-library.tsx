"use client"

import * as React from "react"
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs"
import { Clapperboard, Search, SlidersHorizontal, X } from "lucide-react"
import { useTranslations } from "next-intl"

import { ASPECT_RATIOS, type AspectRatioKey, type Clip } from "@/lib/types"
import { toast } from "@/lib/toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { ClipCard } from "@/components/video/clip-card"

const STATUSES = ["todos", "borrador", "listo", "publicado"] as const
const SORTS = ["score", "reciente", "duracion"] as const

export function ClipsLibrary({ clips }: { clips: Clip[] }) {
  const t = useTranslations("app.clipsLibrary")
  // El filtro vive en la URL: un enlace a "clips en borrador" se puede compartir
  const [query, setQuery] = useQueryState("q", parseAsString.withDefault(""))
  const [status, setStatus] = useQueryState(
    "estado",
    parseAsStringLiteral(STATUSES).withDefault("todos")
  )
  const [aspect, setAspect] = useQueryState("formato", parseAsString.withDefault(""))
  const [sort, setSort] = useQueryState(
    "orden",
    parseAsStringLiteral(SORTS).withDefault("score")
  )

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = clips.filter((clip) => {
      if (status !== "todos" && clip.status !== status) return false
      if (aspect && clip.aspect !== aspect) return false
      if (
        q &&
        !`${clip.title} ${clip.hook} ${clip.tags.join(" ")}`.toLowerCase().includes(q)
      )
        return false
      return true
    })

    return [...list].sort((a, b) => {
      if (sort === "score") return b.score - a.score
      if (sort === "duracion")
        return b.range.end - b.range.start - (a.range.end - a.range.start)
      return b.createdAt.localeCompare(a.createdAt)
    })
  }, [clips, query, status, aspect, sort])

  const hasFilters = Boolean(query || aspect || status !== "todos")

  const clearFilters = () => {
    void setQuery(null)
    void setAspect(null)
    void setStatus(null)
  }

  return (
    <div className="space-y-5">
      {/* Los filtros van en una sola fila sobre la rejilla */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1 lg:max-w-xs">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => void setQuery(e.target.value || null)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchLabel")}
            className="pl-9"
          />
        </div>

        <ToggleGroup
          type="single"
          value={status}
          onValueChange={(v) => void setStatus((v as typeof status) || "todos")}
          aria-label={t("statusFilter")}
          className="w-fit"
        >
          {STATUSES.map((s) => (
            <ToggleGroupItem key={s} value={s} className="px-3 text-xs capitalize">
              {t(`status.${s}`)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <div className="flex items-center gap-2 lg:ml-auto">
          <Select
            value={aspect || "all"}
            onValueChange={(v) => void setAspect(v === "all" ? null : v)}
          >
            <SelectTrigger size="sm" className="w-32" aria-label={t("format")}>
              <SlidersHorizontal className="size-3.5" />
              <SelectValue placeholder={t("format")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allFormats")}</SelectItem>
              {(Object.keys(ASPECT_RATIOS) as AspectRatioKey[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {key} · {t(`aspects.${key}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sort} onValueChange={(v) => void setSort(v as typeof sort)}>
            <SelectTrigger size="sm" className="w-44" aria-label={t("sortBy")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORTS.map((s) => (
                <SelectItem key={s} value={s}>
                  {t(`sort.${s}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X /> {t("clear")}
            </Button>
          )}
        </div>
      </div>

      <p aria-live="polite" className="text-xs text-muted-foreground tabular-nums">
        {t("count", { shown: filtered.length, total: clips.length })}
      </p>

      {filtered.length > 0 ? (
        <div className="grid-clips">
          {filtered.map((clip) => (
            <ClipCard
              key={clip.id}
              clip={clip}
              onPlay={(c) => toast(t("playing", { title: c.title }))}
              onDelete={(c) =>
                toast.error(t("deleted", { title: c.title }), {
                  sound: "remove",
                  action: {
                    label: t("undo"),
                    onClick: () => toast.success(t("restored")),
                  },
                })
              }
            />
          ))}
        </div>
      ) : (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Clapperboard />
            </EmptyMedia>
            <EmptyTitle>{t("emptyTitle")}</EmptyTitle>
            <EmptyDescription>{t("emptyDescription")}</EmptyDescription>
          </EmptyHeader>
          <Button variant="outline" onClick={clearFilters}>
            {t("clearFilters")}
          </Button>
        </Empty>
      )}
    </div>
  )
}
