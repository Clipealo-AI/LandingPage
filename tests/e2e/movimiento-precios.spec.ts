import { expect, test, type Locator, type Page } from "@playwright/test"

import { congelarAnimaciones, forzarGrupos, irA, modoMovimiento } from "./helpers"

/**
 * Movimiento de Precios y FAQ (Lote 5; AGENTS.md, reglas 5 a 8):
 * - E5: los titulares de Precios y FAQ se cortan a 12 fps al entrar en pantalla
 *   (con «reducir», se funden en su sitio y sin cuchilla);
 * - E14: cada tarjeta de plan entra al llegar y lleva luz bajo el puntero (E11);
 *   al cambiar de ciclo el precio rueda y, al pasar a anual, el ahorro destella
 *   con un anillo en `primary`;
 * - FAQ: la respuesta se funde al abrir; con «reducir», el panel no crece y se
 *   funde al abrir (`fade-soft`) y al cerrar (`fade-soft-out`).
 *
 * Todo corre en los dos modos, y con «reducir» no basta con que nada se
 * desplace: cada efecto tiene que seguir VIÉNDOSE (el director revisa con las
 * animaciones de Windows apagadas). También fija la decisión sobre /precios, que
 * comparte PlanCards, BillingToggle y Faq: allí no hay entradas (no hay
 * observador), pero los gestos responden igual que en la landing.
 *
 * Las animaciones de un gesto duran 200-700 ms: se capturan en `animationstart`
 * y se pausan para medirlas sin carreras. Las de un grupo en espera ya están en
 * pausa por CSS: solo se mueve su `currentTime` y se devuelve (un `pause()`
 * fijaría su estado y el grupo ya no arrancaría).
 */

const MODOS = ["no-preference", "reduce"] as const

type Medida = {
  nombre: string
  estado: string
  retardo: number
  duracion: number
  opacidad: number
  translate: string
  clipPath: string
  boxShadow: string
  contenido: string
}

type Capturada = { nombre: string; objetivo: string; retardo: number; duracion: number }

type VentanaConCapturas = { __capturadas?: CSSAnimation[] }

const NEUTRO_TRANSLATE = ["none", "0px", "0px 0px"]

/**
 * Mide la animación CSS `nombre` del elemento (o de su `::after`) en una fracción
 * de su parte activa, tras el retardo, y devuelve `currentTime` a donde estaba.
 * Con `fraccion` nula, mide donde está ahora. Sin esa animación, `null`.
 */
function muestrear(
  objetivo: Locator,
  nombre: string,
  fraccion: number | null,
  pseudo: "::after" | null = null
) {
  return objetivo.evaluate(
    (el, { nombre, fraccion, pseudo }): Medida | null => {
      const animacion = el
        .getAnimations({ subtree: true })
        .find(
          (a): a is CSSAnimation =>
            a instanceof CSSAnimation &&
            a.animationName === nombre &&
            (a.effect as KeyframeEffect).target === el &&
            ((a.effect as KeyframeEffect).pseudoElement ?? null) === pseudo
        )
      if (!animacion) return null
      const tiempo = (animacion.effect as KeyframeEffect).getComputedTiming()
      const retardo = Number(tiempo.delay ?? 0)
      const duracion = Number(tiempo.duration)
      const antes = animacion.currentTime
      if (fraccion !== null) animacion.currentTime = retardo + duracion * fraccion
      const cs = getComputedStyle(el, pseudo)
      const medida = {
        nombre: animacion.animationName,
        estado: animacion.playState,
        retardo,
        duracion,
        opacidad: Number(cs.opacity),
        translate: cs.translate,
        clipPath: cs.clipPath,
        boxShadow: cs.boxShadow,
        contenido: cs.content,
      }
      if (antes !== null) animacion.currentTime = antes
      return medida
    },
    { nombre, fraccion, pseudo }
  )
}

/**
 * Desde ahora, cada animación CSS que empiece en un elemento que case con
 * `selector` se pausa al arrancar y se guarda para medirla.
 */
async function capturar(page: Page, selector: string) {
  await page.evaluate((selector) => {
    const w = window as unknown as VentanaConCapturas
    w.__capturadas ??= []
    document.addEventListener(
      "animationstart",
      (evento) => {
        const objetivo = evento.target
        if (!(objetivo instanceof Element) || !objetivo.matches(selector)) return
        const pseudo = evento.pseudoElement || null
        const animacion = objetivo
          .getAnimations({ subtree: true })
          .find(
            (a): a is CSSAnimation =>
              a instanceof CSSAnimation &&
              a.animationName === evento.animationName &&
              (a.effect as KeyframeEffect).target === objetivo &&
              ((a.effect as KeyframeEffect).pseudoElement ?? null) === pseudo
          )
        if (!animacion || w.__capturadas!.includes(animacion)) return
        animacion.pause()
        w.__capturadas!.push(animacion)
      },
      true
    )
  }, selector)
}

/** Lo capturado hasta ahora: nombre, a quién anima («panel», «respuesta» o su clase), retardo y duración. */
const capturadas = (page: Page) =>
  page.evaluate((): Capturada[] =>
    ((window as unknown as VentanaConCapturas).__capturadas ?? []).map((a) => {
      const efecto = a.effect as KeyframeEffect
      const objetivo = efecto.target as Element
      const tiempo = efecto.getComputedTiming()
      return {
        nombre: a.animationName,
        objetivo: objetivo.matches('[data-slot="accordion-content"]')
          ? "panel"
          : objetivo.matches(".m-respuesta")
            ? "respuesta"
            : (objetivo.getAttribute("class") ?? ""),
        retardo: Number(tiempo.delay ?? 0),
        duracion: Number(tiempo.duration),
      }
    })
  )

/** Mide una animación capturada (la última que case) en una fracción de su parte activa. */
const medirCapturada = (page: Page, nombre: string, selector: string, fraccion: number) =>
  page.evaluate(
    ({ nombre, selector, fraccion }): Medida | null => {
      const lista = (window as unknown as VentanaConCapturas).__capturadas ?? []
      const animacion = [...lista]
        .reverse()
        .find(
          (a) =>
            a.animationName === nombre &&
            ((a.effect as KeyframeEffect).target as Element | null)?.matches(selector)
        )
      if (!animacion) return null
      const efecto = animacion.effect as KeyframeEffect
      const tiempo = efecto.getComputedTiming()
      const retardo = Number(tiempo.delay ?? 0)
      const duracion = Number(tiempo.duration)
      animacion.currentTime = retardo + duracion * fraccion
      const cs = getComputedStyle(efecto.target as Element, efecto.pseudoElement)
      return {
        nombre,
        estado: animacion.playState,
        retardo,
        duracion,
        opacidad: Number(cs.opacity),
        translate: cs.translate,
        clipPath: cs.clipPath,
        boxShadow: cs.boxShadow,
        contenido: cs.content,
      }
    },
    { nombre, selector, fraccion }
  )

/** Termina lo capturado (dispara `animationend`: Radix desmonta al cerrar) y vacía la lista. */
const soltarCapturadas = (page: Page) =>
  page.evaluate(() => {
    const w = window as unknown as VentanaConCapturas
    for (const a of w.__capturadas ?? []) a.finish()
    w.__capturadas = []
  })

const centrar = (objetivo: Locator) =>
  objetivo.evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }))

const esperarFrames = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<void>((listo) =>
        requestAnimationFrame(() => requestAnimationFrame(() => listo()))
      )
  )

/** Espera a que acaben las animaciones finitas que corren en el subárbol (máximo 6 s). */
const terminar = (raiz: Locator) =>
  raiz.evaluate(async (el) => {
    const finitas = el
      .getAnimations({ subtree: true })
      .filter(
        (a) =>
          a.playState === "running" &&
          Number.isFinite(Number(a.effect?.getComputedTiming().endTime))
      )
    await Promise.race([
      Promise.all(finitas.map((a) => a.finished.catch(() => undefined))),
      new Promise((listo) => setTimeout(listo, 6000)),
    ])
  })

const desbordamiento = (page: Page) =>
  page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  )

/** Números de un color calculado («oklab(0.5 -0.1 -0.2 / 0.5)» → [0.5, -0.1, -0.2, 0.5]). */
const numeros = (color: string) =>
  (color.match(/-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?/g) ?? []).map(Number)

const distancia = (a: string, b: string) => {
  const [na, nb] = [numeros(a), numeros(b)]
  if (!na.length || na.length !== nb.length) return Number.POSITIVE_INFINITY
  return Math.max(...na.map((v, i) => Math.abs(v - nb[i])))
}

/** Grupo del encabezado de Precios y columna del titular del FAQ. */
const grupoPrecios = (page: Page) =>
  page.locator("#precios [data-motion-group]").filter({ has: page.locator("h2") })
const seccionFaq = (page: Page) =>
  page.locator("main section").filter({ has: page.locator('[data-slot="accordion"]') })

for (const modo of MODOS) {
  const reduce = modo === "reduce"

  test.describe(`precios y FAQ (reduced-motion: ${modo})`, () => {
    test.beforeEach(async ({ page }) => {
      await modoMovimiento(page, modo)
    })

    test("E5 · los titulares de Precios y FAQ esperan ocultos, se cortan al entrar y, con reduce, se funden en su sitio", async ({
      page,
    }) => {
      await irA(page, "/")

      // Solo un gesto de marca de recorte por sección: aquí ninguno
      await expect(
        page.locator("#precios :is([data-crop-mark], .m-crop-corners)")
      ).toHaveCount(0)
      await expect(
        seccionFaq(page).locator(":is([data-crop-mark], .m-crop-corners)")
      ).toHaveCount(0)

      const casos = [
        // Antetítulo 0, titular 80 ms, entradilla 160 ms y conmutador 240 ms
        { grupo: grupoPrecios(page), retardoTitular: 80, retardosSubida: [0, 160, 240] },
        // Titular 0 y contacto 80 ms
        {
          grupo: seccionFaq(page).locator("[data-motion-group]"),
          retardoTitular: 0,
          retardosSubida: [80],
        },
      ]

      for (const { grupo, retardoTitular, retardosSubida } of casos) {
        await expect(grupo).toHaveCount(1)
        await expect(grupo).toHaveAttribute("data-motion-state", "idle")
        const titular = grupo.locator("h2")
        const nombre = reduce ? "fade-soft" : "cut-in"

        // Esperando: la animación está creada, en pausa y oculta el titular
        const quieto = await muestrear(titular, nombre, null)
        expect(quieto, `${nombre} en el h2`).not.toBeNull()
        expect(quieto!.estado).toBe("paused")
        expect(quieto!.retardo).toBe(retardoTitular)
        if (reduce) expect(quieto!.opacidad).toBe(0)
        else expect(quieto!.clipPath).not.toBe("none")

        // A un 30 %: sin preferencia, medio cortado y con cuchilla; con reduce,
        // medio fundido, sin cuchilla y sin desplazamiento
        const aMitad = await muestrear(titular, nombre, 0.3)
        const cuchilla = await muestrear(titular, "cut-blade", 0.3, "::after")
        if (reduce) {
          // A cortes, lo que dura el corte: cuatro escalones de opacidad en 720 ms
          expect(aMitad!.duracion).toBe(720)
          expect(aMitad!.opacidad).toBeGreaterThan(0.05)
          expect(aMitad!.opacidad).toBeLessThan(0.95)
          expect(NEUTRO_TRANSLATE).toContain(aMitad!.translate)
          expect(cuchilla).toBeNull()
          expect(
            await titular.evaluate((el) => getComputedStyle(el, "::after").content)
          ).toBe("none")
        } else {
          expect(aMitad!.duracion).toBe(720)
          expect(aMitad!.clipPath).toContain("inset")
          expect(aMitad!.clipPath).not.toBe(quieto!.clipPath)
          expect(cuchilla, "cut-blade en el ::after del h2").not.toBeNull()
          expect(cuchilla!.opacidad).toBe(1)
        }

        // El resto del grupo sube (con reduce, solo se funde), escalonado
        const subidas = grupo.locator(".m-rise")
        await expect(subidas).toHaveCount(retardosSubida.length)
        for (let i = 0; i < retardosSubida.length; i++) {
          const subida = await muestrear(subidas.nth(i), "rise-in", 0.3)
          expect(subida, `rise-in en la subida ${i}`).not.toBeNull()
          expect(subida!.retardo).toBe(retardosSubida[i])
          expect(subida!.opacidad).toBeGreaterThan(0.05)
          expect(subida!.opacidad).toBeLessThan(0.95)
          if (reduce) expect(NEUTRO_TRANSLATE).toContain(subida!.translate)
          else expect(NEUTRO_TRANSLATE).not.toContain(subida!.translate)
        }

        // Al entrar en pantalla corre una vez y termina en su estado natural
        await centrar(grupo)
        await expect(grupo).toHaveAttribute("data-motion-state", "play")
        await terminar(grupo)
        await expect(titular).toHaveCSS("clip-path", "none")
        await expect(titular).toHaveCSS("opacity", "1")
        for (const subida of await subidas.all()) {
          await expect(subida).toHaveCSS("opacity", "1")
          expect(NEUTRO_TRANSLATE).toContain(
            await subida.evaluate((el) => getComputedStyle(el).translate)
          )
        }
      }
    })

    test("E5 · mientras espera, un titular centrado no asoma ni un trozo de letra (Precios y CTA, es/en/pt)", async ({
      page,
    }) => {
      // Con reduce el titular espera a opacidad 0 y sin recorte: nada que asome
      test.skip(reduce, "sin recorte con reduce")
      for (const idioma of ["/", "/en", "/pt"] as const) {
        await irA(page, idioma)
        for (const selector of ["#precios h2", "#subir h2"]) {
          const trozos = await page.locator(selector).evaluate(async (h2) => {
            const grupo = h2.closest<HTMLElement>("[data-motion-group]")!
            h2.scrollIntoView({ block: "center", behavior: "instant" })
            // El primer fotograma del corte, en pausa, como en «idle»
            grupo.dataset.motionState = "static"
            void grupo.offsetHeight
            grupo.dataset.motionState = "idle"
            await new Promise((listo) =>
              requestAnimationFrame(() => requestAnimationFrame(listo))
            )
            const rango = document.createRange()
            rango.selectNodeContents(h2)
            const vistos: string[] = []
            for (const linea of Array.from(rango.getClientRects())) {
              const y = linea.top + linea.height / 2
              for (let x = Math.ceil(linea.left) + 1; x < linea.right - 1; x += 3) {
                const tocado = document.elementFromPoint(x, y)
                if (tocado && h2.contains(tocado)) {
                  vistos.push(`${Math.round(x - linea.left)} px dentro de una línea`)
                  break
                }
              }
            }
            return vistos
          })
          expect(trozos, `${idioma} ${selector}`).toEqual([])
        }
      }
    })

    test("E14 · cada tarjeta de plan espera oculta, entra al llegar (escalonada en fila) y lleva luz bajo el puntero", async ({
      page,
    }) => {
      await irA(page, "/")
      const tarjetas = page.locator("#precios [data-light]")
      await expect(tarjetas).toHaveCount(4)
      const enFila = (page.viewportSize()?.width ?? 0) >= 1024
      const retardos = enFila ? [0, 80, 160, 240] : [0, 0, 0, 0]

      for (let i = 0; i < 4; i++) {
        const tarjeta = tarjetas.nth(i)
        await expect(tarjeta).toHaveAttribute("data-light", "claro")
        // Cada tarjeta es su grupo: en una columna, cada una entra al llegar
        await expect(tarjeta).toHaveAttribute("data-motion-group", "client")
        await expect(tarjeta).toHaveAttribute("data-motion-state", "idle")

        const quieta = await muestrear(tarjeta, "rise-in", null)
        expect(quieta, `rise-in en la tarjeta ${i}`).not.toBeNull()
        expect(quieta!.estado).toBe("paused")
        expect(quieta!.retardo).toBe(retardos[i])
        expect(quieta!.opacidad).toBe(0)

        const aMitad = await muestrear(tarjeta, "rise-in", 0.3)
        expect(aMitad!.opacidad).toBeGreaterThan(0.05)
        expect(aMitad!.opacidad).toBeLessThan(0.95)
        if (reduce) expect(NEUTRO_TRANSLATE).toContain(aMitad!.translate)
        else expect(NEUTRO_TRANSLATE).not.toContain(aMitad!.translate)
      }

      for (let i = 0; i < 4; i++) {
        await centrar(tarjetas.nth(i))
        await expect(tarjetas.nth(i)).toHaveAttribute("data-motion-state", "play")
      }
      await terminar(page.locator("#precios"))
      for (const tarjeta of await tarjetas.all()) {
        await expect(tarjeta).toHaveCSS("opacity", "1")
        expect(NEUTRO_TRANSLATE).toContain(
          await tarjeta.evaluate((el) => getComputedStyle(el).translate)
        )
      }

      // Luz (E11): con ratón, igual con reduce porque es luz. En táctil no hay puntero.
      if (test.info().project.name !== "movil") {
        const destacada = tarjetas.nth(1)
        await destacada.hover()
        await expect(destacada).toHaveAttribute("data-lit", "")
        const luz = await destacada.evaluate((el) => ({
          x: (el as HTMLElement).style.getPropertyValue("--mx"),
          fondo: getComputedStyle(el).backgroundImage,
        }))
        expect(luz.x).toMatch(/px$/)
        expect(luz.fondo).toContain("radial-gradient")
      }
    })

    test("E14 · el primer render no rueda y, al cambiar de ciclo, el precio se remonta y rueda (con reduce, se funde)", async ({
      page,
      request,
    }) => {
      // El HTML del servidor no trae ninguna clase de gesto ni estado de grupo
      const html = await (await request.get("/")).text()
      expect(html).not.toMatch(/class="[^"]*\bm-(price|flash)\b/)
      expect(html).not.toMatch(/<[^>]+\sdata-motion-state=/)

      await irA(page, "/")
      const seccion = page.locator("#precios")
      await seccion.evaluate((el) =>
        el.scrollIntoView({ block: "start", behavior: "instant" })
      )
      await esperarFrames(page)
      await terminar(seccion)
      await expect(seccion.locator(".m-price")).toHaveCount(0)
      await expect(seccion.locator(".m-flash")).toHaveCount(0)

      const tarjetas = seccion.locator("[data-light]")
      const precio = tarjetas.nth(1).locator("span.display")
      const gratis = tarjetas.nth(0).locator("span.display")
      const antes = await precio.textContent()
      await precio.evaluate((el) => el.setAttribute("data-sonda-anterior", ""))

      await capturar(page, "#precios .m-price")
      await seccion.getByRole("switch").click()

      // Nodo nuevo (key por ciclo), con la clase y con la cifra del otro ciclo
      await expect(precio).toHaveClass(/\bm-price\b/)
      expect(await precio.getAttribute("data-sonda-anterior")).toBeNull()
      expect(await precio.textContent()).not.toBe(antes)
      // El gratuito vale lo mismo en los dos ciclos: no rueda
      await expect(gratis).not.toHaveClass(/\bm-price\b/)
      // Precio y línea de facturación de las tres tarjetas de pago
      await expect(seccion.locator(".m-price")).toHaveCount(6)
      await expect.poll(async () => (await capturadas(page)).length).toBe(6)
      for (const c of await capturadas(page)) expect(c.nombre).toBe("rise-in")

      const aMitad = await medirCapturada(
        page,
        "rise-in",
        "#precios [data-light] span.display",
        0.3
      )
      expect(aMitad).not.toBeNull()
      expect(aMitad!.retardo).toBe(0)
      expect(aMitad!.opacidad).toBeGreaterThan(0.05)
      expect(aMitad!.opacidad).toBeLessThan(0.95)
      if (reduce) {
        // Sin desplazamiento, y un fundido más largo y con ease-out para que se vea
        expect(aMitad!.duracion).toBe(440)
        expect(NEUTRO_TRANSLATE).toContain(aMitad!.translate)
      } else {
        expect(aMitad!.duracion).toBe(220)
        expect(NEUTRO_TRANSLATE).not.toContain(aMitad!.translate)
      }

      await soltarCapturadas(page)
      await expect(precio).toHaveCSS("opacity", "1")
    })

    test("E14 · el ahorro destella con un anillo en primary, nunca naranja, y solo al pasar a anual", async ({
      page,
    }) => {
      await irA(page, "/")
      const seccion = page.locator("#precios")
      await seccion.evaluate((el) =>
        el.scrollIntoView({ block: "start", behavior: "instant" })
      )
      await esperarFrames(page)
      await terminar(seccion)

      const ciclo = seccion.getByRole("switch")
      const selectorAhorro = '#precios label [data-slot="badge"]'
      const ahorro = page.locator(selectorAhorro)
      await expect(ciclo).not.toBeChecked()
      await expect(ahorro).not.toHaveClass(/\bm-flash\b/)

      await capturar(page, selectorAhorro)

      // A anual: destella
      await ciclo.click()
      await expect(ciclo).toBeChecked()
      await expect(ahorro).toHaveClass(/\bm-flash\b/)
      await expect
        .poll(async () => (await capturadas(page)).map((c) => c.nombre))
        .toEqual(["badge-flash"])

      // En el pico (35 %) hay un anillo de 3 px bien visible, también con reduce
      const pico = await medirCapturada(page, "badge-flash", selectorAhorro, 0.35)
      expect(pico).not.toBeNull()
      expect(pico!.duracion).toBe(700)
      const longitudes = pico!.boxShadow.match(/-?[\d.]+px/g) ?? []
      expect(longitudes, pico!.boxShadow).toHaveLength(4)
      expect(parseFloat(longitudes[3])).toBeGreaterThan(2.9)

      // Su color es primary al 50 %; no el naranja de la marca, del foco ni del texto
      const colores = await ahorro.evaluate((el, sombra) => {
        const calculado = (valor: string) => {
          const sonda = document.createElement("span")
          sonda.style.color = valor
          el.append(sonda)
          const color = getComputedStyle(sonda).color
          sonda.remove()
          return color
        }
        const delAnillo =
          sombra.match(/(?:oklab|oklch|lab|lch|rgba?|hsla?|hwb|color)\([^)]*\)/)?.[0] ??
          "transparent"
        return {
          anillo: calculado(delAnillo),
          primary: calculado("color-mix(in oklab, var(--primary) 50%, transparent)"),
          naranjas: [
            calculado("color-mix(in oklab, var(--brand) 50%, transparent)"),
            calculado("color-mix(in oklab, var(--ring) 50%, transparent)"),
            calculado("color-mix(in oklab, currentColor 50%, transparent)"),
          ],
        }
      }, pico!.boxShadow)
      expect(
        distancia(colores.anillo, colores.primary),
        JSON.stringify(colores)
      ).toBeLessThan(0.02)
      for (const naranja of colores.naranjas) {
        expect(
          distancia(colores.anillo, naranja),
          JSON.stringify(colores)
        ).toBeGreaterThan(0.05)
      }

      await soltarCapturadas(page)
      await expect(ahorro).toHaveCSS("box-shadow", "none")
    })

    test("FAQ · la respuesta se funde al abrir; con reduce el panel no crece: se funde al abrir y al cerrar", async ({
      page,
    }) => {
      await irA(page, "/")
      const faq = seccionFaq(page)
      await faq.evaluate((el) =>
        el.scrollIntoView({ block: "start", behavior: "instant" })
      )
      await esperarFrames(page)
      await terminar(faq)

      const disparador = faq.locator('[data-slot="accordion-trigger"]').first()
      const panel = faq.locator('[data-slot="accordion-content"]').first()
      const respuesta = panel.locator(".m-respuesta")

      await capturar(page, 'main :is([data-slot="accordion-content"], .m-respuesta)')

      // Abrir
      await disparador.click()
      await expect(panel).toHaveAttribute("data-state", "open")
      const alAbrir = reduce
        ? ["panel:fade-soft", "respuesta:fade-soft"]
        : ["panel:accordion-down", "respuesta:fade-soft"]
      await expect
        .poll(async () =>
          (await capturadas(page)).map((c) => `${c.objetivo}:${c.nombre}`).sort()
        )
        .toEqual(alAbrir)
      // Ni `animate-in` (enter/exit) ni desplazamientos de tw-animate
      for (const c of await capturadas(page))
        expect(c.nombre).not.toMatch(/enter|exit|slide/)

      const texto = await medirCapturada(page, "fade-soft", ".m-respuesta", 0.3)
      expect(texto).not.toBeNull()
      expect(texto!.retardo).toBe(60)
      expect(texto!.duracion).toBe(320)
      expect(texto!.opacidad).toBeGreaterThan(0.05)
      expect(texto!.opacidad).toBeLessThan(0.95)
      expect(NEUTRO_TRANSLATE).toContain(texto!.translate)

      if (reduce) {
        const abriendo = await medirCapturada(
          page,
          "fade-soft",
          '[data-slot="accordion-content"]',
          0.3
        )
        expect(abriendo!.opacidad).toBeGreaterThan(0.05)
        expect(abriendo!.opacidad).toBeLessThan(0.95)
        expect(NEUTRO_TRANSLATE).toContain(abriendo!.translate)
      }

      await soltarCapturadas(page)
      await expect(panel).toHaveCSS("opacity", "1")
      await expect(respuesta).toHaveCSS("opacity", "1")

      // Cerrar: la respuesta no se funde por su cuenta; el panel sí con reduce
      await disparador.click()
      await expect(panel).toHaveAttribute("data-state", "closed")
      await expect
        .poll(async () =>
          (await capturadas(page)).map((c) => `${c.objetivo}:${c.nombre}`)
        )
        .toEqual([reduce ? "panel:fade-soft-out" : "panel:accordion-up"])

      if (reduce) {
        const cerrando = await medirCapturada(
          page,
          "fade-soft-out",
          '[data-slot="accordion-content"]',
          0.3
        )
        expect(cerrando!.opacidad).toBeGreaterThan(0.05)
        expect(cerrando!.opacidad).toBeLessThan(0.95)
        // Radix espera a que acabe para desmontar: la respuesta sigue ahí
        await expect(respuesta).toHaveCount(1)
      }

      await soltarCapturadas(page)
      await expect(panel).toBeHidden()
      await expect(respuesta).toHaveCount(0)
    })

    test("/precios · sin observador no hay entradas ni esperas, pero el ciclo rueda el precio y destella igual", async ({
      page,
    }) => {
      await irA(page, "/precios")

      await expect(page.locator("[data-motion-state]")).toHaveCount(0)
      await expect(page.locator('[data-motion-group="client"]')).toHaveCount(0)

      const tarjetas = page.locator("main [data-light]")
      await expect(tarjetas).toHaveCount(4)
      for (const tarjeta of await tarjetas.all()) {
        await expect(tarjeta).not.toHaveClass(/\bm-anim\b/)
        await expect(tarjeta).toHaveCSS("opacity", "1")
      }

      // El titular del FAQ lleva sus clases, pero sin grupo en marcha no se anima
      const titularFaq = seccionFaq(page).locator("h2")
      expect(await titularFaq.evaluate((el) => el.getAnimations().length)).toBe(0)
      await expect(titularFaq).toHaveCSS("clip-path", "none")
      await expect(titularFaq).toHaveCSS("opacity", "1")

      await capturar(page, 'main :is(.m-price, label [data-slot="badge"])')
      const ciclo = page.getByRole("switch", { name: /Facturación anual/i })
      const precio = tarjetas.nth(1).locator("span.display")

      await ciclo.click()
      await expect(precio).toHaveClass(/\bm-price\b/)
      await expect(page.locator('main label [data-slot="badge"]')).toHaveClass(
        /\bm-flash\b/
      )
      // La comparativa cambia sus cifras sin rodarlas (decisión documentada en pricing.tsx)
      await expect(page.locator("table .m-price")).toHaveCount(0)

      await expect
        .poll(async () =>
          [...new Set((await capturadas(page)).map((c) => c.nombre))].sort()
        )
        .toEqual(["badge-flash", "rise-in"])
      await soltarCapturadas(page)
      await ciclo.click()
      await expect(page.locator('main label [data-slot="badge"]')).not.toHaveClass(
        /\bm-flash\b/
      )

      // Sin PointerLight montado, el atributo de luz no hace nada
      if (test.info().project.name !== "movil") {
        await tarjetas.nth(1).hover()
        await esperarFrames(page)
        expect(await tarjetas.nth(1).evaluate((el) => el.hasAttribute("data-lit"))).toBe(
          false
        )
      }
    })

    test("i18n · con los textos de es, en y pt los titulares acaban enteros, el precio rueda y nada desborda a medias", async ({
      page,
    }) => {
      test.setTimeout(120_000)

      for (const idioma of ["/", "/en", "/pt"]) {
        await irA(page, idioma)
        const seccion = page.locator("#precios")

        for (const grupo of [
          grupoPrecios(page),
          seccionFaq(page).locator("[data-motion-group]"),
        ]) {
          await expect(grupo).toHaveAttribute("data-motion-state", "idle")
          await centrar(grupo)
          await expect(grupo).toHaveAttribute("data-motion-state", "play")
          await terminar(grupo)
          await expect(grupo.locator("h2")).toHaveCSS("clip-path", "none")
          await expect(grupo.locator("h2")).toHaveCSS("opacity", "1")
        }
        expect(await desbordamiento(page), idioma).toBeLessThanOrEqual(1)

        // El precio rueda con el formato de cada idioma («14,50 US$», «US$14.50», «US$ 14,50»)
        await seccion.evaluate((el) =>
          el.scrollIntoView({ block: "start", behavior: "instant" })
        )
        await terminar(seccion)
        const precio = seccion.locator("[data-light]").nth(1).locator("span.display")
        const antes = (await precio.textContent()) ?? ""
        await seccion.getByRole("switch").click()
        await expect(precio).toHaveClass(/\bm-price\b/)
        await expect(precio).not.toHaveText(antes)

        // Con todas las piezas de la sección a medias, tampoco desborda
        await forzarGrupos(page)
        await congelarAnimaciones(page, "30%", "#precios")
        expect(await desbordamiento(page), `${idioma} a medias`).toBeLessThanOrEqual(1)
      }
    })
  })
}
