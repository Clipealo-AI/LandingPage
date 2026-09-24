import { notFound } from "next/navigation"

/** Cualquier dirección desconocida dentro de un idioma: 404 con su layout y sus textos. */
export default function CatchAllPage() {
  notFound()
}
