import { useTranslations } from "next-intl"

import { Skeleton } from "@/components/ui/skeleton"
import { Logo } from "@/components/brand/logo"
import { BarraBienvenida, MarcoBienvenida } from "@/components/onboarding/marco"

/**
 * Esqueleto de una toma con la geometría real (`MarcoBienvenida`): timecode,
 * título estático en `text-muted-foreground`, chips y acciones, y el Monitor
 * en tinta con la tarjeta 9:16. Lo pinta el `Suspense` de la página y el flujo
 * mientras la cuenta no está lista (`useCuentaLista`): sin CLS ni hueco en blanco.
 * Sirve en servidor y en cliente.
 */
export function TomaSkeleton() {
  const t = useTranslations("onboarding")
  return (
    <MarcoBienvenida
      aria-busy="true"
      barra={
        <BarraBienvenida
          marca={<Logo iconOnly className="size-7" />}
          centro={<Skeleton className="h-4 w-28" />}
          acciones={<Skeleton className="h-7 w-28" />}
        />
      }
      mini={
        <div className="px-4 @3xl/bienvenida:px-8 @5xl/bienvenida:hidden">
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
      }
      monitor={
        <div className="sticky top-0 flex h-dvh items-center justify-center bg-stage p-10">
          <div className="aspect-[9/16] w-full max-w-[min(clamp(20rem,22cqi,34rem),calc(78svh*9/16))] rounded-3xl border border-stage-border" />
        </div>
      }
    >
      <div className="flex flex-col gap-8">
        <div className="flex gap-1.5" aria-hidden>
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-1.5 flex-1 rounded-full" />
          ))}
        </div>
        <div className="space-y-3">
          <p className="text-[clamp(1.75rem,1rem+1.6cqi,2.75rem)] leading-tight font-bold text-balance text-muted-foreground">
            {t("meta.title")}
          </p>
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="grid grid-cols-2 gap-2.5 @md/bienvenida:grid-cols-3" aria-hidden>
          {Array.from({ length: 9 }, (_, i) => (
            <Skeleton key={i} className="h-11 rounded-full" />
          ))}
        </div>
        <div className="flex justify-end gap-2" aria-hidden>
          <Skeleton className="h-11 w-24" />
          <Skeleton className="h-11 w-32" />
        </div>
      </div>
    </MarcoBienvenida>
  )
}
