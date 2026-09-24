"use client"

import { TomaSkeleton } from "@/components/onboarding/toma-skeleton"

/**
 * Mientras Next trae la bienvenida (p. ej. justo tras crear la cuenta): el
 * esqueleto con la geometría de una toma, sin hueco en blanco. Cliente, como
 * `(app)/loading.tsx`: se pinta en paralelo a los layouts y toma los textos
 * del proveedor de la zona.
 */
export default function BienvenidaLoading() {
  return <TomaSkeleton />
}
