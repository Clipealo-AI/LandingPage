import { hayServidor, pedir } from "@/lib/api/cliente"
import { AHORA_AGENDA, type FalloPublicacion } from "@/lib/agenda"
import { SOCIAL_IDS, type SocialId } from "@/lib/social"

/**
 * FRONTERA DE DATOS: el envío a la red.
 *
 * Es lo único que hay que tocar para que Clipealo publique de verdad. Como en
 * `lib/api/jobs.ts`, cada función pregunta primero si hay servidor
 * (`NEXT_PUBLIC_API_URL`) y, si lo hay, pide por HTTP; sin esa variable
 * simula, que es lo que hace andar la demo.
 *
 * Lo que el servidor tendrá que hacer, escrito para que no se descubra tarde
 * (`docs/costuras-backend.md`):
 *
 * 1. OAuth con **permiso de publicación** en cada plataforma, que no es el
 *    mismo permiso que leer seguidores. Sin él, `permisoDenegado`.
 * 2. Una cola que despierte a la hora programada y marque `publicando` antes
 *    de salir, para que dos procesos no envíen el mismo clip dos veces.
 * 3. Guardar el `postId` que devuelve la plataforma: es con lo que se leen las
 *    métricas después, no con la URL.
 * 4. Volver a comprobar el plan (red y cupo) en el servidor: lo que valida el
 *    navegador es cortesía, no seguridad.
 * 5. Devolver el fallo como CÓDIGO (`FalloPublicacion`), nunca la frase de la
 *    plataforma: se enseña en tres idiomas.
 *
 * Ninguna función de aquí escribe en el almacén: quien llama guarda el
 * resultado en la entrada (`hooks/use-agenda.ts`). Así el reintento y el envío
 * son la misma operación vista desde fuera.
 */

/** Lo que hace falta para mandar una publicación. */
export interface EnvioPublicacion {
  entradaId: string
  red: SocialId
  /** Sin cuenta viva no hay dónde publicar: la comprobación es del dominio. */
  cuentaId?: string
  /** Para construir el enlace; el servidor no lo necesita. */
  handle?: string
  /** Solo donde la red tiene campo de título aparte. */
  titulo?: string
  texto: string
  /** El archivo que se sube. En la demo no viaja nada. */
  clipId?: string
}

/** Lo que devuelve la plataforma cuando acepta. */
export interface Publicado {
  url: string
  postId: string
  publicadaEn: string
}

/**
 * No salió. Lleva el código y no una frase: lo que se lee en pantalla sale de
 * `calendario.fallo.<codigo>`.
 */
export class PublicacionFallida extends Error {
  constructor(
    readonly fallo: FalloPublicacion,
    readonly entradaId: string
  ) {
    super(`Publicación fallida (${fallo}): ${entradaId}`)
    this.name = "PublicacionFallida"
  }
}

/** Latencia fingida para que «publicando» se vea de verdad. */
const ESPERA_ENVIO_MS = 900

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** Dónde vive un post en cada red. El `@handle` es el de la cuenta que publica. */
const ENLACE: Record<SocialId, (handle: string, postId: string) => string> = {
  tiktok: (h, id) => `https://www.tiktok.com/${h}/video/${id}`,
  instagram: (_h, id) => `https://www.instagram.com/reel/${id}/`,
  youtube: (_h, id) => `https://youtube.com/shorts/${id}`,
  x: (h, id) => `https://x.com/${h.replace(/^@/, "")}/status/${id}`,
  linkedin: (_h, id) => `https://www.linkedin.com/feed/update/${id}/`,
  facebook: (_h, id) => `https://www.facebook.com/reel/${id}`,
}

/**
 * Un `postId` que sale siempre igual del mismo envío: sin él, reintentar en la
 * demo daría un enlace distinto cada vez y el calendario parecería otro.
 */
function postIdDe(envio: EnvioPublicacion): string {
  let h = 2166136261
  for (const parte of [envio.entradaId, envio.red, envio.cuentaId ?? ""])
    for (let i = 0; i < parte.length; i++) {
      h ^= parte.charCodeAt(i)
      h = Math.imul(h, 16777619) >>> 0
    }
  // Catorce dígitos, como los ids de las plataformas
  return String(74_000_000_000_000 + (h % 999_999_999_999))
}

/**
 * Manda la publicación y devuelve el enlace, o lanza `PublicacionFallida` con
 * el motivo. Reintentar es volver a llamar: no hay dos caminos.
 *
 * En la demo no falla nunca por azar. Un producto que finge errores
 * aleatorios enseña a desconfiar de él; los fallos que hay que poder ver
 * —cuenta caída, texto vacío— se provocan con datos, no con dados.
 */
export async function publicar(
  envio: EnvioPublicacion,
  ahora: string = AHORA_AGENDA
): Promise<Publicado> {
  if (hayServidor())
    return pedir<Publicado>(`/publicaciones/${envio.entradaId}/enviar`, {
      method: "POST",
      body: envio,
    })

  await delay(ESPERA_ENVIO_MS)
  if (!envio.cuentaId) throw new PublicacionFallida("cuentaCaducada", envio.entradaId)
  if (!SOCIAL_IDS.includes(envio.red))
    throw new PublicacionFallida("rechazoRed", envio.entradaId)
  if (!envio.texto.trim() && !envio.titulo?.trim())
    throw new PublicacionFallida("rechazoRed", envio.entradaId)

  const postId = postIdDe(envio)
  return {
    postId,
    url: ENLACE[envio.red](envio.handle ?? "@clipealo", postId),
    publicadaEn: ahora,
  }
}

/**
 * Lo que la plataforma dice de una publicación ya enviada. Hoy no hay nada que
 * preguntar sin servidor; existe para que Analíticas tenga por dónde entrar
 * cuando lo haya, y para que nadie invente la lectura en un componente.
 */
export async function leerEstado(entradaId: string): Promise<Publicado | null> {
  if (hayServidor()) return pedir<Publicado | null>(`/publicaciones/${entradaId}`)
  return null
}
