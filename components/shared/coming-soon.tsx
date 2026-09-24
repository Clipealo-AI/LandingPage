import * as React from "react"
import { ArrowLeft, Hammer } from "lucide-react"
import { useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export interface ComingSoonProps {
  title: string
  description: string
  /** Lo que va a vivir aqui, para que la ruta no sea una promesa vacia. */
  bullets?: string[]
  backHref?: string
  backLabel?: string
}

/**
 * Destino real para las rutas que la navegacion ya promete pero que aun no
 * estan construidas. Existen como pagina —no como 404— porque Next prefetchea
 * los `<Link>` visibles y una ruta ausente ensucia la consola en cada carga.
 */
export function ComingSoon({
  title,
  description,
  bullets = [],
  backHref = "/dashboard",
  backLabel,
}: ComingSoonProps) {
  const t = useTranslations("common.actions")

  return (
    <Empty className="min-h-[60svh]">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Hammer />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>

      <EmptyContent>
        {bullets.length > 0 && (
          <ul className="mx-auto max-w-sm space-y-1.5 text-left text-sm text-muted-foreground">
            {bullets.map((item) => (
              <li key={item} className="flex gap-2">
                <span
                  className="mt-2 size-1 shrink-0 rounded-full bg-brand"
                  aria-hidden
                />
                {item}
              </li>
            ))}
          </ul>
        )}

        <Button variant="outline" asChild>
          <Link href={backHref}>
            <ArrowLeft /> {backLabel ?? t("backToOverview")}
          </Link>
        </Button>
      </EmptyContent>
    </Empty>
  )
}
