"use client"

import { useTranslations } from "next-intl"

import { CATALOGO_SEMILLA, type Leccion, type Ruta } from "@/lib/formacion"

/**
 * El título y la descripción de una clase o de una ruta, en el idioma activo.
 *
 * Las de FÁBRICA las escribe el equipo de Clipealo, así que son producto y se
 * traducen: viven en `formacion.clases.<id>` y `formacion.rutas.<id>`. Sin
 * esto, quien tenía la app en inglés leía «Tu primera semana» y «Subtítulos que
 * se leen sin sonido» en medio de una pantalla en inglés.
 *
 * Las que el admin escribe o reescribe en el backoffice NO se traducen: son
 * contenido suyo, y va en el idioma en que lo escribió. Se distingue
 * comparando con la semilla, campo a campo: mientras el texto sea el de
 * fábrica manda la traducción, y en cuanto alguien lo cambia manda el suyo.
 * Misma regla que el nombre de un plan creado (`useNombrePlan`).
 */

const CLASE_SEMILLA = new Map(CATALOGO_SEMILLA.lecciones.map((l) => [l.id, l]))
const RUTA_SEMILLA = new Map(CATALOGO_SEMILLA.rutas.map((r) => [r.id, r]))

type Campo = "titulo" | "descripcion"
type ConTextos = Pick<Leccion, "id" | "titulo" | "descripcion">

export function useTextoClase() {
  const t = useTranslations("formacion.clases")
  // Sin `useMemo`: las reglas de `react-hooks` no podían casar sus
  // dependencias con las de quien la usa dentro de un callback, y avisaban en
  // cada uso. El coste de no memorizar es un `Map.get` por texto
  return (clase: ConTextos, campo: Campo) => {
    const semilla = CLASE_SEMILLA.get(clase.id)
    return semilla && semilla[campo] === clase[campo]
      ? t(`${clase.id}.${campo}` as never)
      : clase[campo]
  }
}

export function useTextoRuta() {
  const t = useTranslations("formacion.rutas")
  return (ruta: Pick<Ruta, "id" | "titulo" | "descripcion">, campo: Campo) => {
    const semilla = RUTA_SEMILLA.get(ruta.id)
    return semilla && semilla[campo] === ruta[campo]
      ? t(`${ruta.id}.${campo}` as never)
      : ruta[campo]
  }
}
