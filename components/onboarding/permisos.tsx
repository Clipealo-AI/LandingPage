"use client"

import * as React from "react"

import { vigente, type Finalidad, type OrigenConsentimiento } from "@/lib/privacidad"
import { useCuenta } from "@/hooks/use-cuenta"
import { Field, FieldContent, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"

export interface Permiso {
  finalidad: Finalidad
  label: string
  description?: string
  /** Clave exacta del texto mostrado: se guarda en el registro de consentimientos. */
  textoId: string
}

/**
 * Interruptores de consentimiento (§3.5): cada cambio añade una entrada al
 * registro con `consentir` (nunca sobrescribe) y lo que se ve es el valor
 * vigente. Apagados por defecto salvo lo que diga `VALOR_POR_DEFECTO`.
 * Suenan solos (`role="switch"`).
 */
export function Permisos({
  items,
  origen,
  className,
}: {
  items: readonly Permiso[]
  origen: OrigenConsentimiento
  className?: string
}) {
  const { cuenta, consentir } = useCuenta()
  const id = React.useId()
  return (
    <div className={className}>
      {items.map((p) => (
        <Field
          key={p.finalidad}
          orientation="horizontal"
          className="items-start gap-3 py-3"
        >
          <FieldContent>
            <FieldLabel htmlFor={`${id}-${p.finalidad}`} className="font-semibold">
              {p.label}
            </FieldLabel>
            {p.description && (
              <FieldDescription id={`${id}-${p.finalidad}-d`} className="text-pretty">
                {p.description}
              </FieldDescription>
            )}
          </FieldContent>
          <Switch
            id={`${id}-${p.finalidad}`}
            className="mt-0.5"
            checked={vigente(cuenta.consentimientos, p.finalidad)}
            aria-describedby={p.description ? `${id}-${p.finalidad}-d` : undefined}
            onCheckedChange={(valor) => consentir(p.finalidad, valor, origen, p.textoId)}
          />
        </Field>
      ))}
    </div>
  )
}
