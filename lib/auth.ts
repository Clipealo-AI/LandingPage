/**
 * Acceso a la cuenta: validación y un backend simulado.
 *
 * Las funciones `iniciarSesion`, `crearCuenta`, `enviarEnlaceRecuperacion` y
 * `continuarCon` devuelven lo mismo que devolverá la API real (`{ ok: true }` o
 * `{ ok: false, error }`), así que la pantalla ya trata los errores y cambiar a
 * la API es sustituir su cuerpo. Mientras tanto, cualquier correo válido entra.
 * Lo que la cuenta responde después (tipo, consentimientos, onboarding) se
 * guarda en `hooks/use-cuenta.ts`.
 *
 * Nada de aquí devuelve frases: los errores son códigos y las reglas de la
 * contraseña, ids. La pantalla los traduce con `auth.errors` y `auth.password`.
 */

import { routing } from "@/i18n/routing"

export const MODOS_ACCESO = ["entrar", "registro", "recuperar"] as const
export type ModoAcceso = (typeof MODOS_ACCESO)[number]

export const PROVEEDORES = ["google", "apple", "tiktok"] as const
export type Proveedor = (typeof PROVEEDORES)[number]

/** Marcas: no se traducen. */
export const PROVEEDOR_LABEL: Record<Proveedor, string> = {
  google: "Google",
  apple: "Apple",
  tiktok: "TikTok",
}

/** Cómo va a usar Clipealo: decide qué ve primero al entrar. Textos en `auth.signup.types`. */
export const TIPOS_CUENTA = ["clipero", "agencia"] as const
export type TipoCuenta = (typeof TIPOS_CUENTA)[number]

export const PASSWORD_MIN = 8
export const NOMBRE_MAX = 60

export type ReglaPasswordId = "longitud" | "numero" | "mayusculas" | "simbolo"

/** Error de un campo: código y, si la frase lleva cifras o listas, sus valores. */
export type ErrorCampo =
  | { code: "correoVacio" | "correoInvalido" | "nombreCorto" | "mayorDeEdad" }
  | { code: "nombreLargo"; values: { max: number } }
  | { code: "passwordFalta"; values: { faltan: ReglaPasswordId[] } }

/**
 * Clipealo es solo para mayores de 18: la casilla es obligatoria, va separada
 * de los términos y la edad real se verifica en el primer retiro.
 */
export function validarMayorDeEdad(mayorDeEdad: boolean): ErrorCampo | null {
  return mayorDeEdad ? null : { code: "mayorDeEdad" }
}

export function validarCorreo(correo: string): ErrorCampo | null {
  const c = correo.trim()
  if (!c) return { code: "correoVacio" }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c)) return { code: "correoInvalido" }
  return null
}

export function validarNombre(nombre: string): ErrorCampo | null {
  const n = nombre.trim()
  if (n.length < 2) return { code: "nombreCorto" }
  if (n.length > NOMBRE_MAX) return { code: "nombreLargo", values: { max: NOMBRE_MAX } }
  return null
}

export interface ReglaPassword {
  id: ReglaPasswordId
  cumple: boolean
}

export function reglasPassword(password: string): ReglaPassword[] {
  return [
    { id: "longitud", cumple: password.length >= PASSWORD_MIN },
    { id: "numero", cumple: /\d/.test(password) },
    {
      id: "mayusculas",
      cumple: /[a-záéíóúñ]/.test(password) && /[A-ZÁÉÍÓÚÑ]/.test(password),
    },
    { id: "simbolo", cumple: /[^A-Za-z0-9áéíóúñÁÉÍÓÚÑ]/.test(password) },
  ]
}

/** Nivel del medidor; la palabra de cada nivel está en `auth.password.strength`. */
export type FuerzaPassword = 0 | 1 | 2 | 3 | 4

/** 0–4. Largo cuenta doble: 16 caracteres sin símbolos valen más que 8 con todo. */
export function fuerzaPassword(password: string): FuerzaPassword {
  if (!password) return 0
  const r = reglasPassword(password)
  let puntos = r.filter((x) => x.cumple).length
  if (password.length >= 14) puntos += 1
  return Math.max(1, Math.min(4, puntos)) as FuerzaPassword
}

/** Para crear cuenta: las tres reglas obligatorias. El símbolo solo suma fuerza. */
export function validarPasswordNueva(password: string): ErrorCampo | null {
  const faltan = reglasPassword(password)
    .filter((r) => r.id !== "simbolo" && !r.cumple)
    .map((r) => r.id)
  return faltan.length ? { code: "passwordFalta", values: { faltan } } : null
}

/** Errores que devuelve el servidor, como códigos. */
export type ErrorAcceso =
  "credenciales" | "datosCuenta" | "correoNoValido" | "proveedorNoDisponible"

export type Resultado = { ok: true } | { ok: false; error: ErrorAcceso }

const esperar = (ms: number) => new Promise((listo) => setTimeout(listo, ms))

export async function iniciarSesion(
  correo: string,
  password: string
): Promise<Resultado> {
  await esperar(900)
  if (validarCorreo(correo) || !password) return { ok: false, error: "credenciales" }
  return { ok: true }
}

export async function crearCuenta(datos: {
  nombre: string
  correo: string
  password: string
  mayorDeEdad: boolean
}): Promise<Resultado> {
  await esperar(1100)
  if (
    validarNombre(datos.nombre) ||
    validarCorreo(datos.correo) ||
    validarPasswordNueva(datos.password) ||
    validarMayorDeEdad(datos.mayorDeEdad)
  )
    return { ok: false, error: "datosCuenta" }
  return { ok: true }
}

export async function enviarEnlaceRecuperacion(correo: string): Promise<Resultado> {
  await esperar(800)
  // Por seguridad, la respuesta es la misma exista o no la cuenta
  return validarCorreo(correo) ? { ok: false, error: "correoNoValido" } : { ok: true }
}

/** Vuelta del OAuth: `nueva` si la cuenta se acaba de crear con ese proveedor. */
export type ResultadoOAuth =
  { ok: true; nueva: boolean } | { ok: false; error: ErrorAcceso }

/**
 * Con la API real abre el OAuth del proveedor; aquí solo simula la vuelta. En la
 * demo la cuenta ya existe (`nueva: false`): quien entra es Ana, con el
 * onboarding completado, y va a su destino.
 */
export async function continuarCon(proveedor: Proveedor): Promise<ResultadoOAuth> {
  await esperar(900)
  return PROVEEDORES.includes(proveedor)
    ? { ok: true, nueva: false }
    : { ok: false, error: "proveedorNoDisponible" }
}

const PREFIJO_IDIOMA = new RegExp(`^/(${routing.locales.join("|")})(?=/|$|[?#])`)

/**
 * La bienvenida en sus tres idiomas: volver a ella tras el onboarding sería un
 * bucle. `/login` se sigue comparando por prefijo, como siempre.
 */
const RUTA_BIENVENIDA = /^\/(bienvenida|welcome|boas-vindas)(?=\/|$|[?#])/

/**
 * Solo rutas internas: un `?next=` externo sería una redirección abierta. Nunca
 * devuelve `/login` ni la bienvenida (`/bienvenida`, `/welcome`, `/boas-vindas`).
 *
 * Devuelve la ruta sin prefijo de idioma: el `router` de `@/i18n/navigation`
 * le pone el del idioma activo. Así `?next=/en/campaigns` no acaba en
 * `/en/en/campaigns`, y una dirección de otro idioma la corrige el proxy.
 */
export function destinoSeguro(
  next: string | null | undefined,
  porDefecto = "/dashboard"
) {
  if (!next?.startsWith("/")) return porDefecto
  const sinIdioma = next.replace(PREFIJO_IDIOMA, "")
  const ruta = sinIdioma.startsWith("/") ? sinIdioma : `/${sinIdioma}`
  if (
    ruta.startsWith("//") ||
    ruta.startsWith("/\\") ||
    ruta.startsWith("/login") ||
    RUTA_BIENVENIDA.test(ruta)
  )
    return porDefecto
  return ruta
}
