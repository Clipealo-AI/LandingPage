"use client"

import { cn } from "@/lib/utils"
import { esRender, ramaDe } from "@/lib/onboarding"
import { BrandGlow, PatternIsotipos } from "@/components/brand/patterns"
import { useFlujo } from "@/components/onboarding/contexto"
import { ProfileCard } from "@/components/onboarding/profile-card"
import { estadoSegmento } from "@/components/onboarding/timeline-tomas"

/**
 * Monitor (§5.1): columna de tinta (`bg-stage`, siempre oscura) con el patrón
 * de isotipos y el halo estáticos, la tarjeta de perfil 9:16 y, debajo, el
 * timeline de tomas. Es `aria-hidden`: lo útil también está en la Mesa o en la
 * región viva.
 *
 * El canto izquierdo (`border-stage-border`) marca la frontera con la Mesa: en
 * tema oscuro la página y el monitor están a 1,08:1 y sin él la columna se
 * pierde en el fondo.
 *
 * La tarjeta se monta sola: cada respuesta le añade una capa (§5.6) y el mini
 * feed enseña las campañas que ya encajan. El clip que viaja hasta su segmento
 * lo anima el timeline de la Mesa (`EVENTO_TOMA`, `timeline-tomas.tsx`).
 */
export function Monitor({ className }: { className?: string }) {
  const ctx = useFlujo()
  const o = ctx.cuenta.onboarding
  const tomas = ctx.pasos.filter((p) => !esRender(p))

  return (
    <aside
      aria-hidden
      data-monitor=""
      className={cn(
        "sticky top-0 isolate flex h-dvh flex-col items-center justify-center gap-8 overflow-hidden border-l border-stage-border bg-stage p-10 text-stage-foreground @[100rem]/bienvenida:p-16",
        className
      )}
    >
      <PatternIsotipos opacity={0.14} fade="bottom" />
      <BrandGlow tone="primary" />
      <ProfileCard
        cuenta={ctx.cuenta}
        rama={ramaDe({ tipo: ctx.flujo, clipero: ctx.cuenta.clipero })}
        encajan={ctx.encajan}
        feed={ctx.recomendacion.recomendadas.map((r) => r.item.campana)}
        className="relative"
      />
      <ol className="relative flex w-full max-w-[min(clamp(20rem,22cqi,34rem),calc(78svh*9/16))] gap-1.5">
        {tomas.map((p) => {
          const estado = estadoSegmento(p, ctx.paso, o.pasosRespondidos, o.pasosSaltados)
          return (
            <li
              key={p}
              data-segmento={p}
              data-estado={estado}
              className={cn(
                "h-1.5 flex-1 rounded-full",
                estado === "respondida" && "bg-primary",
                estado === "actual" && "bg-ink-50/60",
                estado === "saltada" && "border border-dashed border-ink-400",
                estado === "pendiente" && "bg-ink-50/15"
              )}
            />
          )
        })}
      </ol>
    </aside>
  )
}
