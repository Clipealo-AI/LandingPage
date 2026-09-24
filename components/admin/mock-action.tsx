"use client"

import * as React from "react"
import { useTranslations } from "next-intl"

import { toast } from "@/lib/toast"
import { Button } from "@/components/ui/button"

export interface MockActionProps extends Omit<
  React.ComponentProps<typeof Button>,
  "onClick"
> {
  /** Lo que haría la acción real; se enseña en el aviso. */
  efecto: string
}

/**
 * Acción del operador sin backend. En el arquetipo solo avisa de lo que
 * haría; al conectar la API, cada una pasa a llamar a su mutación. Así las
 * páginas ya tienen sus botones en el sitio correcto.
 */
export function MockAction({ efecto, children, ...props }: MockActionProps) {
  const t = useTranslations("admin.mockAction")
  return (
    <Button
      {...props}
      onClick={() =>
        toast(t("title"), {
          description: efecto,
        })
      }
    >
      {children}
    </Button>
  )
}
