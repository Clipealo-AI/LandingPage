import { Climate_Crisis, DM_Sans } from "next/font/google"

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
