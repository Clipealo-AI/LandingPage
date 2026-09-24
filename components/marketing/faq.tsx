import * as React from "react"
import { useTranslations } from "next-intl"

import { cn } from "@/lib/utils"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

/** Pregunta y respuesta ya traducidas. */
export interface FaqItem {
  q: string
  a: string
}

/** Preguntas generales del producto, en orden: `marketing.faq.items.<id>.q|a`. */
const QUESTIONS = [
  "processing",
  "fileFormats",
  "faces",
  "editCaptions",
  "afterCancel",
  "publish",
] as const

export interface FaqProps {
  items?: FaqItem[]
  title?: React.ReactNode
  className?: string
}

/**
 * Preguntas frecuentes. Sin `items` enseña las generales del producto.
 *
 * Movimiento (CSS en app/motion/faq.css y base.css):
 * - La columna del titular es un grupo «al entrar en pantalla» (E5): el h2 se
 *   corta a 12 fps y el contacto sube. Lo observa `MotionObserver`, que solo
 *   monta la landing: en /precios se ve terminado.
 * - Al abrir una pregunta, la respuesta se funde (`.m-respuesta`). Responde al
 *   gesto, así que ocurre igual en la landing y en /precios.
 */
export function Faq({ items, title, className }: FaqProps) {
  const t = useTranslations("marketing.faq")
  const preguntas =
    items ?? QUESTIONS.map((id) => ({ q: t(`items.${id}.q`), a: t(`items.${id}.a`) }))

  return (
    <section className={cn("container-page py-20 md:py-28", className)}>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,20rem)_1fr] lg:gap-16">
        <div data-motion-group>
          <h2 className="m-anim m-cut display text-[clamp(1.75rem,4vw,2.5rem)]">
            {title ?? t.rich("title", { br: () => <br /> })}
          </h2>
          <p className="m-anim m-rise mt-4 text-sm text-pretty text-muted-foreground [--i:1]">
            {t.rich("contact", {
              link: (chunks) => (
                <a
                  href="mailto:hola@clipealo.com"
                  className="font-medium text-primary underline underline-offset-4"
                >
                  {chunks}
                </a>
              ),
            })}
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {preguntas.map((item) => (
            <AccordionItem key={item.q} value={item.q}>
              <AccordionTrigger className="text-left text-base font-semibold">
                {item.q}
              </AccordionTrigger>
              {/* La clase va al div interior del panel: no pisa su animación de altura */}
              <AccordionContent className="m-respuesta max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
