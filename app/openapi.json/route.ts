import { especificacionOpenApi } from "@/lib/wiki/openapi"

// Se genera en el build: el catálogo es código, no cambia entre peticiones
export const dynamic = "force-static"

/** `/openapi.json`: la especificación de la API, para Postman o para generar un cliente. */
export function GET() {
  return Response.json(especificacionOpenApi())
}
