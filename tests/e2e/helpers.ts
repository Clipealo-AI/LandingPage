import { type Page } from "@playwright/test"

/**
 * Espera a que React haya hidratado.
 *
 * Playwright espera a que un elemento sea visible y clicable, pero no a que
 * tenga manejadores: entre el HTML del servidor y la hidratación hay una
 * ventana en la que los clics y los `setInputFiles` se pierden. En el navegador
 * completo dura milisegundos; en `headless-shell`, que no pinta frames, lo
 * suficiente para que los tests fallen de forma intermitente.
 */
async function esperarHidratacion(page: Page) {
  await page.waitForSelector("html[data-hydrated='true']", { state: "attached" })
}

/** Navega y espera a que la página responda de verdad. */
export async function irA(page: Page, ruta: string) {
  const respuesta = await page.goto(ruta, { waitUntil: "load" })
  await esperarHidratacion(page)
  return respuesta
}

/**
 * Modo captura: con `html[data-capture]` todas las animaciones terminan en 1 ms,
 * no hay transiciones y las apariciones se ven (app/motion/base.css). Llamar
 * ANTES de navegar: se aplica desde el primer fotograma de cada documento. Si la
 * página ya está cargada, se aplica también a la actual.
 */
export async function modoCaptura(page: Page) {
  await page.addInitScript(() => {
    const marcar = () => document.documentElement?.setAttribute("data-capture", "")
    if (document.documentElement) return marcar()
    new MutationObserver((_, observador) => {
      if (!document.documentElement) return
      marcar()
      observador.disconnect()
    }).observe(document, { childList: true })
  })
  if (page.url() !== "about:blank") {
    await page.evaluate(() => document.documentElement.setAttribute("data-capture", ""))
  }
}

/**
 * Congela las animaciones CSS y WAAPI (también las de los pseudo-elementos) en un
 * instante: `ms` desde su inicio (retardo incluido), o un porcentaje de la parte
 * activa contado tras el retardo (`"30%"`). Con `selector`, solo las de ese
 * subárbol. Devuelve cuántas ha congelado.
 */
export async function congelarAnimaciones(
  page: Page,
  momento: number | `${number}%`,
  selector?: string
) {
  return page.evaluate(
    ({ momento, selector }) => {
      const raiz = selector ? document.querySelector(selector) : null
      if (selector && !raiz) throw new Error(`congelarAnimaciones: no existe ${selector}`)
      const animaciones = raiz
        ? raiz.getAnimations({ subtree: true })
        : document.getAnimations()
      for (const a of animaciones) {
        a.pause()
        if (typeof momento === "number") {
          a.currentTime = momento
          continue
        }
        const t = a.effect?.getComputedTiming()
        const retardo = Number(t?.delay ?? 0)
        const activa = Number(t?.activeDuration ?? 0)
        const vuelta = Number(t?.duration ?? 0)
        const tramo = Number.isFinite(activa) ? activa : vuelta
        a.currentTime = retardo + (tramo * parseFloat(momento)) / 100
      }
      return animaciones.length
    },
    { momento, selector }
  )
}

/**
 * Pone todos los grupos de movimiento en «play» desde el principio, también los
 * que ya se veían al cargar («static») o ya terminaron, sin la espera de
 * `data-motion-after`. Para capturar fotogramas intermedios junto con
 * `congelarAnimaciones`. Devuelve cuántos grupos hay.
 */
export async function forzarGrupos(page: Page) {
  return page.evaluate(() => {
    const grupos = Array.from(
      document.querySelectorAll<HTMLElement>("[data-motion-group]")
    )
    // Pasar por «static» y forzar el estilo quita las animaciones: al volver a
    // «play» empiezan de cero aunque ya hubieran terminado
    for (const grupo of grupos) {
      grupo.style.removeProperty("--m-wait")
      grupo.dataset.motionState = "static"
    }
    void document.body.offsetHeight
    for (const grupo of grupos) grupo.dataset.motionState = "play"
    return grupos.length
  })
}

/**
 * Modo de movimiento de la página.
 *
 * Desde el 15 sep 2026 el movimiento completo es el de por defecto para todo el
 * mundo: lo que manda es la preferencia guardada (Ajustes › Perfil), no la del
 * sistema. Este helper fija las dos cosas —la media query del navegador y la
 * preferencia— para que un test pueda comprobar cualquiera de los dos modos, y
 * lo aplica también a la página ya cargada.
 */
export async function modoMovimiento(page: Page, modo: "reduce" | "no-preference") {
  const guardado = modo === "reduce" ? "reducido" : "completo"
  await page.emulateMedia({ reducedMotion: modo })
  await page.addInitScript((valor) => {
    try {
      window.localStorage.setItem("clipealo-movimiento", valor)
    } catch {
      // Navegador sin almacenamiento: manda el atributo que pone el script de arranque
    }
  }, guardado)
  await page
    .evaluate((valor) => {
      document.documentElement.dataset.motion = valor === "reducido" ? "reduced" : "full"
      try {
        window.localStorage.setItem("clipealo-movimiento", valor)
      } catch {
        // idem
      }
    }, guardado)
    .catch(() => {
      // Aún no hay documento (se llamó antes del primer goto): basta con initScript
    })
}
