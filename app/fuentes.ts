import { Climate_Crisis, DM_Sans, Geist_Mono } from "next/font/google"

/**
 * Las tres familias, declaradas UNA sola vez.
 *
 * `next/font` emite una hoja de estilos por punto de llamada: mientras el
 * layout y `global-error.tsx` las pedían cada uno por su cuenta salían tres
 * hojas, y la del error —que no se aplica nunca— se precargaba en las 195
 * páginas. Con un único módulo hay una sola hoja y la pantalla de error usa la
 * que ya está. Si alguien vuelve a llamar a `Climate_Crisis` en otro archivo,
 * la hoja duplicada reaparece.
 */

/**
 * Climate Crisis es variable en el eje YEAR: a más alto, más condensada.
 * El manual usa la versión compacta, por eso se fija en `.display`.
 */
export const climateCrisis = Climate_Crisis({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-climate-crisis",
  display: "swap",
  // Fallback metricamente ajustado: sin esto el titular salta al cargar la fuente
  adjustFontFallback: false,
  fallback: ["Arial Black", "system-ui"],
})

export const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
})

/**
 * Sin `preload`: la mono solo se pinta en /design-system, en /admin/afiliados y
 * en la ficha de una campaña privada, así que en las otras 191 páginas
 * competía por el ancho de banda con la hoja bloqueante sin llegar a usarse.
 * Tiene fallback ajustado y `swap`, así que donde sí sale se ve desde el
 * primer fotograma y sin desplazamiento.
 */
export const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
  preload: false,
})
