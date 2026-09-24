/**
 * Lo que puede salir mal al hablar con el servidor, como CÓDIGOS.
 *
 * Misma regla que las validaciones del dominio: aquí no hay frases. Un
 * `error.message` en crudo es el texto de un servidor —en su idioma, con su
 * jerga— pintado en la cara de quien usa la app; los códigos los traduce quien
 * los enseña, en `common.errors.<codigo>`.
 */

export const CODIGOS_ERROR = [
  /** No se llegó a salir: no hay red, o el servidor no responde. */
  "sin-red",
  /** La sesión no vale (401) o no alcanza (403). */
  "no-autorizado",
  /** No existe, o ya no (404, 410). */
  "no-encontrado",
  /** Alguien lo cambió antes (409), o el estado no lo permite (422). */
  "conflicto",
  /** Demasiadas peticiones (429): hay que esperar. */
  "limite",
  /** Se rompió del otro lado (5xx). */
  "servidor",
  /** Cualquier otra cosa. Se enseña como «algo ha fallado». */
  "desconocido",
] as const
export type CodigoErrorApi = (typeof CODIGOS_ERROR)[number]

/** El código que le toca a un estado HTTP. */
export function codigoDeEstado(estado: number): CodigoErrorApi {
  if (estado === 401 || estado === 403) return "no-autorizado"
  if (estado === 404 || estado === 410) return "no-encontrado"
  if (estado === 409 || estado === 422) return "conflicto"
  if (estado === 429) return "limite"
  if (estado >= 500) return "servidor"
  return "desconocido"
}

/**
 * Un fallo de la frontera. Lleva el código y, para el registro, lo que dijo el
 * servidor; lo que se le enseña a la persona sale del código.
 */
export class ErrorApi extends Error {
  constructor(
    readonly codigo: CodigoErrorApi,
    /** Estado HTTP, cuando hubo respuesta. */
    readonly estado?: number,
    /** El cuerpo o el mensaje original. Para la consola, nunca para la interfaz. */
    detalle?: string
  ) {
    super(detalle ?? codigo)
    this.name = "ErrorApi"
  }
}

/**
 * El código de cualquier cosa que se haya lanzado. Un error que no es nuestro
 * —una promesa rechazada, un `TypeError` de `fetch`— también tiene que poder
 * decirse en tres idiomas.
 */
export function codigoDeError(error: unknown): CodigoErrorApi {
  if (error instanceof ErrorApi) return error.codigo
  // `fetch` rechaza con TypeError cuando no hay salida a la red
  if (error instanceof TypeError) return "sin-red"
  return "desconocido"
}
