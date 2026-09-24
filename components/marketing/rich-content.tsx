import type { ReactNode } from "react"

import { WhatsAppIcon } from "@/components/brand/whatsapp-icon"
import { WHATSAPP_URL } from "@/lib/contact"

function InlineText({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\]\(https?:\/\/[^\s)]+\)|\*\*[^*]+\*\*)/g)
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={`${part}-${index}`} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      )
    }

    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/)
    if (!link) return part

    const [, label, href] = link
    const isWhatsApp = href === WHATSAPP_URL

    return (
      <a
        key={`${href}-${index}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
      >
        {isWhatsApp && (
          <WhatsAppIcon className="mr-1 inline-block size-4 align-[-0.2em]" />
        )}
        {label}
      </a>
    )
  })
}

export function RichContent({
  text,
  className = "",
}: {
  text: string
  className?: string
}) {
  const lines = text.split("\n")
  const blocks: ReactNode[] = []
  let paragraph: string[] = []
  let list: string[] = []

  const flushParagraph = () => {
    if (!paragraph.length) return
    blocks.push(
      <p
        key={`p-${blocks.length}`}
        className="my-4 leading-relaxed text-muted-foreground"
      >
        {paragraph.map((line, index) => (
          <span key={`${index}-${line}`}>
            {index > 0 && <br />}
            <InlineText text={line} />
          </span>
        ))}
      </p>
    )
    paragraph = []
  }

  const flushList = () => {
    if (!list.length) return
    blocks.push(
      <ul key={`ul-${blocks.length}`} className="my-5 space-y-3">
        {list.map((item, index) => (
          <li
            key={`${index}-${item}`}
            className="flex items-start gap-3 leading-relaxed text-muted-foreground"
          >
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <span aria-hidden="true">•</span>
            </span>
            <span>
              <InlineText text={item} />
            </span>
          </li>
        ))}
      </ul>
    )
    list = []
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) {
      flushParagraph()
      flushList()
      continue
    }
    if (line.startsWith("## ")) {
      flushParagraph()
      flushList()
      blocks.push(
        <h3
          key={`h-${blocks.length}`}
          className="mt-8 text-lg font-semibold tracking-tight text-foreground"
        >
          {line.slice(3)}
        </h3>
      )
      continue
    }
    if (line.startsWith("- ")) {
      flushParagraph()
      list.push(line.slice(2))
      continue
    }
    flushList()
    paragraph.push(line)
  }

  flushParagraph()
  flushList()

  return <div className={className}>{blocks}</div>
}
