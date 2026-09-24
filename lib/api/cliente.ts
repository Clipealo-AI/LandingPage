import { ErrorApi, codigoDeEstado, codigoDeError } from "@/lib/api/errores"

/**
 * EL SITIO POR DONDE ENTRA EL SERVIDOR.
 *
 * Hoy Clipealo no habla con ninguno: el arquetipo simula lo que hará. Pero la
 * primera línea de backend tiene que tener dónde ir, y este es el sitio: un
 * `fetch` con la dirección base, el tiempo máximo, los errores tipados y el
 * JSON ya leído.
 *
 * El interruptor es una variable de entorno. Sin `NEXT_PUBLIC_API_URL` no hay
 * servidor y cada función de `lib/api/*` sigue con su simulación; en cuanto se
 * rellena, esas mismas funciones piden de verdad. Así conectar la API es lo que
 * AGENTS.md promete —cambiar el cuerpo de unas pocas funciones— y no reescribir
 * los hooks ni los componentes.
 */

/** Vacío = no hay servidor todavía. */
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ""

/** ¿Hay a quién preguntar? Lo consultan las funciones de `lib/api/*`. */
export const hayServidor = () => API_URL.length > 0

/** Por defecto. Una subida larga pasa su propio `signal` y no usa esto. */
const ESPERA_MS = 15_000

export interface OpcionesPeticion extends Omit<RequestInit, "body"> {
  /** Se serializa a JSON y pone la cabecera. */
  body?: unknown
  /** Milisegundos antes de rendirse. Por defecto, 15 s. */
  esperaMs?: number
}

/**
 * Una petición a la API, con el JSON ya leído y los errores como códigos.
 *
 * Devuelve `undefined` cuando el servidor no manda cuerpo (204), así que un
 * `DELETE` se escribe `await pedir<void>(...)` sin comprobar nada.
 */
export async function pedir<T>(
  ruta: string,
  opciones: OpcionesPeticion = {}
): Promise<T> {
  const { body, esperaMs = ESPERA_MS, headers, signal, ...resto } = opciones
  if (!hayServidor())
    throw new ErrorApi("sin-red", undefined, "NEXT_PUBLIC_API_URL sin definir")

  // El reloj propio y el `signal` de quien llama conviven: cualquiera de los
  // dos puede cortar, y el que corta primero manda
  const reloj = AbortSignal.timeout(esperaMs)
  const corte = signal ? AbortSignal.any([signal, reloj]) : reloj

  let respuesta: Response
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      ...resto,
      signal: corte,
      headers: {
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (error) {
    throw new ErrorApi(codigoDeError(error), undefined, String(error))
  }

  if (!respuesta.ok) {
    // El cuerpo del error va al registro, nunca a la pantalla
    const detalle = await respuesta.text().catch(() => "")
    throw new ErrorApi(codigoDeEstado(respuesta.status), respuesta.status, detalle)
  }

  if (respuesta.status === 204) return undefined as T
  try {
    return (await respuesta.json()) as T
  } catch (error) {
    throw new ErrorApi("desconocido", respuesta.status, String(error))
  }
}
