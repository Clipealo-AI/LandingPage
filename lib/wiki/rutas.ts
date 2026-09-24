/**
 * Las direcciones de la wiki.
 *
 * Los ids llevan un punto (`proyectos.subir-video`) y el middleware de idiomas
 * trata cualquier ruta con punto como un archivo estático: no le pone idioma y
 * la ficha acababa en un 404. Por eso en la URL el punto es una barra —
 * `/docs/acciones/proyectos/subir-video`—, que además se lee mejor.
 */

const partes = (id: string) => {
  const i = id.indexOf(".")
  return [id.slice(0, i), id.slice(i + 1)] as const
}

export const hrefAccion = (id: string) => {
  const [area, slug] = partes(id)
  return `/docs/acciones/${area}/${slug}`
}

export const hrefEndpoint = (id: string) => {
  const [area, slug] = partes(id)
  return `/docs/api/${area}/${slug}`
}

/** De vuelta: los dos tramos de la URL al id del catálogo. */
export const idDe = (area: string, slug: string) => `${area}.${slug}`
