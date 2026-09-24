/**
 * El esquema de la wiki de Clipealo (`/docs`).
 *
 * Todo el contenido —acciones del producto, endpoints y marca— sigue estas
 * formas, y `tests/unit/wiki.test.ts` comprueba que se cumplen: ids únicos,
 * referencias que existen y archivos de origen que están en el repositorio.
 *
 * La wiki es interna y va en español: es la referencia del equipo para el
 * producto, el backend que falta y la marca. No pasa por `messages/`.
 */

/** Las zonas del producto, en el orden en que se recorren. */
export const AREAS = [
  "acceso",
  "onboarding",
  "proyectos",
  "operaciones",
  "publicar",
  "calendario",
  "analiticas",
  "campanas",
  "agencias",
  "wallet",
  "planes",
  "formacion",
  "cuenta",
  "ayuda",
  "backoffice",
] as const
export type Area = (typeof AREAS)[number]

/** Quién hace la acción. `visitante`: sin sesión. */
export type Rol = "visitante" | "clipero" | "agencia" | "admin"

/** Los tres escalones de la web; los planes creados en el backoffice heredan de uno. */
export type PlanBase = "free" | "creator" | "business"

/** Una línea de «dónde está el código»: `ruta/al/archivo.ts:123` o solo el archivo. */
export type Origen = string

/** Un campo de un parámetro, un cuerpo o una respuesta. */
export interface Campo {
  nombre: string
  /** El tipo como se escribe en TypeScript: `string`, `"tiktok" | "youtube"`, `SourceVideo[]`. */
  tipo: string
  requerido: boolean
  descripcion: string
  /** Solo en parámetros: dónde va. */
  en?: "ruta" | "consulta" | "cabecera"
}

/** La forma de un cuerpo o de una respuesta. */
export interface Esquema {
  /** El tipo de TypeScript que lo describe en el front (`SourceVideo`, `Envio[]`…). */
  tipo: string
  /** De dónde sale ese tipo: `lib/types.ts:38`. */
  definidoEn?: Origen
  campos?: Campo[]
  /** Un ejemplo realista, con datos de la demo. */
  ejemplo?: unknown
}

/** Un error que el endpoint o la acción puede devolver. */
export interface ErrorDoc {
  /** El código que viaja (`sinPlan`, `JOB_NOT_FOUND`…), el mismo que usa el front. */
  codigo: string
  /** Solo en endpoints. */
  http?: number
  cuando: string
  /** La clave de `messages/` con la frase que ve la persona, si la hay. */
  frase?: string
  /** Si impide seguir (`bloquea: true`) o solo avisa. */
  bloquea?: boolean
}

/**
 * Una acción del producto: algo que una persona hace con un propósito
 * («Subir un video», «Retirar saldo», «Conceder el perfil de agencia»).
 */
export interface Accion {
  /** `area.verbo-objeto`, en minúsculas y con guiones: `proyectos.subir-video`. */
  id: string
  area: Area
  titulo: string
  /** Una frase: qué consigue quien la hace. */
  resumen: string
  quien: Rol[]
  /** Si el plan la limita: el escalón mínimo y qué ve quien no llega. */
  plan?: { minimo?: PlanBase; nota: string }
  /** Las pantallas donde se hace. `ruta` es la interna, en español. */
  donde: { ruta: string; etiqueta: string }[]
  /** Cómo se hace, paso a paso, con los nombres que ve la persona. */
  pasos: string[]
  /** Lo que el producto garantiza: validaciones, límites, cálculos. */
  reglas: string[]
  /** Los estados por los que pasa lo que crea, si los hay. */
  estados?: { estado: string; significa: string }[]
  errores?: ErrorDoc[]
  /** Ids de endpoints de la wiki que usa (o que tendrá que usar). */
  endpoints: string[]
  /** Dónde viven hoy los datos: almacén del navegador, frontera de datos, semilla… */
  datos: string
  /** Sonido, efecto o aviso que acompaña al resultado (regla 7 de AGENTS.md). */
  respuesta?: string
  origen: Origen[]
  relacionadas?: string[]
}

/**
 * Un endpoint del backend.
 *
 * `conectado`: el front ya lo llama cuando existe `NEXT_PUBLIC_API_URL`
 * (hay una frontera en `lib/api/`). `por-construir`: hoy vive en el navegador
 * y el servidor tendrá que darlo con esta forma para que la app no cambie.
 */
export interface Endpoint {
  /** `area.verbo`: `proyectos.listar`, `campanas.crear`. */
  id: string
  area: Area
  metodo: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  /** Con los parámetros entre llaves: `/jobs/{id}`. */
  ruta: string
  resumen: string
  descripcion?: string
  estado: "conectado" | "por-construir"
  auth: "publico" | "sesion" | "agencia" | "admin"
  parametros?: Campo[]
  cuerpo?: Esquema
  respuesta: Esquema
  errores?: ErrorDoc[]
  /** Lo que el servidor tiene que hacer cumplir: no fiarse del front. */
  reglas?: string[]
  /** Dónde está hoy: la función de `lib/api/` o el almacén que la sustituye. */
  origen: Origen
}

/** Un token de la marca que se pinta en vivo desde su variable CSS. */
export interface TokenMarca {
  /** La variable sin guiones delante: `color-brand-500`, `radius`. */
  variable: string
  nombre: string
  uso: string
}

/** Una sección de la guía de marca. */
export interface SeccionMarca {
  id: string
  titulo: string
  resumen: string
  /** Párrafos de criterio: por qué es así. */
  criterio: string[]
  /** Reglas que se cumplen siempre. */
  reglas?: string[]
  /** Lo que no se hace, con su porqué. */
  noHacer?: { que: string; porque: string }[]
  tokens?: TokenMarca[]
  origen: Origen[]
}
