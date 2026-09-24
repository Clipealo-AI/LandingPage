import type { AbstractIntlMessages } from "next-intl"

import type { Namespace } from "@/messages/es"

/** Un espacio de nombres entero o una rama suya. */
export type ClaveMensajes = Namespace | `${Namespace}.${string}`

/** Textos que necesita cada parte pública. */
export const NAMESPACES_CLIENTE = {
  base: ["common"],
  marketing: ["common", "marketing", "pricing", "routes"],
} as const satisfies Record<string, readonly ClaveMensajes[]>

export function pickMessages(
  messages: AbstractIntlMessages,
  namespaces: readonly ClaveMensajes[]
): AbstractIntlMessages {
  const salida: Record<string, unknown> = {}
  for (const clave of namespaces) {
    const partes = clave.split(".")
    let origen: unknown = messages
    for (const parte of partes) {
      origen =
        origen && typeof origen === "object"
          ? (origen as Record<string, unknown>)[parte]
          : undefined
    }
    let destino = salida
    for (const parte of partes.slice(0, -1)) {
      destino = (destino[parte] ??= {}) as Record<string, unknown>
    }
    destino[partes[partes.length - 1]] = origen ?? {}
  }
  return salida as AbstractIntlMessages
}
