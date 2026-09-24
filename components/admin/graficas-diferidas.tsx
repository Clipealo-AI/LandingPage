"use client"

import dynamic from "next/dynamic"

import { Hueco } from "@/components/shared/hueco-grafica"

/**
 * Las gráficas del backoffice, fuera de la carga inicial de /admin,
 * /admin/costes y /admin/ingresos. Mismo motivo y mismo patrón que las de la
 * app (`graficas-diferidas.tsx`), en archivo aparte porque estas hablan el
 * idioma del backoffice: juntas, una ruta de la app arrastraría los textos de
 * admin por el simple hecho de nombrarlas.
 */

const hueco = (alto: string) => {
  const Carga = () => <Hueco className={alto} />
  return Carga
}

/** Puente de MRR (`h-56`) y caja (`h-48`). */
export const MrrBridgeChart = dynamic(
  () => import("@/components/admin/mrr-chart").then((m) => m.MrrBridgeChart),
  { ssr: false, loading: hueco("h-56") }
)
export const CajaChart = dynamic(
  () => import("@/components/admin/mrr-chart").then((m) => m.CajaChart),
  { ssr: false, loading: hueco("h-48") }
)

/** Costes: la serie (`h-48`) y el coste por minuto (`h-40`). */
export const CostesSerieChart = dynamic(
  () => import("@/components/admin/costes-serie-chart").then((m) => m.CostesSerieChart),
  { ssr: false, loading: hueco("h-48") }
)
export const CostePorMinutoChart = dynamic(
  () =>
    import("@/components/admin/costes-serie-chart").then((m) => m.CostePorMinutoChart),
  { ssr: false, loading: hueco("h-40") }
)
