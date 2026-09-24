import type { Locale } from "@/i18n/routing"

export type LegalInlineNode =
  | { type: "text"; value: string }
  | { type: "break" }
  | { type: "strong"; children: LegalInlineNode[] }
  | { type: "emphasis"; children: LegalInlineNode[] }
  | { type: "link"; href: string; children: LegalInlineNode[] }

export type LegalBlock =
  | { type: "paragraph"; content: LegalInlineNode[] }
  | { type: "list"; ordered: boolean; items: LegalInlineNode[][] }
  | { type: "subsection"; title: string; blocks: LegalBlock[] }

type LegalSection = {
  type: "section"
  title: string
  blocks: LegalBlock[]
}

export type LegalDocumentContent = {
  title: string
  updated: string
  sections: LegalSection[]
}

export type LegalDocumentKey = "privacy" | "terms"

type LegalMessageFile = Record<LegalDocumentKey, LegalDocumentContent>

const MESSAGE_LOADERS: Record<Locale, () => Promise<{ default: unknown }>> = {
  es: () => import("@/messages/es/legal.json"),
  en: () => import("@/messages/en/legal.json"),
  pt: () => import("@/messages/pt/legal.json"),
}

/** Carga solo el documento y el idioma que necesita la página legal actual. */
export async function loadLegalDocument(
  locale: Locale,
  key: LegalDocumentKey
): Promise<LegalDocumentContent> {
  const messages = await MESSAGE_LOADERS[locale]()
  return (messages.default as LegalMessageFile)[key]
}
