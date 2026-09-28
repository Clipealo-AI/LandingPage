/**
 * Efectos visuales puntuales, fuera de React.
 *
 * Se pintan en una capa fija encima de todo (`#clipealo-efectos`), con la Web
 * Animations API y sin tocar el layout: el elemento que los provoca no se
 * mueve ni se re-renderiza, y cada nodo se borra al terminar su animación.
 *
 * Con «reducir movimiento» no desaparecen: pierden el desplazamiento y la
 * escala y se quedan en fundido. Reducir no es quitar la respuesta. Quién
 * decide es `prefiereMenosMovimiento()`, que también atiende a la bandera de
 * revisión `?movimiento=`.
 */

import { EASE_BRAND, prefiereMenosMovimiento } from "@/lib/preferencia-movimiento"

const CAPA_ID = "clipealo-efectos"

function capa() {
  let el = document.getElementById(CAPA_ID)
  if (!el) {
    el = document.createElement("div")
    el.id = CAPA_ID
    el.setAttribute("aria-hidden", "true")
    Object.assign(el.style, {
      position: "fixed",
      inset: "0",
      pointerEvents: "none",
      zIndex: "2147483000",
      overflow: "hidden",
    })
    document.body.appendChild(el)
  }
  return el
}

function animarYBorrar(
  nodo: HTMLElement,
  frames: Keyframe[],
  opciones: KeyframeAnimationOptions
) {
  const quitar = () => nodo.remove()
  try {
    nodo.animate(frames, opciones).finished.then(quitar, quitar)
  } catch {
    // Sin WAAPI: el nodo no debe quedarse pintado
    quitar()
  }
}

function caja(target: Element) {
  const r = target.getBoundingClientRect()
  return r.width && r.height ? r : null
}

/**
 * Caja del elemento SIN sus transformaciones. El efecto se dispara con el botón
 * aún hundido (escala 0,97 y 1 px abajo): medir eso dejaba las esquinas a 1 px
 * de los lados en vez de a su margen, y descentradas en vertical.
 */
function cajaEnReposo(target: Element) {
  const r = caja(target)
  if (!r) return null
  if (!(target instanceof HTMLElement)) return r
  const ancho = target.offsetWidth
  const alto = target.offsetHeight
  const cx = r.left + r.width / 2
  const cy =
    r.top +
    r.height / 2 -
    (parseFloat(getComputedStyle(target).translate.split(" ")[1] ?? "0") || 0)
  return { left: cx - ancho / 2, top: cy - alto / 2, width: ancho, height: alto }
}

/**
 * Marca de recorte: las cuatro esquinas encuadran el botón un instante.
 * Es el gesto de la marca («este es el momento») aplicado a la acción principal.
 *
 * El color es `--crop-color` del propio botón (naranja por defecto; tinta sobre
 * la sección naranja del CTA), salvo que se pase `color`. Se lee aquí y se pasa
 * como valor: la capa fija cuelga de <body> y no hereda las variables de la
 * sección.
 */
export function cropSnap(target: Element, { color }: { color?: string } = {}) {
  const r = cajaEnReposo(target)
  if (!r) return
  const tinta =
    color ??
    (getComputedStyle(target).getPropertyValue("--crop-color").trim() ||
      "var(--color-brand-500)")

  const margen = 6
  const lado = Math.round(Math.min(14, Math.max(8, r.height * 0.35)))
  const marco = document.createElement("div")
  Object.assign(marco.style, {
    position: "absolute",
    left: `${r.left - margen}px`,
    top: `${r.top - margen}px`,
    width: `${r.width + margen * 2}px`,
    height: `${r.height + margen * 2}px`,
  })

  const esquinas: [string, Partial<CSSStyleDeclaration>][] = [
    [
      "tl",
      {
        top: "0",
        left: "0",
        borderRight: "0",
        borderBottom: "0",
        borderTopLeftRadius: "5px",
      },
    ],
    [
      "tr",
      {
        top: "0",
        right: "0",
        borderLeft: "0",
        borderBottom: "0",
        borderTopRightRadius: "5px",
      },
    ],
    [
      "bl",
      {
        bottom: "0",
        left: "0",
        borderRight: "0",
        borderTop: "0",
        borderBottomLeftRadius: "5px",
      },
    ],
    [
      "br",
      {
        bottom: "0",
        right: "0",
        borderLeft: "0",
        borderTop: "0",
        borderBottomRightRadius: "5px",
      },
    ],
  ]
  for (const [, estilo] of esquinas) {
    const e = document.createElement("span")
    Object.assign(e.style, {
      position: "absolute",
      width: `${lado}px`,
      height: `${lado}px`,
      border: `2.5px solid ${tinta}`,
      ...estilo,
    })
    marco.appendChild(e)
  }
  capa().appendChild(marco)

  // Curva por tramo y no global: con la curva de marca sobre toda la animación,
  // la entrada ocupaba el 7 % del tiempo y el fundido de salida casi todo el
  // resto. Así: entra en ~150 ms, se sostiene y se va.
  const frames: Keyframe[] = prefiereMenosMovimiento()
    ? [
        { opacity: 0, easing: "ease-out" },
        { opacity: 1, offset: 0.25 },
        { opacity: 1, offset: 0.7, easing: "ease-in" },
        { opacity: 0 },
      ]
    : [
        { opacity: 0, transform: "scale(1.22)", easing: EASE_BRAND },
        { opacity: 1, transform: "scale(1)", offset: 0.28 },
        { opacity: 1, transform: "scale(1)", offset: 0.7, easing: "ease-in" },
        { opacity: 0, transform: "scale(0.98)" },
      ]
  animarYBorrar(marco, frames, { duration: 560, easing: "linear" })
}

const COLORES = [
  "var(--color-brand-500)",
  "var(--color-blue-500)",
  "var(--color-brand-300)",
  "var(--color-blue-300)",
]

/**
 * Celebración: esquinas de recorte y cuadraditos que salen del elemento.
 * Se reserva a los hitos (publicar, terminar una subida, conectar una red).
 */
export function burst(target: Element) {
  const r = caja(target)
  if (!r) return
  const cx = r.left + r.width / 2
  const cy = r.top + r.height / 2
  const lienzo = capa()

  if (prefiereMenosMovimiento()) {
    // Sin trayectorias: un halo que aparece y se va en su sitio
    const halo = document.createElement("span")
    const d = Math.max(r.width, r.height) + 20
    Object.assign(halo.style, {
      position: "absolute",
      left: `${cx - d / 2}px`,
      top: `${cy - d / 2}px`,
      width: `${d}px`,
      height: `${d}px`,
      borderRadius: "9999px",
      boxShadow:
        "0 0 0 3px var(--color-brand-500), 0 0 24px 4px color-mix(in oklab, var(--color-brand-500) 45%, transparent)",
    })
    lienzo.appendChild(halo)
    animarYBorrar(
      halo,
      [
        { opacity: 0, easing: "ease-out" },
        { opacity: 1, offset: 0.2 },
        { opacity: 1, offset: 0.5, easing: "ease-in" },
        { opacity: 0 },
      ],
      { duration: 700, easing: "linear" }
    )
    return
  }

  // Crece con el tamaño raíz (16 → 19 px en pantallas grandes), como el resto
  const escala = parseFloat(getComputedStyle(document.documentElement).fontSize) / 16 || 1
  const total = 14
  for (let i = 0; i < total; i++) {
    const p = document.createElement("span")
    const esEsquina = i % 3 === 0
    const tam = Math.round((esEsquina ? 9 : 5 + (i % 3)) * escala)
    const color = COLORES[i % COLORES.length]
    Object.assign(p.style, {
      position: "absolute",
      left: `${cx}px`,
      top: `${cy}px`,
      width: `${tam}px`,
      height: `${tam}px`,
      ...(esEsquina
        ? {
            borderTop: `2.5px solid ${color}`,
            borderLeft: `2.5px solid ${color}`,
            borderTopLeftRadius: "3px",
          }
        : { background: color, borderRadius: i % 2 ? "2px" : "9999px" }),
    })
    lienzo.appendChild(p)

    const angulo = (i / total) * Math.PI * 2 + (Math.random() - 0.5) * 0.5
    const distancia = (42 + Math.random() * 38) * escala
    let dx = Math.cos(angulo) * distancia
    let dy = Math.sin(angulo) * distancia - 10
    // Un aviso pegado al borde (en móvil, abajo a la izquierda) mandaba media
    // celebración fuera de la pantalla: la pieza que se saldría rebota hacia dentro.
    const borde = 8
    const finX = cx + dx * 1.15
    const finY = cy + dy * 1.15 + 14
    if (finX < borde || finX > window.innerWidth - borde) dx = -dx
    if (finY < borde || finY > window.innerHeight - borde) dy = -dy - 14
    const giro = (Math.random() - 0.5) * 360
    // Curva por tramo, como en `cropSnap`: con la curva global las piezas se
    // abrían en 60 ms y a los 240 ms ya iban por media opacidad (un parpadeo).
    // Así estallan rápido, se ven enteras casi medio segundo y caen fundiéndose.
    animarYBorrar(
      p,
      [
        {
          transform: "translate(-50%, -50%) scale(0.4) rotate(0deg)",
          opacity: 1,
          easing: "cubic-bezier(0.2, 0.8, 0.3, 1)",
        },
        {
          transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1) rotate(${giro}deg)`,
          opacity: 1,
          offset: 0.55,
          easing: "ease-in",
        },
        {
          transform: `translate(calc(-50% + ${dx * 1.15}px), calc(-50% + ${dy * 1.15 + 14}px)) scale(0.8) rotate(${giro * 1.2}deg)`,
          opacity: 0,
        },
      ],
      { duration: 700 + Math.random() * 200, easing: "linear" }
    )
  }
}

/**
 * Sacudida corta de «no». Usa la propiedad `translate`, que se suma a los
 * `transform` que ya tenga el elemento (los toasts se apilan con transform).
 * Con «reducir movimiento» no se sacude, pero tampoco se queda quieto: un
 * anillo rojo aparece y se va en su sitio. Reducir no es quitar la respuesta.
 */
export function shake(target: Element | null | undefined) {
  if (!target) return
  try {
    if (prefiereMenosMovimiento()) {
      const anillo = "0 0 0 3px color-mix(in oklab, var(--destructive) 70%, transparent)"
      const sinAnillo = "0 0 0 3px transparent"
      ;(target as HTMLElement).animate(
        [
          { boxShadow: sinAnillo, easing: "ease-out" },
          { boxShadow: anillo, offset: 0.2 },
          { boxShadow: anillo, offset: 0.55, easing: "ease-in" },
          { boxShadow: sinAnillo },
        ],
        { duration: 700, easing: "linear" }
      )
      return
    }
    ;(target as HTMLElement).animate(
      [
        { translate: "0 0" },
        { translate: "-5px 0" },
        { translate: "5px 0" },
        { translate: "-3px 0" },
        { translate: "2px 0" },
        { translate: "0 0" },
      ],
      { duration: 340, easing: "ease-out" }
    )
  } catch {
    // Sin WAAPI no hay sacudida; no pasa nada
  }
}
