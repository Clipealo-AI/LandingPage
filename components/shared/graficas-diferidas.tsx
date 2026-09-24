"use client"

import dynamic from "next/dynamic"

import { Hueco } from "@/components/shared/hueco-grafica"

/**
 * La gráfica del panel, fuera de la carga inicial.
 *
 * recharts y su d3 son 106 KB comprimidos —el segundo chunk más grande del
 * build— y entraban enteros en la primera carga de /dashboard, /analiticas,
 * /wallet, /admin, /admin/costes y /admin/ingresos, que son justo las seis
 * rutas más pesadas. Ninguna los necesita para pintar: `ResponsiveContainer`
 * mide en el navegador, así que en el servidor la gráfica salía como un hueco
 * vacío de todos modos. Aquí se cargan cuando toca, con `ssr: false` para que
 * el servidor tampoco las arme.
 *
 * Este archivo es cliente a propósito: `ssr: false` no se puede usar desde un
 * componente de servidor, y varias de estas gráficas las monta una página que
 * lo es. Un envoltorio de cliente por medio resuelve las dos cosas.
 *
 * Cada hueco mide lo mismo que su gráfica para que no salte el layout, y es
 * una caja quieta: un pulso sería un efecto nuevo que además tendría que
 * seguir viéndose con «reducir movimiento».
 */

const hueco = (alto: string) => {
  const Carga = () => <Hueco className={alto} />
  return Carga
}

/** Panel: reproducciones por día (`h-52`). */
export const ViewsChart = dynamic(
  () => import("@/components/app/views-chart").then((m) => m.ViewsChart),
  { ssr: false, loading: hueco("h-52") }
)
