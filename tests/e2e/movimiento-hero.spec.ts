import { expect, test, type Page } from "@playwright/test"

import { irA, modoCaptura, modoMovimiento } from "./helpers"

/**
 * Movimiento del hero (Lote 1): coreografía de carga (E1), barrido del cabezal
 * sobre el titular (E2) y las clases `m-nudge` de las acciones (E3).
 *
 * Todo corre en los dos modos: el director revisa con las animaciones de Windows
 * apagadas, que Chrome traduce a `prefers-reduced-motion: reduce`. Con reduce no
 * basta con que nada se desplace (eso lo vigila movimiento.spec.ts): cada efecto
 * tiene que SEGUIR VIÉNDOSE. Por eso cada efecto se congela en un instante
 * intermedio y se mide lo que sustituye al movimiento (fundido, destello o luz).
 *
 * Las animaciones de carga pueden haber terminado cuando la página hidrata:
 * `relanzarHero` las reinicia todas y las deja en pausa en su primer instante,
 * y `muestra` lleva cada una al momento que se quiere medir.
 */

const MODOS = ["no-preference", "reduce"] as const

type Animacion = {
  marca: string
  nombre: string
  pseudo: string | null
  retardo: number
  duracion: number
  iteraciones: number
  fin: number
}

type Muestra = {
  opacidad: number
  translate: string
  fondo: string
  posicionFondo: string
}

/** Reinicia las animaciones de carga del hero y las deja en pausa. */
const relanzarHero = (page: Page) =>
  page.evaluate(() => {
    const seccion = document.querySelector("h1")!.closest("section")!
    const flush = () => void document.body.offsetHeight

    // Animaciones propias del elemento: fuera y de vuelta
    const propias = Array.from(
      seccion.querySelectorAll<HTMLElement>(".m-load, .m-claim-sweep, .animate-crop-in")
    )
    for (const el of propias) el.style.animationName = "none"
    // La del pseudo del cabezal: quitar y poner la clase recrea el ::before
    const barridos = Array.from(seccion.querySelectorAll<HTMLElement>(".m-sweep"))
    for (const el of barridos) el.classList.remove("m-sweep")
    flush()

    for (const el of propias) el.style.animationName = ""
    for (const el of barridos) el.classList.add("m-sweep")
    flush()

    for (const a of seccion.getAnimations({ subtree: true })) {
      if (a instanceof CSSAnimation) a.pause()
    }
  })

/** Animaciones CSS del hero, con el elemento identificado por su clase de movimiento. */
const animacionesHero = (page: Page) =>
  page.evaluate(() => {
    const seccion = document.querySelector("h1")!.closest("section")!
    const marcas = ["m-load-glow", "m-claim-sweep", "m-sweep", "animate-crop-in"]
    const marcaDe = (el: Element) => {
      if (el.matches('[data-slot="badge"].m-load')) return "badge"
      if (el.matches(".m-load-rise")) return "acciones"
      return (
        marcas.find((m) => el.classList.contains(m)) ??
        `${el.tagName.toLowerCase()}.${el.getAttribute("class") ?? ""}`
      )
    }
    return seccion
      .getAnimations({ subtree: true })
      .filter((a): a is CSSAnimation => a instanceof CSSAnimation)
      .map((a): Animacion => {
        const efecto = a.effect as KeyframeEffect
        const t = efecto.getComputedTiming()
        return {
          marca: marcaDe(efecto.target!),
          nombre: a.animationName,
          pseudo: efecto.pseudoElement,
          retardo: Math.round(Number(t.delay)),
          duracion: Math.round(Number(t.duration)),
          iteraciones: Number(t.iterations),
          fin: Math.round(Number(t.endTime)),
        }
      })
  })

/**
 * Lleva una animación a un instante y mide su objetivo. `momento`: ms desde el
 * inicio (retardo incluido) o porcentaje de la primera iteración tras el retardo.
 */
const muestra = (
  page: Page,
  criterio: {
    selector: string
    nombre: string
    momento: number | `${number}%`
    pseudo?: "::before" | "::after"
    indice?: number
  }
) =>
  page.evaluate(({ selector, nombre, momento, pseudo, indice }) => {
    const el = document.querySelectorAll(selector)[indice ?? 0]
    if (!el) throw new Error(`muestra: no existe ${selector}`)
    const animacion = el.getAnimations({ subtree: true }).find((a) => {
      const efecto = a.effect as KeyframeEffect
      return (
        a instanceof CSSAnimation &&
        a.animationName === nombre &&
        efecto.target === el &&
        (efecto.pseudoElement ?? null) === (pseudo ?? null)
      )
    })
    if (!animacion) return null
    const t = animacion.effect!.getComputedTiming()
    animacion.pause()
    animacion.currentTime =
      typeof momento === "number"
        ? momento
        : Number(t.delay) + (Number(t.duration) * parseFloat(momento)) / 100
    const cs = getComputedStyle(el, pseudo ?? null)
    return {
      opacidad: Number(cs.opacity),
      translate: cs.translate,
      fondo: cs.backgroundImage,
      posicionFondo: cs.backgroundPosition,
    } satisfies Muestra
  }, criterio)

/** `translate` sin efecto: "none" o todos sus valores neutros. */
const sinDesplazar = (valor: string) =>
  valor === "none" || valor.split(/\s+/).every((v) => parseFloat(v) === 0)
/** Componente vertical de un `translate` calculado («0px 3.2px»). */
const desplazamientoY = (valor: string) => parseFloat(valor.split(/\s+/)[1] ?? "0")
/**
 * Porcentaje horizontal de un `background-position` calculado. El optimizador
 * escribe el reposo como `0 0` (se calcula «0px 0px») y a medio camino puede
 * salir «calc(50% + 0px) 0px»: se lee el primer porcentaje, o 0 si no hay.
 */
const posicionX = (valor: string) => {
  const porcentaje = valor.match(/(-?[\d.]+)%/)
  return porcentaje ? parseFloat(porcentaje[1]) : parseFloat(valor) || 0
}

const resumen = (animaciones: Animacion[], marca: string) =>
  animaciones
    .filter((a) => a.marca === marca)
    .sort((a, b) => a.retardo - b.retardo)
    .map((a) => [a.nombre, a.retardo, a.duracion, a.iteraciones])

for (const modo of MODOS) {
  const reduce = modo === "reduce"

  test.describe(`hero · movimiento (reduced-motion: ${modo})`, () => {
    test.beforeEach(async ({ page }) => {
      await modoMovimiento(page, modo)
    })

    test("E1 · al cargar entran el badge, las acciones, el claim y el halo; el h1 y la descripción no se animan", async ({
      page,
    }) => {
      await irA(page, "/")
      await relanzarHero(page)
      const animaciones = await animacionesHero(page)

      expect(resumen(animaciones, "badge")).toEqual([["rise-in", 100, 500, 1]])
      expect(resumen(animaciones, "acciones")).toEqual([["rise-in", 300, 500, 1]])
      expect(resumen(animaciones, "m-claim-sweep")).toEqual([
        ["fade-soft", 800, 400, 1],
        ["claim-sweep", 900, 900, 1],
      ])
      expect(resumen(animaciones, "m-load-glow")).toEqual([["glow-in", 0, 1600, 1]])
      expect(
        animaciones
          .filter((a) => a.marca === "animate-crop-in")
          .map((a) => a.retardo)
          .sort((a, b) => a - b)
      ).toEqual([450, 550, 650, 750])

      // Todo lo de carga termina en menos de 2 s (AGENTS.md, regla 5)
      expect(Math.max(...animaciones.map((a) => a.fin))).toBeLessThan(2000)

      // Ni el h1 ni la descripción (candidatos a LCP) llevan animación
      const quietos = await page.evaluate(() => {
        const h1 = document.querySelector("h1")!
        const descripcion = document.querySelector("div:has(> h1) + p")!
        return [h1, descripcion].map((el) => el.getAnimations({ subtree: true }).length)
      })
      expect(quietos).toEqual([0, 0])

      // El badge se ve entrar en los dos modos; con reduce, sin subir
      const badge = await muestra(page, {
        selector: '[data-slot="badge"].m-load',
        nombre: "rise-in",
        momento: "30%",
      })
      expect(badge).not.toBeNull()
      expect(badge!.opacidad).toBeGreaterThan(0)
      expect(badge!.opacidad).toBeLessThan(1)
      if (reduce) expect(sinDesplazar(badge!.translate), badge!.translate).toBe(true)
      else expect(desplazamientoY(badge!.translate)).toBeGreaterThan(0)

      const acciones = await muestra(page, {
        selector: '.m-load-rise:not([data-slot="badge"])',
        nombre: "rise-in",
        momento: "30%",
      })
      expect(acciones!.opacidad).toBeGreaterThan(0)
      expect(acciones!.opacidad).toBeLessThan(1)
      if (reduce) expect(sinDesplazar(acciones!.translate)).toBe(true)
      else expect(desplazamientoY(acciones!.translate)).toBeGreaterThan(0)

      // El claim funde y el brillo lo recorre igual en los dos modos (es luz)
      const claimEntra = await muestra(page, {
        selector: ".m-claim-sweep",
        nombre: "fade-soft",
        momento: "50%",
      })
      expect(claimEntra!.opacidad).toBeGreaterThan(0)
      expect(claimEntra!.opacidad).toBeLessThan(1)
      const brillo = await muestra(page, {
        selector: ".m-claim-sweep",
        nombre: "claim-sweep",
        momento: "50%",
      })
      expect(brillo!.fondo).toContain("linear-gradient")
      const x = posicionX(brillo!.posicionFondo)
      expect(x).toBeGreaterThan(10)
      expect(x).toBeLessThan(90)

      // El halo parte de 0,55 en los dos modos
      const halo = await muestra(page, {
        selector: ".m-load-glow",
        nombre: "glow-in",
        momento: 0,
      })
      expect(halo!.opacidad).toBeCloseTo(0.55, 2)
    })

    test(`E2 · el cabezal ${reduce ? "destella en su sitio" : "barre el titular"} y termina antes de 2 s`, async ({
      page,
    }) => {
      await irA(page, "/")
      await relanzarHero(page)
      const barrido = (await animacionesHero(page)).filter((a) => a.marca === "m-sweep")

      expect(barrido.map((a) => [a.nombre, a.pseudo, a.retardo, a.duracion])).toEqual([
        reduce
          ? ["flash-soft", "::before", 1200, 560]
          : ["hero-sweep", "::before", 1200, 760],
      ])
      expect(barrido[0].fin).toBeLessThan(2000)

      if (reduce) {
        // Sin viajar, el destello ilumina la caja entera: tiene que verse
        const pico = await muestra(page, {
          selector: ".m-sweep",
          pseudo: "::before",
          nombre: "flash-soft",
          momento: "35%",
        })
        expect(pico!.opacidad).toBeGreaterThan(0.9)
        expect(sinDesplazar(pico!.translate), pico!.translate).toBe(true)
        expect(pico!.fondo).toContain("linear-gradient")
      } else {
        const aMitad = await muestra(page, {
          selector: ".m-sweep",
          pseudo: "::before",
          nombre: "hero-sweep",
          momento: "40%",
        })
        expect(aMitad!.opacidad).toBe(1)
        expect(parseFloat(aMitad!.translate)).toBeLessThan(0)
        const alFinal = await muestra(page, {
          selector: ".m-sweep",
          pseudo: "::before",
          nombre: "hero-sweep",
          momento: "85%",
        })
        expect(sinDesplazar(alFinal!.translate), alFinal!.translate).toBe(true)
      }

      // Fuera de la animación, la capa no se ve
      await page.evaluate(() => {
        for (const a of document
          .querySelector(".m-sweep")!
          .getAnimations({ subtree: true }))
          a.cancel()
      })
      expect(
        await page
          .locator(".m-sweep")
          .evaluate((el) => getComputedStyle(el, "::before").opacity)
      ).toBe("0")
    })

    test("E3 · la flecha y el Play de las acciones llevan m-nudge; se anima la fila, no los botones", async ({
      page,
    }) => {
      await irA(page, "/")
      const acciones = page.locator('.m-load-rise:not([data-slot="badge"])')
      await expect(acciones).toHaveCount(1)
      await expect(acciones.locator("[data-button] svg.m-nudge")).toHaveCount(2)
      await expect(acciones.locator("[data-button].m-load")).toHaveCount(0)
    })

    test("modo captura: el hero se ve terminado sin esperar", async ({ page }) => {
      await modoCaptura(page)
      await irA(page, "/")

      const estado = await page.evaluate(() => {
        const seccion = document.querySelector("h1")!.closest("section")!
        const leer = (selector: string, pseudo?: string) =>
          Array.from(seccion.querySelectorAll(selector)).map(
            (el) => getComputedStyle(el, pseudo ?? null).opacity
          )
        return {
          entradas: leer(".m-load, .m-claim-sweep"),
          barrido: leer(".m-sweep", "::before"),
          posicionBrillo: getComputedStyle(seccion.querySelector(".m-claim-sweep")!)
            .backgroundPosition,
        }
      })
      expect(estado.entradas).toEqual(["1", "1", "1", "1"])
      expect(estado.barrido).toEqual(["0"])
      // En reposo el brillo queda fuera del texto: solo se ve su color
      expect(posicionX(estado.posicionBrillo)).toBe(0)
    })
  })
}

for (const ruta of ["/", "/en", "/pt"]) {
  test(`hero en ${ruta}: el barrido cubre el titular y el brillo mide lo que el claim`, async ({
    page,
  }) => {
    await irA(page, ruta)
    const geometria = await page.evaluate(() => {
      const capa = document.querySelector<HTMLElement>(".m-sweep")!
      const caja = capa.parentElement!.getBoundingClientRect()
      const r = capa.getBoundingClientRect()
      const h1 = capa.parentElement!.querySelector("h1")!.getBoundingClientRect()
      const brillo = document.querySelector<HTMLElement>(".m-claim-sweep")!
      const bloque = brillo.parentElement!.getBoundingClientRect()
      const lineas = Array.from(brillo.getClientRects())
      return {
        cubreLaCaja:
          Math.abs(r.left - caja.left) < 1 &&
          Math.abs(r.right - caja.right) < 1 &&
          Math.abs(r.top - caja.top) < 1 &&
          Math.abs(r.bottom - caja.bottom) < 1,
        contieneH1: h1.left >= r.left - 1 && h1.right <= r.right + 1,
        recorta: getComputedStyle(capa).overflow,
        enLinea: getComputedStyle(brillo).display,
        texto: brillo.textContent?.trim().length ?? 0,
        dentroDelBloque: lineas.every(
          (l) => l.left >= bloque.left - 1 && l.right <= bloque.right + 1
        ),
        anchoBrillo: getComputedStyle(brillo).backgroundSize,
        sobrante:
          document.documentElement.scrollWidth - document.documentElement.clientWidth,
      }
    })
    expect(geometria).toEqual({
      cubreLaCaja: true,
      contieneH1: true,
      recorta: "hidden",
      enLinea: "inline",
      texto: expect.any(Number),
      dentroDelBloque: true,
      anchoBrillo: "300% 100%",
      sobrante: expect.any(Number),
    })
    expect(geometria.texto).toBeGreaterThan(0)
    expect(geometria.sobrante).toBeLessThanOrEqual(1)
  })
}

test("hero con alto contraste: el claim pinta su color, sin degradado", async ({
  page,
}) => {
  await page.emulateMedia({ forcedColors: "active" })
  await irA(page, "/")
  const claim = await page.locator(".m-claim-sweep").evaluate((el) => {
    const cs = getComputedStyle(el)
    return { fondo: cs.backgroundImage, relleno: cs.webkitTextFillColor }
  })
  expect(claim.fondo).toBe("none")
  expect(claim.relleno).not.toBe("rgba(0, 0, 0, 0)")
})

test.describe("hero sin JavaScript", () => {
  test.use({ javaScriptEnabled: false })

  for (const modo of MODOS) {
    test(`la carga termina visible (reduced-motion: ${modo})`, async ({ page }) => {
      await modoMovimiento(page, modo)
      // Sin JS no hay hidratación que esperar: `irA` se quedaría colgado
      await page.goto("/", { waitUntil: "load" })

      const hero = page.locator("section").filter({ has: page.locator("h1") })
      // CSS puro: corre sin JS y termina en menos de 2 s en su estado natural
      for (const el of await hero.locator(".m-load, .m-claim-sweep").all()) {
        await expect(el).toHaveCSS("opacity", "1")
      }
      await expect(hero.locator(".m-sweep")).toHaveCount(1)

      await expect(hero.locator(".rubius-product-shell")).toHaveCount(1)
    })
  }
})
