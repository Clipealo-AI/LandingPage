import type { LucideIcon } from "lucide-react"
import { ArrowRight, Check, Sparkles } from "lucide-react"

import { Link } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { WhatsAppIcon } from "@/components/brand/whatsapp-icon"
import { WHATSAPP_URL } from "@/lib/contact"

type RouteLink = {
  href: string
  title: string
  description: string
  icon: LucideIcon
  actionLabel: string
}

export function RouteHero({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow: string
  title: string
  lead: string
  children?: React.ReactNode
}) {
  return (
    <section className="relative isolate overflow-hidden border-b bg-card">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_85%_10%,color-mix(in_oklab,var(--primary)_12%,transparent),transparent_38%)]"
      />
      <div className="container-page py-24 md:py-32">
        <div className="max-w-4xl">
          <p className="text-sm font-semibold tracking-[0.16em] text-primary uppercase">
            {eyebrow}
          </p>
          <h1 className="mt-4 display text-[clamp(2.25rem,6vw,4.5rem)] leading-[1.04] text-balance">
            {title}
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-pretty text-muted-foreground md:text-xl">
            {lead}
          </p>
          {children && (
            <div className="mt-8 flex flex-wrap items-center gap-3">{children}</div>
          )}
        </div>
      </div>
    </section>
  )
}

export function RouteCardGrid({ items }: { items: RouteLink[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map(({ href, title, description, icon: Icon, actionLabel }) => (
        <Link
          key={href}
          href={href as never}
          className="group block rounded-2xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <Card className="h-full border-border/80 bg-card transition-[border-color,box-shadow,translate] duration-200 group-hover:-translate-y-0.5 group-hover:border-primary/40 group-hover:shadow-md">
            <CardContent className="flex h-full flex-col p-6">
              <span className="flex size-11 items-center justify-center rounded-xl bg-secondary text-primary">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <h2 className="mt-5 text-xl font-semibold tracking-tight text-card-foreground">
                {title}
              </h2>
              <p className="mt-2 flex-1 leading-relaxed text-muted-foreground">
                {description}
              </p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                {actionLabel}
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </span>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}

export function RouteSection({
  title,
  lead,
  children,
  className = "",
}: {
  title: string
  lead?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={`py-12 md:py-16 ${className}`}>
      <div className="container-page">
        <div className="mb-8 max-w-3xl">
          <h2 className="display text-[clamp(1.75rem,4vw,2.75rem)] leading-tight text-balance">
            {title}
          </h2>
          {lead && (
            <p className="mt-3 text-lg leading-relaxed text-muted-foreground">{lead}</p>
          )}
        </div>
        {children}
      </div>
    </section>
  )
}

export function WorkflowGrid({
  steps,
}: {
  steps: { title: string; description: string }[]
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {steps.map((step, index) => (
        <Card key={`${step.title}-${index}`} className="border-border/80 bg-card">
          <CardContent className="p-6">
            <span className="mb-5 flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="text-lg font-semibold tracking-tight">{step.title}</h3>
            <p className="mt-2 leading-relaxed text-muted-foreground">
              {step.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <li
          key={item}
          className="flex items-start gap-3 rounded-xl border border-border/80 bg-card p-4"
        >
          <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          <span className="text-sm leading-relaxed text-muted-foreground">{item}</span>
        </li>
      ))}
    </ul>
  )
}

export function RouteCallToAction({
  heading,
  lead,
  pricingLabel,
  contactLabel,
}: {
  heading: string
  lead: string
  pricingLabel: string
  contactLabel: string
}) {
  return (
    <section className="bg-ink-950 text-ink-50">
      <div className="container-page py-14 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-white/10 text-brand">
            <Sparkles className="size-5" aria-hidden="true" />
          </span>
          <h2 className="mt-5 display text-[clamp(1.75rem,4vw,3rem)] leading-tight text-balance">
            {heading}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-pretty text-ink-200/80">{lead}</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button variant="brand" asChild>
              <Link href="/precios">
                {pricingLabel} <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button
              variant="outline"
              asChild
              className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            >
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon className="mr-2 inline-block align-[-0.2em]" />
                {contactLabel}
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
