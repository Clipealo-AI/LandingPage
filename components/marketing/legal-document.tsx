import { Fragment } from "react"
import { ArrowLeft } from "lucide-react"

import { Link } from "@/i18n/navigation"
import { WhatsAppIcon } from "@/components/brand/whatsapp-icon"
import { WHATSAPP_NUMBER, WHATSAPP_URL } from "@/lib/contact"
import type {
  LegalBlock,
  LegalDocumentContent,
  LegalInlineNode,
} from "@/lib/legal-documents"

type LegalDocumentProps = {
  document: LegalDocumentContent
  eyebrow: string
  lead: string
  backLabel: string
}

export function LegalDocument({
  document,
  eyebrow,
  lead,
  backLabel,
}: LegalDocumentProps) {
  return (
    <article className="container-page max-w-3xl py-16 md:py-24">
      <header className="border-b border-border pb-8 md:pb-10">
        <p className="text-sm font-semibold tracking-wide text-primary uppercase">
          {eyebrow}
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-4xl">
          {document.title}
        </h1>
        <p className="mt-4 text-lg text-pretty text-muted-foreground">{lead}</p>
        <p className="mt-3 text-sm text-muted-foreground">{document.updated}</p>
      </header>

      <div className="mt-10 space-y-10 text-base leading-7 text-muted-foreground">
        {document.sections.map((section) => (
          <section key={section.title} id={`legal-${anchorId(section.title)}`}>
            <h2 className="border-l-2 border-primary pl-4 text-xl leading-7 font-semibold text-foreground sm:text-2xl">
              {section.title}
            </h2>
            <div className="mt-4 space-y-5">
              <LegalBlocks blocks={section.blocks} />
            </div>
          </section>
        ))}
      </div>

      <footer className="mt-12 border-t border-border pt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          {backLabel}
        </Link>
      </footer>
    </article>
  )
}

function LegalBlocks({ blocks }: { blocks: LegalBlock[] }) {
  return blocks.map((block, index) => {
    if (block.type === "paragraph") {
      return (
        <p key={index}>
          <LegalInline nodes={block.content} />
        </p>
      )
    }

    if (block.type === "list") {
      const List = block.ordered ? "ol" : "ul"
      return (
        <List
          key={index}
          className={
            block.ordered ? "list-decimal space-y-2 pl-6" : "list-disc space-y-2 pl-6"
          }
        >
          {block.items.map((item, itemIndex) => (
            <li key={itemIndex} className="pl-1">
              <LegalInline nodes={item} />
            </li>
          ))}
        </List>
      )
    }

    return (
      <section key={index} className="space-y-3 pt-2">
        <h3 className="text-lg leading-7 font-semibold text-foreground">{block.title}</h3>
        <div className="space-y-4">
          <LegalBlocks blocks={block.blocks} />
        </div>
      </section>
    )
  })
}

function LegalInline({
  nodes,
  linkifyPhone = true,
}: {
  nodes: LegalInlineNode[]
  linkifyPhone?: boolean
}) {
  return nodes.map((node, index) => {
    if (node.type === "text")
      return (
        <Fragment key={index}>
          {linkifyPhone ? linkedContact(node.value) : node.value}
        </Fragment>
      )
    if (node.type === "break") return <br key={index} />
    if (node.type === "strong") {
      return (
        <strong key={index} className="font-semibold text-foreground">
          <LegalInline nodes={node.children} linkifyPhone={linkifyPhone} />
        </strong>
      )
    }
    if (node.type === "emphasis") {
      return (
        <em key={index}>
          <LegalInline nodes={node.children} linkifyPhone={linkifyPhone} />
        </em>
      )
    }
    return (
      <a
        key={index}
        href={node.href}
        target={node.href === WHATSAPP_URL ? "_blank" : undefined}
        rel={node.href === WHATSAPP_URL ? "noopener noreferrer" : undefined}
        className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
      >
        {node.href === WHATSAPP_URL && (
          <WhatsAppIcon className="mr-1 inline-block size-4 align-[-0.2em]" />
        )}
        <LegalInline nodes={node.children} linkifyPhone={false} />
      </a>
    )
  })
}

function linkedContact(value: string) {
  return value.split(WHATSAPP_NUMBER).map((part, index, parts) => (
    <Fragment key={`${part}-${index}`}>
      {part}
      {index < parts.length - 1 && (
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-medium text-primary underline underline-offset-4 hover:text-primary/80"
        >
          <WhatsAppIcon className="size-4" />
          {WHATSAPP_NUMBER}
        </a>
      )}
    </Fragment>
  ))
}

function anchorId(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}
