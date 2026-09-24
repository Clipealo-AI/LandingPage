"use client"

import * as React from "react"
import { Check, Copy } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

/**
 * Un bloque de código con su botón de copiar. El aviso de «Copiado» está
 * escrito en el propio botón durante dos segundos: sin toast ni sonido, que
 * copiar no es un hito.
 */
export function BloqueCodigo({
  codigo,
  etiqueta,
  className,
}: {
  codigo: string
  etiqueta?: string
  className?: string
}) {
  const [copiado, setCopiado] = React.useState(false)

  React.useEffect(() => {
    if (!copiado) return
    const t = window.setTimeout(() => setCopiado(false), 2000)
    return () => window.clearTimeout(t)
  }, [copiado])

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl bg-stage text-ink-50 ring-1 ring-border",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-1.5">
        <span className="font-mono text-[11px] text-ink-300">{etiqueta ?? "json"}</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 px-2 text-xs text-ink-200 hover:bg-white/10 hover:text-ink-50"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(codigo)
              setCopiado(true)
            } catch {
              // Sin permiso de portapapeles: el texto sigue ahí para seleccionarlo a mano
            }
          }}
        >
          {copiado ? <Check aria-hidden /> : <Copy aria-hidden />}
          {copiado ? "Copiado" : "Copiar"}
        </Button>
      </div>
      <pre className="max-h-96 overflow-auto p-4 font-mono text-xs leading-relaxed">
        <code>{codigo}</code>
      </pre>
    </div>
  )
}
