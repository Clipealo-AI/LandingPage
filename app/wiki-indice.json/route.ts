import { indiceWiki } from "@/lib/wiki/indice"

// Se genera en el build, como `/openapi.json`: el catálogo es código
export const dynamic = "force-static"

/**
 * `/wiki-indice.json`: el índice del buscador de la wiki.
 *
 * Va aparte y no dentro de cada página: son ~180 KB que solo hacen falta al
 * buscar, y metidos en el HTML eran la mitad del peso de todas las páginas de
 * la wiki. El navegador lo pide la primera vez que se abre el buscador (o al
 * pasar por encima) y lo guarda para el resto de la visita.
 */
export function GET() {
  return Response.json(indiceWiki())
}
