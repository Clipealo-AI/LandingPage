/**
 * Movimiento de la landing: grupos «al entrar en pantalla» y preferencia de
 * movimiento (reexportada de `lib/preferencia-movimiento.ts`, que es lo único
 * que usa `lib/effects.ts`). Sin React; el CSS que lo acompaña está en
 * `app/motion/base.css`.
 *
 * Contrato de los grupos (AGENTS.md, reglas 5 y 8):
 * - Un grupo es un elemento con `data-motion-group`. Los de componentes de
 *   servidor los observa `<MotionObserver />`; los de componentes cliente
 *   llevan `data-motion-group="client"` y usan `useMotionGroup(ref)`.
 * - El estado va en `data-motion-state` («static», «idle», «play»), un
 *   atributo que React no renderiza y por eso no borra al volver a pintar.
 * - Sin estado no hay animación: sin JS, sin `IntersectionObserver` o en una
 *   página sin observador, todo se ve en su estado final.
 * - Lo que ya se veía al hidratar no se oculta para animarlo («static»), salvo
 *   `data-motion-visible="play"`: solo para decorativos que parten invisibles.
 * - Tab nunca cae en un bloque invisible: el grupo que recibe el foco se ve
 *   terminado al instante («static»), aunque esperara o se estuviera animando.
 * - `data-motion-after="N"` espera hasta N ms desde la navegación (escribe
 *   `--m-wait`), para encadenar con la coreografía de carga del hero.
 * - Los grupos no se anidan.
 */

import { CLAVE_MOVIMIENTO } from "@/lib/preferencia-movimiento"

// La preferencia vive aparte para que lib/effects.ts no arrastre los grupos
export {
  CLAVE_MOVIMIENTO,
  EASE_BRAND,
  prefiereMenosMovimiento,
} from "@/lib/preferencia-movimiento"

export type EstadoMovimiento = "static" | "idle" | "play"

/**
 * Los grupos que esperan arrancan cuando su borde superior sube por encima del
 * 88 % del alto de la ventana: la entrada se ve entera y no a ras del borde.
 */
const MARGEN_OBSERVADOR = "0px 0px -12% 0px"

/**
 * Estado con el que arranca un grupo al hidratar.
 * Con algún píxel a la vista, o ya pasado por arriba → «static»: lo que el
 * primer pintado ya enseñaba no se oculta, tampoco en el 12 % inferior de la
 * pantalla (al entrar por un ancla o al restaurar el scroll). Entero por debajo
 * de la ventana → «idle».
 */
export function estadoInicial(
  r: { top: number; bottom: number },
  alto: number
): "static" | "idle" {
  // Ya pasado (bottom ≤ 0) implica top < alto
  return r.top < alto ? "static" : "idle"
}

// Un solo observador para todos los grupos de la página
let observador: IntersectionObserver | null = null
/** Por elemento observado, los grupos que arrancan cuando entra. */
const alEntrar = new Map<Element, Set<() => void>>()

/**
 * Elemento que se observa por un grupo. IntersectionObserver aplica el
 * `clip-path` del propio objetivo: un grupo que se recorta a sí mismo mientras
 * espera (un titular `m-cut` que es su propio grupo, como el de Steps) mide 0 px
 * de intersección y no entraría nunca. En ese caso se observa su padre, que
 * empieza donde empieza el titular. El estado inicial se sigue midiendo con la
 * caja del grupo (`getBoundingClientRect` no aplica el recorte).
 */
function objetivoDe(el: Element) {
  return el.classList.contains("m-cut") && el.parentElement ? el.parentElement : el
}

function observar(el: Element, entrar: () => void) {
  observador ??= new IntersectionObserver(
    (entradas) => {
      for (const entrada of entradas) {
        if (!entrada.isIntersecting) continue
        for (const alguno of [...(alEntrar.get(entrada.target) ?? [])]) alguno()
      }
    },
    { rootMargin: MARGEN_OBSERVADOR }
  )
  const objetivo = objetivoDe(el)
  const grupos = alEntrar.get(objetivo) ?? new Set()
  grupos.add(entrar)
  alEntrar.set(objetivo, grupos)
  observador.observe(objetivo)
}

function dejarDeObservar(el: Element, entrar: () => void) {
  const objetivo = objetivoDe(el)
  const grupos = alEntrar.get(objetivo)
  if (!grupos?.delete(entrar) || grupos.size) return
  alEntrar.delete(objetivo)
  observador?.unobserve(objetivo)
}

const nada = () => {}

/**
 * Observa un grupo y lo pasa a «play» la primera vez que entra en pantalla.
 * Devuelve la limpieza para un efecto.
 *
 * Foco del teclado: si llega a un grupo que espera o que aún se anima, el grupo
 * pasa a «static» y se ve terminado en ese mismo fotograma. Arrancarlo no basta:
 * el control enfocado seguiría a opacidad 0 durante su retardo (el conmutador
 * de Precios, 240 ms más la subida) y su anillo de foco no se vería.
 *
 * Idempotente: un grupo en «static» no se toca; uno en «play» solo vuelve a
 * escuchar el foco, y uno en «idle» se vuelve a observar sin recalcular (el
 * doble efecto de StrictMode limpia y vuelve a llamar).
 *
 * `caja`: la del elemento ya medida. Quien observa muchos grupos a la vez las
 * mide todas antes de llamar, para no alternar lecturas de layout con escrituras
 * de atributos.
 */
export function observeMotionGroup(
  el: HTMLElement,
  onPlay?: (el: HTMLElement) => void,
  caja?: { top: number; bottom: number }
): () => void {
  const estado = el.dataset.motionState
  if (estado === "static") return nada
  if (typeof IntersectionObserver === "undefined") return nada

  let observando = false
  let escuchando = false

  const dejarDeVer = () => {
    if (!observando) return
    observando = false
    dejarDeObservar(el, play)
  }
  const limpiar = () => {
    dejarDeVer()
    if (!escuchando) return
    escuchando = false
    el.removeEventListener("focusin", terminar)
  }

  function play() {
    dejarDeVer()
    const tras = Number(el.dataset.motionAfter)
    if (Number.isFinite(tras) && tras > 0) {
      const espera = Math.max(0, Math.round(tras - performance.now()))
      el.style.setProperty("--m-wait", `${espera}ms`)
    }
    el.dataset.motionState = "play"
    onPlay?.(el)
  }

  /** Sin animación: quitar el estado de «play» o «idle» deja el final a la vista. */
  function terminar() {
    limpiar()
    el.style.removeProperty("--m-wait")
    el.dataset.motionState = "static"
  }

  if (estado !== "idle" && estado !== "play") {
    const r = caja ?? el.getBoundingClientRect()
    if (estadoInicial(r, window.innerHeight) === "idle") {
      el.dataset.motionState = "idle"
    } else if (el.dataset.motionVisible === "play") {
      play()
    } else {
      el.dataset.motionState = "static"
      return nada
    }
  }

  if (el.dataset.motionState === "idle") {
    observar(el, play)
    observando = true
  }
  el.addEventListener("focusin", terminar)
  escuchando = true
  return limpiar
}

/**
 * Script de arranque del modo de movimiento, en línea en
 * `app/[locale]/layout.tsx` para que esté puesto antes del primer pintado.
 * Lee la preferencia guardada (Ajustes › Perfil) y deja `data-motion` en
 * `full` o `reduced`: el movimiento completo es el de por defecto, aunque el
 * sistema pida reducirlo. `?movimiento=completo|reducido` la cambia y la
 * guarda; `?movimiento=sistema` la borra (vuelve a completo). Sin JS no hay
 * atributo y manda la preferencia del sistema, que es lo único disponible.
 */
export const SCRIPT_BANDERA_MOVIMIENTO = `(function(){var d=document.documentElement,k=${JSON.stringify(CLAVE_MOVIMIENTO)},v=null;try{var m=new URLSearchParams(location.search).get("movimiento");if(m==="completo"||m==="reducido"){v=m;try{localStorage.setItem(k,m)}catch(e){}}else if(m==="sistema"){try{localStorage.removeItem(k)}catch(e){}}else{try{v=localStorage.getItem(k)}catch(e){}}}catch(e){}d.dataset.motion=v==="reducido"?"reduced":"full"})();`
