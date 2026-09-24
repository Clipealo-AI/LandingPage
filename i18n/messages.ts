import type { AbstractIntlMessages } from "next-intl"

import type { Namespace } from "@/messages/es"

/** Un espacio de nombres entero («campaigns») o una rama suya («admin.costes»). */
export type ClaveMensajes = Namespace | `${Namespace}.${string}`

/**
 * Espacios de nombres que necesita cada zona en el cliente. Solo viaja al
 * navegador lo que la zona pinta: la landing no descarga los textos del admin.
 */
export const NAMESPACES_CLIENTE = {
  base: ["common"],
  marketing: ["common", "marketing", "pricing"],
  designSystem: ["common", "designSystem"],
  auth: ["common", "auth"],
  // Tras el registro: `campaigns` por CampaignCard, PayoutCalculator y la
  // categoría; `pricing` por el aviso que explica qué plan hace falta para
  // entrar en una campaña, que se pinta en el resultado del clipero
  onboarding: ["common", "onboarding", "taxonomy", "campaigns", "pricing"],
  /**
   * Solo el suelo: lo que se pinta en TODAS las pantallas de la app —la barra
   * lateral, la cabecera, el casillero de mensajes y el medidor del plan—.
   * Lo que usa una pantalla suelta lo añade ella con `IntlExtra`, porque este
   * juego viaja en cada carga y trece espacios de nombres eran 143 KB de
   * traducciones que la mayoría de rutas no abre nunca.
   */
  app: ["common", "app", "feedback", "pricing"],
  /**
   * Del backoffice solo el tronco: la navegación, los rótulos compartidos, las
   * métricas, el selector de mes y la caja de las tablas. La sección de cada
   * pantalla —costes, usuarios, disputas…— la trae ella con `IntlExtra`, que
   * `admin` entero son 27 KB comprimidos en cada una de las trece.
   *
   * `feedback`: el casillero pinta los tipos y los estados con los mismos
   * textos que ve quien escribió el mensaje.
   */
  admin: [
    "common",
    "admin.meta",
    "admin.nav",
    "admin.userNav",
    "admin.page",
    "admin.labels",
    "admin.metrics",
    "admin.kpi",
    "admin.plans",
    "admin.table",
    "admin.units",
    "admin.charts",
    "admin.monthPicker",
    "admin.mockAction",
    "admin.panel",
    "app",
    "campaigns",
    "feedback",
    "pricing",
    "taxonomy",
  ],
} as const satisfies Record<string, readonly ClaveMensajes[]>

/**
 * Arma el juego de mensajes con lo pedido, que puede ser un espacio entero
 * (`campaigns`) o una rama suelta (`admin.costes`).
 *
 * Las ramas importan en el backoffice: `admin` son 27 KB comprimidos y cada
 * pantalla usa su sección más un tronco común, así que mandarlo entero era
 * repetir trece veces lo que nadie abre.
 */
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
