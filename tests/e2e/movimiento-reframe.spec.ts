import { expect, test, type Page } from "@playwright/test"

import { forzarGrupos, irA, modoMovimiento } from "./helpers"

/**
 * Lote 2 del movimiento de la landing: Comunidad (E6) y Reframe (E7).
 *
 * Todo corre en los dos modos, porque el director revisa con «reducir
 * movimiento» (Windows con las animaciones apagadas): con reduce cada efecto
 * tiene que SEGUIR VIÉNDOSE, no desaparecer.
 *
 * - Reframe sin preferencia: el marco se cierra de forma continua con el scroll.
 * - Reframe con reduce: la misma historia en cuatro planos con la proporción de
 *   cada formato (16:9, 1:1, 4:5 y 9:16), con un fundido del marco en cada corte
 *   y los rótulos que cambian.
 * - En los dos: el marco se recorta con `clip-path` (no suma CLS) y el rótulo
 *   final no se corta en móvil. Sin JS se ve terminado.
 * - Comunidad: la cifra recibe la marca de recorte una vez; con reduce aparece y
 *   se va en su sitio, sin escalar.
 */

const MODOS = ["no-preference", "reduce"] as const
const RUTAS = ["/", "/en", "/pt"] as const
const RECORTE_PLANOS = 3 // PLANOS_REFRAME - 1

type Medida = {
  /** Ancho de la caja del marco, que no cambia. */
  caja: number
  /** Alto de la caja del marco. */
  alto: number
  izquierda: number
  derecha: number
  /** Ancho que se ve: el recorte es `clip-path`, así que se mide con hit-testing. */
  visible: number
  rem: number
}

/** Mide lo que se ve de un elemento recortado con `clip-path`, en su línea central. */
const medirVisible = (page: Page, selector: string) =>
  page.locator(`#como-funciona ${selector}`).evaluate((recortado): Medida => {
    const r = recortado.getBoundingClientRect()
    const y = r.top + r.height / 2
    let izquierda = Number.NaN
    let derecha = Number.NaN
    for (let x = Math.floor(r.left); x <= Math.ceil(r.right); x++) {
      const tocado = document.elementFromPoint(x, y)
      if (tocado && recortado.contains(tocado)) {
        if (Number.isNaN(izquierda)) izquierda = x
        derecha = x
      }
    }
    return {
      caja: r.width,
      alto: r.height,
      izquierda,
      derecha,
      visible: Number.isNaN(izquierda) ? 0 : derecha - izquierda + 1,
      rem: parseFloat(getComputedStyle(document.documentElement).fontSize),
    }
  })

const medirMarco = (page: Page) => medirVisible(page, ".reframe-marco")

/** Sin dejar menos de 9 rem de marco visible (app/motion/reframe.css). */
const tope = ({ caja, rem }: Medida) => Math.max(0, caja / 2 - 4.5 * rem)

/**
 * Ancho visible esperado del marco sin preferencia para una geometría `t`
 * (0 = original, 1 = vertical): un tercio de la caja por lado en vertical.
 */
const anchoEsperado = (m: Medida, t: number) =>
  m.caja - 2 * Math.min(0.33 * m.caja * t, tope(m))

/** Proporciones de los cuatro planos de «reducir»: 16:9, 1:1, 4:5 y 9:16. */
const PROPORCIONES = [16 / 9, 1, 4 / 5, 9 / 16] as const

/**
 * Ancho visible esperado de un plano con «reducir»: la proporción de su formato
 * sobre el alto de la caja; donde la caja no da para ella, al menos un 3 % del
 * ancho más de recorte por lado que el plano anterior (app/motion/reframe.css).
 */
const anchoDelPlano = (m: Medida, plano: number) => {
  let recorte = 0
  for (let k = 0; k <= plano; k++) {
    const porProporcion = (m.caja - m.alto * PROPORCIONES[k]) / 2
    recorte =
      k === 0
        ? Math.max(0, porProporcion)
        : Math.max(recorte + 0.03 * m.caja, porProporcion)
  }
  return m.caja - 2 * Math.min(recorte, tope(m))
}

const reduceActivo = (modo: (typeof MODOS)[number]) => modo === "reduce"

/** La selección de la línea de tiempo: del 100 % al 22 % del ancho. */
const seleccionEsperada = ({ caja }: Medida, t: number) => caja * (1 - 0.78 * t)

/** Lleva la sección a un progreso (0-1) y espera al frame del hook y al pintado. */
async function irAProgreso(page: Page, progreso: number) {
  await page.locator("#como-funciona").evaluate(async (seccion, p) => {
    const caja = seccion.getBoundingClientRect()
    const inicio = caja.top + window.scrollY
    window.scrollTo({
      top: inicio + p * (caja.height - window.innerHeight),
      behavior: "instant",
    })
    await new Promise<void>((listo) =>
      requestAnimationFrame(() => requestAnimationFrame(() => listo()))
    )
  }, progreso)
}

type Corte = { fotogramas: string; duracion: unknown }

/** Registra cada `animate()` sobre el marco (los cortes de montaje). */
async function registrarCortes(page: Page) {
  await page.addInitScript(() => {
    const cortes: Corte[] = []
    ;(window as unknown as { __cortesReframe: Corte[] }).__cortesReframe = cortes
    const animar = Element.prototype.animate
    Element.prototype.animate = function (fotogramas, opciones) {
      if (this.classList?.contains("reframe-marco")) {
        cortes.push({
          fotogramas: JSON.stringify(fotogramas),
          duracion: typeof opciones === "number" ? opciones : opciones?.duration,
        })
      }
      return animar.call(this, fotogramas, opciones)
    }
  })
}

const cortes = (page: Page) =>
  page.evaluate(() => (window as unknown as { __cortesReframe: Corte[] }).__cortesReframe)

for (const modo of MODOS) {
  test.describe(`reencuadre (reduced-motion: ${modo})`, () => {
    test.beforeEach(async ({ page }) => {
      await modoMovimiento(page, modo)
    })

    test("el marco pasa de 16:9 a vertical con el scroll y el rótulo final aparece", async ({
      page,
    }) => {
      await irA(page, "/")
      const seccion = page.locator("#como-funciona")

      await irAProgreso(page, 0)
      const inicial = await medirMarco(page)
      // Sin preferencia, la caja entera; con reduce, el plano 16:9
      const anchoInicial = reduceActivo(modo) ? anchoDelPlano(inicial, 0) : inicial.caja
      expect(Math.abs(inicial.visible - anchoInicial)).toBeLessThanOrEqual(3)
      await expect(seccion.locator(".reframe-original")).toHaveCSS("opacity", "1")
      await expect(seccion.locator(".reframe-ready")).toHaveCSS("opacity", "0")

      await irAProgreso(page, 1)
      const final = await medirMarco(page)
      // La caja no cambia de ancho: se recorta lo que se ve
      expect(final.caja).toBeCloseTo(inicial.caja, 0)
      const anchoFinal = reduceActivo(modo)
        ? anchoDelPlano(final, 3)
        : anchoEsperado(final, 1)
      expect(Math.abs(final.visible - anchoFinal)).toBeLessThanOrEqual(3)
      expect(final.visible).toBeLessThan(inicial.visible * 0.6)
      await expect(seccion.getByText("Clip 9:16 listo")).toBeVisible()
      await expect(seccion.locator(".reframe-ready")).toHaveCSS("opacity", "1")
      await expect(seccion.locator(".reframe-original")).toHaveCSS("opacity", "0")
    })

    if (modo === "no-preference") {
      test("sin preferencia sigue al scroll de forma continua, con el alto de siempre", async ({
        page,
      }) => {
        await irA(page, "/")
        const seccion = page.locator("#como-funciona")
        const alto = await seccion.evaluate(
          (el) => el.getBoundingClientRect().height / window.innerHeight
        )
        expect(alto).toBeCloseTo(2.4, 1)

        // Dos puntos del mismo plano de «reducir» miden distinto: no hay saltos
        await irAProgreso(page, 0.3)
        const a = await medirMarco(page)
        await irAProgreso(page, 0.36)
        const b = await medirMarco(page)
        expect(a.visible - b.visible).toBeGreaterThan(20)
        expect(
          Math.abs(a.visible - anchoEsperado(a, (0.3 - 0.12) / 0.6))
        ).toBeLessThanOrEqual(3)
        const seleccion = await medirVisible(page, ".reframe-seleccion")
        expect(
          Math.abs(seleccion.visible - seleccionEsperada(seleccion, (0.36 - 0.12) / 0.6))
        ).toBeLessThanOrEqual(3)
      })
    } else {
      test("con reduce se monta en cuatro planos con la proporción de cada formato: 16:9, 1:1, 4:5 y 9:16", async ({
        page,
      }) => {
        await irA(page, "/")
        const seccion = page.locator("#como-funciona")
        const original = seccion.locator(".reframe-original")
        const listo = seccion.locator(".reframe-ready")

        // Menos recorrido que la versión continua: la sección no parece atascada
        const alto = await seccion.evaluate(
          (el) => el.getBoundingClientRect().height / window.innerHeight
        )
        expect(alto).toBeCloseTo(2, 1)

        // Valores centrales de cada plano (los cortes caen en 0,22 · 0,42 · 0,62)
        const planos = [
          { progreso: 0.08, plano: 0 },
          { progreso: 0.32, plano: 1 },
          { progreso: 0.52, plano: 2 },
          { progreso: 0.85, plano: 3 },
        ]
        const anchos: Medida[] = []
        for (const { progreso, plano } of planos) {
          await irAProgreso(page, progreso)
          await expect(seccion).toHaveCSS("--plano", String(plano))
          const medida = await medirMarco(page)
          expect(
            Math.abs(medida.visible - anchoDelPlano(medida, plano)),
            `plano ${plano}: ${medida.visible} px visibles de ${medida.caja} × ${medida.alto}`
          ).toBeLessThanOrEqual(3)
          anchos.push(medida)
          // La selección de la línea de tiempo también se estrecha a saltos
          const seleccion = await medirVisible(page, ".reframe-seleccion")
          expect(
            Math.abs(
              seleccion.visible - seleccionEsperada(seleccion, plano / RECORTE_PLANOS)
            ),
            `selección en el plano ${plano}: ${seleccion.visible} px de ${seleccion.caja}`
          ).toBeLessThanOrEqual(3)
          // «Tu video…» solo en el original; «Clip 9:16 listo» solo en el último
          await expect(original).toHaveCSS("opacity", plano === 0 ? "1" : "0")
          await expect(listo).toHaveCSS("opacity", plano === 3 ? "1" : "0")
        }

        // Cada corte estrecha el marco: ninguno se queda igual que el anterior
        for (let k = 1; k < anchos.length; k++) {
          expect(
            anchos[k - 1].visible - anchos[k].visible,
            `del plano ${k - 1} al ${k}`
          ).toBeGreaterThan(8)
        }
        // Donde la caja da para ello, cada plano tiene la proporción de su formato
        for (const [k, m] of anchos.entries()) {
          const cabe =
            m.alto * PROPORCIONES[k] <= m.caja && m.alto * PROPORCIONES[k] >= 9 * m.rem
          const deja =
            k === 0 || m.alto * PROPORCIONES[k] <= anchos[k - 1].visible - 0.06 * m.caja
          if (cabe && deja) {
            expect(m.visible / m.alto, `proporción del plano ${k}`).toBeCloseTo(
              PROPORCIONES[k],
              1
            )
          }
        }

        // Dos puntos del mismo plano miden igual: el marco va a saltos
        await irAProgreso(page, 0.26)
        const a = await medirMarco(page)
        await irAProgreso(page, 0.38)
        const b = await medirMarco(page)
        expect(Math.abs(a.visible - b.visible)).toBeLessThanOrEqual(1)
      })
    }

    test(
      modo === "reduce"
        ? "con reduce, cada corte funde el marco (solo opacidad) y montar no es un corte"
        : "sin preferencia no hay fundidos: el marco sigue al scroll",
      async ({ page }) => {
        await registrarCortes(page)
        await irA(page, "/")
        await irAProgreso(page, 0.08)
        expect(await cortes(page)).toEqual([])

        for (const progreso of [0.32, 0.52, 0.85]) await irAProgreso(page, progreso)
        // Volver atrás también es un corte
        await irAProgreso(page, 0.52)

        const registro = await cortes(page)
        if (modo === "no-preference") {
          expect(registro).toEqual([])
          return
        }
        expect(registro).toHaveLength(4)
        for (const corte of registro) {
          expect(JSON.parse(corte.fotogramas)).toEqual([
            { opacity: 0.35 },
            { opacity: 1 },
          ])
          expect(corte.duracion).toBe(300)
        }
      }
    )

    test("recortar el marco no desplaza el layout (CLS del reencuadre)", async ({
      page,
    }) => {
      await page.addInitScript(() => {
        type Desplazamiento = PerformanceEntry & {
          value: number
          hadRecentInput: boolean
          sources?: { node?: Node | null }[]
        }
        const registro = { valor: 0, fuentes: [] as string[] }
        ;(window as unknown as { __clsReframe: typeof registro }).__clsReframe = registro
        new PerformanceObserver((lista) => {
          const seccion = document.getElementById("como-funciona")
          for (const entrada of lista.getEntries() as Desplazamiento[]) {
            if (entrada.hadRecentInput || !seccion) continue
            const propias = (entrada.sources ?? []).filter(
              (s) => s.node && seccion.contains(s.node)
            )
            if (!propias.length) continue
            registro.valor += entrada.value
            for (const s of propias) {
              const el = s.node instanceof Element ? s.node : s.node?.parentElement
              registro.fuentes.push(
                `${entrada.value.toFixed(4)} ${el?.tagName.toLowerCase()}.${el?.getAttribute("class")?.slice(0, 50)}`
              )
            }
          }
        }).observe({ type: "layout-shift", buffered: true })
      })
      await irA(page, "/")

      // Recorre la sección entera en pasos de 120 px, como una rueda
      await page.locator("#como-funciona").evaluate(async (seccion) => {
        const frame = () =>
          new Promise<void>((listo) =>
            requestAnimationFrame(() => requestAnimationFrame(() => listo()))
          )
        const caja = seccion.getBoundingClientRect()
        const inicio = caja.top + window.scrollY
        for (let y = inicio - window.innerHeight; y <= inicio + caja.height; y += 120) {
          window.scrollTo({ top: Math.max(0, y), behavior: "instant" })
          await frame()
        }
        await frame()
      })

      const cls = await page.evaluate(
        () =>
          (window as unknown as { __clsReframe: { valor: number; fuentes: string[] } })
            .__clsReframe
      )
      expect(cls.valor, cls.fuentes.join("\n")).toBeLessThan(0.005)
    })

    for (const ruta of RUTAS) {
      test(`a 390 px el rótulo final no se recorta y cabe en el marco (${ruta})`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: 390, height: 844 })
        await irA(page, ruta)
        await irAProgreso(page, 1)

        const listo = page.locator("#como-funciona .reframe-ready")
        await expect(listo).toHaveCSS("opacity", "1")
        const marco = await medirMarco(page)

        const rotulo = await listo.evaluate((el) => {
          const r = el.getBoundingClientRect()
          const y = r.top + r.height / 2
          const tocaRotulo = (x: number) => {
            const tocado = document.elementFromPoint(x, y)
            return Boolean(tocado && el.contains(tocado))
          }
          return {
            texto: el.textContent,
            izquierda: r.left,
            derecha: r.right,
            // El texto no desborda la píldora…
            sobrante: el.scrollWidth - el.clientWidth,
            // …y nada la recorta por los lados
            bordeIzquierdo: tocaRotulo(r.left + 2),
            bordeDerecho: tocaRotulo(r.right - 2),
            // Dentro de la ventana (lo que desborde la página por otras secciones
            // no es del reencuadre, que recorta con `overflow-hidden`)
            anchoVentana: document.documentElement.clientWidth,
          }
        })

        const detalle = `${rotulo.texto}: ${rotulo.izquierda}-${rotulo.derecha} en un marco visible ${marco.izquierda}-${marco.derecha}`
        expect(rotulo.sobrante, detalle).toBeLessThanOrEqual(0)
        expect(rotulo.bordeIzquierdo, detalle).toBe(true)
        expect(rotulo.bordeDerecho, detalle).toBe(true)
        // Dentro del marco, con margen para las esquinas redondeadas
        expect(rotulo.izquierda - marco.izquierda, detalle).toBeGreaterThanOrEqual(3)
        expect(marco.derecha - rotulo.derecha, detalle).toBeGreaterThanOrEqual(3)
        expect(rotulo.izquierda, detalle).toBeGreaterThanOrEqual(0)
        expect(rotulo.derecha, detalle).toBeLessThanOrEqual(rotulo.anchoVentana)
      })
    }
  })

  test.describe(`comunidad: la cifra encuadrada (reduced-motion: ${modo})`, () => {
    test.beforeEach(async ({ page }) => {
      await modoMovimiento(page, modo)
    })

    test("a 2560 × 1440 espera debajo del hero y se reproduce al entrar en pantalla", async ({
      page,
    }) => {
      test.skip(
        test.info().project.name === "movil",
        "la vista de 2560 px es de escritorio"
      )
      // El hero con su vista previa mide más que 1440 px: la cifra no se ve al cargar
      await page.setViewportSize({ width: 2560, height: 1440 })
      await irA(page, "/")

      const titular = page.locator("#comunidad")
      await expect(titular).toHaveAttribute("data-motion-state", "idle")
      await titular.evaluate((el) =>
        el.scrollIntoView({ block: "center", behavior: "instant" })
      )
      await expect(titular).toHaveAttribute("data-motion-state", "play")
      // Ya pasaron los 1,4 s de las esquinas del hero: no espera nada más
      const espera = await titular.evaluate((el) => el.style.getPropertyValue("--m-wait"))
      expect(parseInt(espera || "0")).toBeLessThanOrEqual(1400)
      const marca = await titular.locator("[data-crop-mark]").evaluate((el) =>
        el
          .getAnimations({ subtree: true })
          .filter((a) => a instanceof CSSAnimation)
          .map((a) => (a as CSSAnimation).animationName)
      )
      expect(marca).toContain("crop-flash")
    })

    test("si ya se ve al cargar, se reproduce después de las esquinas del hero, y se ve", async ({
      page,
    }) => {
      test.skip(
        test.info().project.name === "movil",
        "la vista de 2560 px es de escritorio"
      )
      // Una ventana alta en la que la cifra queda por encima del 88 % al hidratar
      await page.setViewportSize({ width: 2560, height: 2200 })
      await irA(page, "/")

      const titular = page.locator("#comunidad")
      expect(
        await titular.evaluate((el) => el.getBoundingClientRect().top / innerHeight)
      ).toBeLessThan(0.88)
      await expect(titular).toHaveAttribute("data-motion-state", "play")
      // Espera hasta 1,4 s desde la navegación; si hidrató más tarde, 0 ms
      const espera = await titular.evaluate((el) => el.style.getPropertyValue("--m-wait"))
      expect(espera).toMatch(/^\d+ms$/)
      expect(parseInt(espera)).toBeLessThanOrEqual(1400)

      const cifra = titular.locator("[data-crop-mark]")
      await expect(cifra).toHaveCount(1)
      await expect(cifra).toHaveCSS("white-space", "nowrap")

      // Se relanza desde cero para mirar fotogramas sin depender del reloj
      await forzarGrupos(page)
      const fotogramas = await cifra.evaluate((el) => {
        const marca = el
          .getAnimations({ subtree: true })
          .find(
            (a): a is CSSAnimation =>
              a instanceof CSSAnimation &&
              a.animationName === "crop-flash" &&
              (a.effect as KeyframeEffect).pseudoElement === "::after"
          )
        if (!marca) return null
        const tiempo = marca.effect!.getComputedTiming()
        const retardo = Number(tiempo.delay ?? 0)
        const duracion = Number(tiempo.duration)
        marca.pause()
        const en = (fraccion: number) => {
          marca.currentTime = retardo + duracion * fraccion
          const cs = getComputedStyle(el, "::after")
          return { opacidad: Number(cs.opacity), escala: cs.scale }
        }
        return { duracion, inicio: en(0.03), medio: en(0.5), fin: en(0.99) }
      })

      expect(fotogramas, "la cifra no tiene la marca de recorte").not.toBeNull()
      expect(fotogramas!.duracion).toBe(1400)
      // Se sostiene entera a mitad
      expect(fotogramas!.medio.opacidad).toBe(1)
      expect(["none", "1"]).toContain(fotogramas!.medio.escala)
      // Y se va: termina invisible, en su estado natural
      expect(fotogramas!.fin.opacidad).toBeLessThan(0.2)
      // Al entrar ya se ve…
      expect(fotogramas!.inicio.opacidad).toBeGreaterThan(0.15)
      if (modo === "reduce") {
        // …en su sitio, sin escalar
        expect(["none", "1"]).toContain(fotogramas!.inicio.escala)
      } else {
        // …cerrándose desde fuera
        expect(parseFloat(fotogramas!.inicio.escala)).toBeGreaterThan(1.05)
      }
    })
  })
}

for (const ruta of RUTAS) {
  test(`a 320 px la cifra de la comunidad no se parte en dos líneas (${ruta})`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 800 })
    await irA(page, ruta)
    const cifra = page.locator("#comunidad [data-crop-mark]")
    await expect(cifra).toHaveCSS("white-space", "nowrap")
    expect(await cifra.evaluate((el) => el.getClientRects().length)).toBe(1)
    // Sin partirse, la cifra y su titular caben en la ventana. Se mide la cifra y
    // no la página: a 320 px otras secciones ya desbordaban antes del movimiento
    // (un titular largo de Funciones y un botón de Precios).
    const caja = await cifra.evaluate((el) => {
      const r = el.getBoundingClientRect()
      const titular = el.closest("h2")!
      return {
        izquierda: r.left,
        derecha: r.right,
        ventana: document.documentElement.clientWidth,
        titularSobrante: titular.scrollWidth - titular.clientWidth,
      }
    })
    expect(caja.izquierda).toBeGreaterThanOrEqual(0)
    expect(caja.derecha).toBeLessThanOrEqual(caja.ventana)
    expect(caja.titularSobrante).toBeLessThanOrEqual(1)
  })
}

test("un solo gesto de marca de recorte en Comunidad y ninguno en el reencuadre", async ({
  page,
}) => {
  await irA(page, "/")
  const gestos = "[data-crop-mark], .m-crop-corners, [data-crop-corner]"
  await expect(
    page.locator('section[aria-labelledby="comunidad"]').locator(gestos)
  ).toHaveCount(1)
  await expect(page.locator("#como-funciona").locator(gestos)).toHaveCount(0)
})

test.describe("sin JavaScript", () => {
  test.use({ javaScriptEnabled: false })

  for (const modo of MODOS) {
    test(`el reencuadre se ve terminado y la marca no se queda pintada (reduced-motion: ${modo})`, async ({
      page,
    }) => {
      await modoMovimiento(page, modo)
      // Sin JS no hay hidratación que esperar: `irA` se quedaría colgado
      await page.goto("/", { waitUntil: "load" })

      const seccion = page.locator("#como-funciona")
      await expect(seccion).toHaveCSS("--progress", "1")
      await expect(seccion).toHaveCSS("--plano", "3")
      await expect(seccion.locator(".reframe-stage")).toHaveCSS("--t-geo", "1")
      await expect(seccion.locator(".reframe-ready")).toHaveCSS("opacity", "1")
      await expect(seccion.locator(".reframe-original")).toHaveCSS("opacity", "0")

      const titular = page.locator("#comunidad")
      await expect(titular).not.toHaveAttribute("data-motion-state")
      await expect(titular.locator("[data-crop-mark]")).toHaveCSS("opacity", "0", {
        pseudo: "after",
      })
    })
  }
})
