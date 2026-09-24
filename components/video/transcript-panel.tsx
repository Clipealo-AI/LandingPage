"use client"

import * as React from "react"
import { Search, Sparkles } from "lucide-react"
import { useTranslations } from "next-intl"

import { cn } from "@/lib/utils"
import { formatTimecode } from "@/lib/format"
import type { Speaker, TranscriptCue } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

export interface TranscriptPanelProps extends React.ComponentProps<"div"> {
  cues: TranscriptCue[]
  speakers?: Speaker[]
  currentTime: number
  onSeek?: (seconds: number) => void
  /** Sigue el cabezal desplazando la lista. Se cancela al escribir en el buscador. */
  autoScroll?: boolean
}

/**
 * Transcripcion navegable.
 *
 * Es el mapa real del video: buscar una frase y saltar a ella es mas rapido que
 * arrastrar la linea de tiempo. Los cues que la IA marco como momento fuerte
 * llevan la barra naranja a la izquierda.
 */
export function TranscriptPanel({
  cues,
  speakers = [],
  currentTime,
  onSeek,
  autoScroll = true,
  className,
  ...props
}: TranscriptPanelProps) {
  const t = useTranslations("common.video.transcript")
  const [query, setQuery] = React.useState("")
  const activeRef = React.useRef<HTMLButtonElement>(null)

  const speakerName = React.useCallback(
    (id?: string) => speakers.find((s) => s.id === id)?.name ?? id,
    [speakers]
  )

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return cues
    return cues.filter((c) => c.text.toLowerCase().includes(q))
  }, [cues, query])

  const activeId = React.useMemo(
    () => cues.find((c) => currentTime >= c.start && currentTime < c.end)?.id,
    [cues, currentTime]
  )

  React.useEffect(() => {
    if (!autoScroll || query) return
    activeRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" })
  }, [activeId, autoScroll, query])

  return (
    <div className={cn("flex min-h-0 flex-col", className)} {...props}>
      <div className="relative shrink-0 p-3">
        <Search
          className="pointer-events-none absolute top-1/2 left-6 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchLabel")}
          className="pl-9"
        />
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <ol className="space-y-0.5 px-3 pb-3">
          {filtered.map((cue) => {
            const active = cue.id === activeId

            return (
              <li key={cue.id}>
                <button
                  ref={active ? activeRef : undefined}
                  type="button"
                  onClick={() => onSeek?.(cue.start)}
                  aria-current={active || undefined}
                  className={cn(
                    "group/cue w-full rounded-lg border-l-2 px-3 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
                    active
                      ? "border-l-primary bg-accent"
                      : "border-l-transparent hover:bg-muted",
                    cue.highlighted && !active && "border-l-brand"
                  )}
                >
                  <span className="mb-0.5 flex items-center gap-2">
                    <span
                      data-slot="timecode"
                      className={cn(
                        "text-[11px] tabular-nums",
                        active ? "font-semibold text-primary" : "text-muted-foreground"
                      )}
                    >
                      {formatTimecode(cue.start)}
                    </span>
                    {cue.speaker && (
                      <span className="truncate text-[11px] font-medium text-muted-foreground">
                        {speakerName(cue.speaker)}
                      </span>
                    )}
                    {cue.highlighted && (
                      <Badge
                        variant="brand-subtle"
                        className="ml-auto h-4 px-1.5 text-[10px]"
                      >
                        <Sparkles aria-hidden /> {t("moment")}
                      </Badge>
                    )}
                  </span>
                  <span
                    className={cn(
                      "block text-sm leading-relaxed",
                      active ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    <Highlight text={cue.text} query={query} />
                  </span>
                </button>
              </li>
            )
          })}

          {filtered.length === 0 && (
            <li className="px-3 py-8 text-center text-sm text-muted-foreground">
              {t("noResults", { query })}
            </li>
          )}
        </ol>
      </ScrollArea>
    </div>
  )
}

/** Resalta la coincidencia sin usar dangerouslySetInnerHTML. */
function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim()
  if (!q) return <>{text}</>

  const index = text.toLowerCase().indexOf(q.toLowerCase())
  if (index === -1) return <>{text}</>

  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded-sm bg-brand/25 px-0.5 text-foreground">
        {text.slice(index, index + q.length)}
      </mark>
      {text.slice(index + q.length)}
    </>
  )
}
