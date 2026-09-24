import { ENDPOINTS } from "@/lib/wiki"
import { AREA_INFO } from "@/lib/wiki/areas"
import type { Campo, Endpoint, Esquema } from "@/lib/wiki/tipos"
import { siteConfig } from "@/lib/site"

/**
 * La especificación OpenAPI 3.1 de la API de Clipealo, generada del mismo
 * catálogo que pinta la wiki: una sola fuente, dos salidas. Sirve para Postman,
 * para generar un cliente o para que el backend compruebe que cumple.
 *
 * Los tipos del front (`SourceVideo`, `Envio`…) no se traducen a JSON Schema
 * completo: cada esquema lleva sus campos documentados, su tipo de TypeScript
 * en `x-tipo-ts` y un ejemplo real.
 */

/** Un tipo de TypeScript a lo más parecido en JSON Schema. */
function esquemaDeTipo(tipo: string): Record<string, unknown> {
  const t = tipo.trim()
  if (t.endsWith("[]")) return { type: "array", items: esquemaDeTipo(t.slice(0, -2)) }
  if (t === "string") return { type: "string" }
  if (t === "number") return { type: "number" }
  if (t === "boolean") return { type: "boolean" }
  if (t === "null") return { type: "null" }
  // Uniones de literales: "tiktok" | "youtube"
  if (/^"[^"]*"(\s*\|\s*"[^"]*")+$/.test(t))
    return { type: "string", enum: [...t.matchAll(/"([^"]*)"/g)].map((m) => m[1]) }
  return { type: "object", "x-tipo-ts": t }
}

function propiedades(campos: Campo[]) {
  return {
    type: "object",
    properties: Object.fromEntries(
      campos.map((c) => [
        c.nombre,
        { ...esquemaDeTipo(c.tipo), description: c.descripcion },
      ])
    ),
    required: campos.filter((c) => c.requerido).map((c) => c.nombre),
  }
}

function esquema(e: Esquema) {
  const base = e.campos?.length ? propiedades(e.campos) : esquemaDeTipo(e.tipo)
  return {
    ...base,
    "x-tipo-ts": e.tipo,
    ...(e.definidoEn ? { "x-definido-en": e.definidoEn } : {}),
    ...(e.ejemplo !== undefined ? { example: e.ejemplo } : {}),
  }
}

function operacion(e: Endpoint) {
  const parametros = (e.parametros ?? [])
    .filter((p) => p.en && p.en !== "cabecera")
    .map((p) => ({
      name: p.nombre,
      in: p.en === "ruta" ? "path" : "query",
      required: p.en === "ruta" ? true : p.requerido,
      description: p.descripcion,
      schema: esquemaDeTipo(p.tipo),
    }))
  const respuestas: Record<string, unknown> = {
    "200": {
      description: "Correcto",
      content: { "application/json": { schema: esquema(e.respuesta) } },
    },
  }
  for (const err of e.errores ?? []) {
    const http = String(err.http ?? 400)
    const previa = respuestas[http] as { description: string } | undefined
    respuestas[http] = {
      description: previa
        ? `${previa.description} · ${err.codigo}`
        : `${err.codigo}: ${err.cuando}`,
    }
  }
  return {
    operationId: e.id,
    summary: e.resumen,
    ...(e.descripcion ? { description: e.descripcion } : {}),
    tags: [AREA_INFO[e.area].titulo],
    ...(e.auth === "publico" ? { security: [] } : {}),
    ...(parametros.length ? { parameters: parametros } : {}),
    ...(e.cuerpo
      ? {
          requestBody: {
            required: true,
            content: { "application/json": { schema: esquema(e.cuerpo) } },
          },
        }
      : {}),
    responses: respuestas,
    "x-estado": e.estado,
    "x-auth": e.auth,
    "x-origen": e.origen,
    ...(e.reglas?.length ? { "x-reglas": e.reglas } : {}),
  }
}

export function especificacionOpenApi() {
  const paths: Record<string, Record<string, unknown>> = {}
  for (const e of ENDPOINTS) {
    paths[e.ruta] ??= {}
    paths[e.ruta][e.metodo.toLowerCase()] = operacion(e)
  }
  return {
    openapi: "3.1.0",
    info: {
      title: `API de ${siteConfig.name}`,
      version: "0.1.0",
      description:
        "El contrato del backend de Clipealo. x-estado «conectado»: el front ya lo llama con NEXT_PUBLIC_API_URL. «por-construir»: hoy vive en el navegador y el servidor tendrá que darlo con esta forma. Generado de la wiki (/docs/api).",
    },
    servers: [
      { url: "{base}", variables: { base: { default: "https://api.clipealo.com" } } },
    ],
    tags: Object.values(AREA_INFO).map((a) => ({
      name: a.titulo,
      description: a.descripcion,
    })),
    components: {
      securitySchemes: {
        sesion: {
          type: "http",
          scheme: "bearer",
          description:
            "La sesión aún no existe en el servidor (docs/costuras-backend.md, «Sesión e identidad»).",
        },
      },
    },
    security: [{ sesion: [] }],
    paths,
  }
}
