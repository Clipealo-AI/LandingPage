/**
 * FRONTERA DE SUBIDA.
 *
 * `UploadTransport` es el hueco donde entra el cliente real —tus-js-client,
 * multipart de S3, Uppy…— sin que el hook ni la interfaz cambien. El contrato
 * está pensado para reanudar: se entra por `offset` y se sale devolviendo los
 * bytes confirmados, que es exactamente lo que hace un `PATCH` de tus o una
 * parte de un multipart.
 */
export interface UploadTransportParams {
  file: File
  /** Bytes ya confirmados por el servidor. 0 en la primera llamada. */
  offset: number
  signal: AbortSignal
  /** Se llama con el total acumulado, no con el incremento. */
  onProgress: (uploadedBytes: number) => void
}

export interface UploadTransportResult {
  uploadedBytes: number
  completed: boolean
  /**
   * Dónde quedó el archivo, cuando el transporte lo sabe. Es el hueco por el que
   * entra el almacenamiento: tus devuelve la ubicación en la cabecera
   * `Location`, y un multipart de S3 la conoce desde que firma la subida.
   *
   * Hoy nadie lo rellena —no hay dónde guardar nada— y quien lo consume tiene
   * que estar preparado para que falte: el panel de Formación, por ejemplo,
   * enseña el archivo subido y dice que el enlace llegará con el almacenamiento.
   */
  url?: string
}

export interface UploadTransport {
  upload(params: UploadTransportParams): Promise<UploadTransportResult>
}

/** Tamaño de trozo. tus y S3 multipart trabajan igual: en bloques. */
const CHUNK_BYTES = 512 * 1024
const CHUNK_DELAY_MS = 90

class AbortedError extends Error {
  constructor() {
    super("Subida detenida")
    this.name = "AbortError"
  }
}

/**
 * Transporte de demostración: recorre el archivo por trozos con una pausa
 * entre cada uno. Respeta el aborto y devuelve el offset alcanzado, así que
 * pausar y reanudar funciona de verdad, no es una animación.
 */
export const simulatedTransport: UploadTransport = {
  async upload({ file, offset, signal, onProgress }) {
    let uploaded = offset

    while (uploaded < file.size) {
      if (signal.aborted) return { uploadedBytes: uploaded, completed: false }

      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(resolve, CHUNK_DELAY_MS)
        signal.addEventListener(
          "abort",
          () => {
            clearTimeout(timer)
            reject(new AbortedError())
          },
          { once: true }
        )
      }).catch((error: unknown) => {
        if (error instanceof AbortedError) return
        throw error
      })

      if (signal.aborted) return { uploadedBytes: uploaded, completed: false }

      uploaded = Math.min(file.size, uploaded + CHUNK_BYTES)
      onProgress(uploaded)
    }

    // Sin `url`: esto recorre el archivo, no lo guarda en ninguna parte, y
    // devolver una dirección inventada sería mentir sobre lo que ha pasado
    return { uploadedBytes: uploaded, completed: true }
  },
}
