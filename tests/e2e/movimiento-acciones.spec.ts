import { expect, test, type Locator, type Page } from "@playwright/test"

import { congelarAnimaciones, forzarGrupos, irA, modoMovimiento } from "./helpers"

/**
 * Movimiento de las acciones y del CTA final (Lote 6).
 *
 * - E4 · «Apuntar → disparar». Con ratón, al pasar por encima de un botón que se
 *   encuadra al pulsar (`data-effect="crop"`: los `brand` y el de tinta del CTA),
 *   sus esquinas se cierran a media opacidad; al pulsar se apagan y entra
 *   cropSnap() en la capa de efectos. La flecha (o el Play) avanza. El botón de
 *   tinta del CTA suena «pop» y se encuadra en tinta (AGENTS.md, regla 7).
 * - E5 · El titular del CTA se corta a 12 fps con una cuchilla de tinta y la
 *   entradilla sube, al entrar en pantalla. El botón no se anima.
 *
 * Todo corre en los dos modos. El director revisa con reduce (Windows sin
 * animaciones), así que con reduce no basta con que nada se desplace: cada
 * efecto tiene que SEGUIR VIÉNDOSE (AGENTS.md, regla 6). Por eso cada prueba de
 * reduce comprueba también lo que sí se ve: esquinas a media opacidad, la flecha
 * que se funde en su sitio, el titular que funde, el encuadre de tinta entero.
 */

const MODOS = ["no-preference", "reduce"] as const
const IDIOMAS = ["/", "/en", "/pt"] as const

type Encuadre = { color: string; desplaza: boolean; opacidadMaxima: number }
type Fundido = { boton: string; nombre: string; opacidad: number }
type Inicio = {
  nombre: string
  pseudo: string
  etiqueta: string
  enBoton: boolean
  retardo: number
  curva: string
}

const sonidos = (page: Page) => page.evaluate(() => window.__clipealoSounds ?? [])

/** Solo el proyecto móvil va sin ratón (Pixel 7: `hover: none`, `pointer: coarse`). */
const conRaton = () => test.info().project.name !== "movil"

const botonHero = (page: Page) =>
  page.locator("main section").first().locator('[data-button][data-variant="brand"]')
const botonComoFunciona = (page: Page) =>
  page.locator("main section").first().locator('[data-button][href$="#como-funciona"]')
const botonCta = (page: Page) => page.locator("#subir [data-button]")

/** Un valor de `translate` sin desplazamiento («none», «0px», «0px 0px»). */
const sinDesplazamiento = (valor: string) =>
  valor === "none" ||
  valor
    .trim()
    .split(/\s+/)
    .every((parte) => /^-?0(\.0+)?(px|%)?$/.test(parte))

/** Estilo calculado del pre-encuadre (el `::after` del botón). */
const preEncuadre = (boton: Locator) =>
  boton.evaluate((el: HTMLElement) => {
    const cs = getComputedStyle(el, "::after")
    return {
      content: cs.content,
      opacity: cs.opacity,
      scale: cs.scale,
      color: cs.borderTopColor,
      ancho: parseFloat(cs.width),
      anchoBoton: el.offsetWidth,
    }
  })

/** Color calculado de un token, con la misma serialización que un borde. */
const colorDe = (page: Page, token: string) =>
  page.evaluate((token) => {
    const sonda = document.createElement("span")
    sonda.style.color = `var(${token})`
    document.body.appendChild(sonda)
    const color = getComputedStyle(sonda).color
    sonda.remove()
    return color
  }, token)

/**
 * Los botones enlazan a la aplicación: el clic se queda en la página para medir su
 * efecto. Un `preventDefault` en captura sobre `window` llega antes que React, así
 * que `next/link` no navega (mira `defaultPrevented`), y `InteractionFeedback`
 * (captura en `document`) suena y encuadra igual.
 */
const quedarseEnLaPagina = (page: Page) =>
  page.evaluate(() => {
    window.addEventListener(
      "click",
      (evento) => {
        if ((evento.target as Element).closest?.("a[href]")) evento.preventDefault()
      },
      true
    )
  })

/**
 * Anota cada encuadre de cropSnap() al entrar en `#clipealo-efectos`: color de
 * sus esquinas y fotogramas de su animación. Se lee al insertarse porque el nodo
 * se borra al terminar (560 ms).
 */
const vigilarEncuadres = (page: Page) =>
  page.evaluate(() => {
    const registro: Encuadre[] = []
    ;(window as unknown as { __encuadres: Encuadre[] }).__encuadres = registro
    new MutationObserver((cambios) => {
      for (const cambio of cambios) {
        for (const nodo of Array.from(cambio.addedNodes)) {
          if (!(nodo instanceof HTMLElement)) continue
          if (nodo.parentElement?.id !== "clipealo-efectos") continue
          const esquina = nodo.firstElementChild
          const fotogramas = nodo
            .getAnimations()
            .flatMap((a) => (a.effect as KeyframeEffect).getKeyframes())
          registro.push({
            color: esquina ? getComputedStyle(esquina).borderTopColor : "",
            desplaza: fotogramas.some((f) =>
              ["transform", "translate", "scale"].some((p) => p in f)
            ),
            opacidadMaxima: Math.max(0, ...fotogramas.map((f) => Number(f.opacity ?? 0))),
          })
        }
      }
    }).observe(document.body, { childList: true, subtree: true })
  })

const encuadres = (page: Page) =>
  page.evaluate(() => (window as unknown as { __encuadres: Encuadre[] }).__encuadres)

for (const modo of MODOS) {
  test.describe(`acciones y CTA (reduced-motion: ${modo})`, () => {
    test.beforeEach(async ({ page }) => {
      await modoMovimiento(page, modo)
      await page.addInitScript(() => {
        window.__clipealoSounds = []
      })
    })

    for (const idioma of IDIOMAS) {
      test(`E4 · al pasar el ratón, la acción principal apunta con sus esquinas (${idioma})`, async ({
        page,
      }) => {
        await irA(page, idioma)
        const hayRaton = await page.evaluate(
          () => matchMedia("(hover: hover) and (pointer: fine)").matches
        )

        if (!conRaton()) {
          // Sin ratón no hay pre-encuadre: ni siquiera se genera el pseudo
          expect(hayRaton).toBe(false)
          await botonHero(page).hover()
          expect((await preEncuadre(botonHero(page))).content).toBe("none")
          expect((await preEncuadre(botonCta(page))).content).toBe("none")
          expect(await sonidos(page)).toEqual([])
          return
        }

        expect(hayRaton).toBe(true)
        const naranja = await colorDe(page, "--color-brand-500")
        const tinta = await colorDe(page, "--color-ink-950")

        for (const [boton, color] of [
          [botonHero(page), naranja],
          [botonCta(page), tinta],
        ] as const) {
          await boton.scrollIntoViewIfNeeded()
          await page.mouse.move(0, 0)

          const reposo = await preEncuadre(boton)
          expect(reposo.content).not.toBe("none")
          expect(reposo.opacity).toBe("0")
          // Naranja de la marca de recorte; tinta sobre la sección naranja del CTA
          expect(reposo.color).toBe(color)
          // Con reduce no se cierra desde fuera: aparece en su sitio
          expect(reposo.scale).toBe(modo === "reduce" ? "1" : "1.12")
          // Apunta donde dispara: el mismo margen de 6 px que cropSnap(), con el
          // texto de cada idioma
          expect(Math.abs(reposo.ancho - (reposo.anchoBoton + 12))).toBeLessThanOrEqual(1)

          await boton.hover()
          if (modo === "reduce") {
            expect((await preEncuadre(boton)).scale).toBe("1")
          }
          // Se ve en los dos modos. La escala tarda más que la opacidad (220 frente
          // a 140 ms): se espera a las dos
          await expect.poll(async () => (await preEncuadre(boton)).opacity).toBe("0.55")
          await expect.poll(async () => (await preEncuadre(boton)).scale).toBe("1")
        }

        // Apuntar no suena (regla 7)
        expect(await sonidos(page)).toEqual([])
      })
    }

    test("E4 · la flecha avanza al pasar el ratón; con reduce se funde en su sitio", async ({
      page,
    }) => {
      test.skip(!conRaton(), "sin ratón no hay hover")
      await irA(page, "/")

      // La flecha y el Play del hero llevan la clase (Lote 1); el CTA, su flecha
      await expect(
        page.locator("main section").first().locator("[data-button] .m-nudge")
      ).toHaveCount(2)
      await expect(botonCta(page).locator(".m-nudge")).toHaveCount(1)

      // Cada animación de un icono que avanza, medida al 40 % (el punto más bajo
      // del fundido) y devuelta a su tiempo
      await page.evaluate(() => {
        const registro: Fundido[] = []
        ;(window as unknown as { __fundidos: Fundido[] }).__fundidos = registro
        document.addEventListener(
          "animationstart",
          (evento) => {
            const icono = evento.target as Element
            if (!icono.matches?.(".m-nudge")) return
            const animacion = icono
              .getAnimations()
              .find(
                (a): a is CSSAnimation =>
                  a instanceof CSSAnimation && a.animationName === evento.animationName
              )
            let opacidad = NaN
            if (animacion && animacion.currentTime !== null) {
              const antes = animacion.currentTime
              const duracion = Number(animacion.effect?.getComputedTiming().duration)
              animacion.currentTime = duracion * 0.4
              opacidad = parseFloat(getComputedStyle(icono).opacity)
              animacion.currentTime = antes
            }
            registro.push({
              boton: icono.closest("[data-button]")?.textContent?.trim() ?? "",
              nombre: evento.animationName,
              opacidad,
            })
          },
          true
        )
      })
      const fundidos = () =>
        page.evaluate(() => (window as unknown as { __fundidos: Fundido[] }).__fundidos)
      const desplazamiento = (icono: Locator) =>
        icono.evaluate((el) => getComputedStyle(el).translate)

      // El CTA de tinta (con esquinas) y «Ver cómo funciona» (sin esquinas: con
      // reduce, el icono es lo único que responde)
      for (const boton of [botonCta(page), botonComoFunciona(page)]) {
        const icono = boton.locator(".m-nudge")
        const texto = (await boton.textContent())?.trim() ?? ""
        await boton.scrollIntoViewIfNeeded()
        await page.mouse.move(0, 0)
        await boton.hover()

        if (modo === "reduce") {
          await expect
            .poll(async () => (await fundidos()).filter((f) => f.boton === texto))
            .toHaveLength(1)
          const [fundido] = (await fundidos()).filter((f) => f.boton === texto)
          expect(fundido.nombre).toBe("nudge-soft")
          // Se ve: baja a 0,3 y vuelve
          expect(fundido.opacidad).toBeLessThan(0.5)
          expect(sinDesplazamiento(await desplazamiento(icono))).toBe(true)
        } else {
          await expect
            .poll(async () => parseFloat(await desplazamiento(icono)) || 0)
            .toBeGreaterThan(2)
          expect((await fundidos()).filter((f) => f.boton === texto)).toEqual([])
        }

        // Al salir, vuelve a su sitio
        await page.mouse.move(0, 0)
        await expect
          .poll(async () => sinDesplazamiento(await desplazamiento(icono)))
          .toBe(true)
      }

      expect(await sonidos(page)).toEqual([])
    })

    test("E4 · el CTA de tinta suena «pop», apaga sus esquinas al pulsar y se encuadra en tinta", async ({
      page,
    }) => {
      await irA(page, "/")
      await quedarseEnLaPagina(page)
      await vigilarEncuadres(page)
      const tinta = await colorDe(page, "--color-ink-950")
      const naranja = await colorDe(page, "--color-brand-500")

      const cta = botonCta(page)
      await expect(cta).toHaveAttribute("data-sound", "pop")
      await expect(cta).toHaveAttribute("data-effect", "crop")
      await cta.scrollIntoViewIfNeeded()

      if (conRaton()) {
        await page.mouse.move(0, 0)
        await cta.hover()
        await expect.poll(async () => (await preEncuadre(cta)).opacity).toBe("0.55")
        await page.mouse.down()
        // Apunta y dispara: al hundirse, las esquinas se apagan
        await expect.poll(async () => (await preEncuadre(cta)).opacity).toBe("0")
        expect(await sonidos(page)).toEqual([])
        await page.mouse.up()
      } else {
        await cta.click()
      }

      await expect.poll(() => sonidos(page)).toEqual(["pop"])
      await expect.poll(async () => (await encuadres(page)).length).toBe(1)
      const [encuadre] = await encuadres(page)
      expect(encuadre.color).toBe(tinta)
      // Se ve entero en los dos modos; con reduce, sin escalar
      expect(encuadre.opacidadMaxima).toBe(1)
      expect(encuadre.desplaza).toBe(modo !== "reduce")
      expect(new URL(page.url()).pathname).toMatch(/^\/(?:en|pt)?\/?$/)

      // La tinta es solo del CTA: el botón naranja del hero se encuadra en naranja.
      // Dos «pop» a menos de 60 ms suenan como uno (lib/sound.ts, doble clic): con
      // el equipo cargado los dos clics llegaban a caer dentro de ese intervalo
      await page.waitForTimeout(120)
      await botonHero(page).click()
      await expect.poll(async () => (await encuadres(page)).length).toBe(2)
      expect((await encuadres(page))[1].color).toBe(naranja)
      expect(await sonidos(page)).toEqual(["pop", "pop"])
    })

    test("E5 · el titular del CTA se corta al entrar en pantalla, termina entero y el botón no se anima", async ({
      page,
    }) => {
      await page.addInitScript(() => {
        const registro: Inicio[] = []
        ;(window as unknown as { __cta: Inicio[] }).__cta = registro
        document.addEventListener(
          "animationstart",
          (evento) => {
            const el = evento.target as Element
            if (!el.closest?.("#subir")) return
            const pseudo = evento.pseudoElement || ""
            const animacion = el
              .getAnimations({ subtree: true })
              .find(
                (a): a is CSSAnimation =>
                  a instanceof CSSAnimation &&
                  a.animationName === evento.animationName &&
                  (a.effect as KeyframeEffect).target === el &&
                  ((a.effect as KeyframeEffect).pseudoElement ?? "") === pseudo
              )
            registro.push({
              nombre: evento.animationName,
              pseudo,
              etiqueta: el.tagName.toLowerCase(),
              enBoton: Boolean(el.closest("[data-button]")),
              retardo: Number(animacion?.effect?.getComputedTiming().delay ?? NaN),
              curva: getComputedStyle(el, pseudo || null).animationTimingFunction,
            })
          },
          true
        )
      })

      await irA(page, "/")
      const grupo = page.locator("#subir [data-motion-group]")
      const titular = page.locator("#subir h2")
      const entradilla = page.locator("#subir h2 + p")

      // Por debajo de la pantalla: espera sin haberse visto nunca
      await expect(grupo).toHaveAttribute("data-motion-state", "idle")

      await grupo.evaluate((el) =>
        el.scrollIntoView({ block: "center", behavior: "instant" })
      )
      await expect(grupo).toHaveAttribute("data-motion-state", "play")

      // Termina en su estado natural: entero, opaco y en su sitio
      await expect(titular).toHaveCSS("clip-path", "none")
      await expect(titular).toHaveCSS("opacity", "1")
      await expect(entradilla).toHaveCSS("opacity", "0.8")
      await expect
        .poll(async () =>
          sinDesplazamiento(
            await entradilla.evaluate((el) => getComputedStyle(el).translate)
          )
        )
        .toBe(true)

      const inicios = await page.evaluate(
        () => (window as unknown as { __cta: Inicio[] }).__cta
      )
      expect(inicios.filter((i) => i.enBoton)).toEqual([])

      const corte = inicios.find((i) => i.etiqueta === "h2" && !i.pseudo)
      const cuchilla = inicios.find((i) => i.etiqueta === "h2" && i.pseudo === "::after")
      const subida = inicios.find((i) => i.etiqueta === "p")
      if (modo === "reduce") {
        // Sin cuchilla: el titular funde en su sitio
        expect(corte?.nombre).toBe("fade-soft")
        expect(cuchilla).toBeUndefined()
      } else {
        expect(corte?.nombre).toBe("cut-in")
        expect(corte?.curva).toMatch(/^steps\(9/)
        expect(cuchilla?.nombre).toBe("cut-blade")
      }
      expect(subida?.nombre).toBe("rise-in")
      // La entradilla va un escalón (80 ms) después del titular
      expect(subida!.retardo - corte!.retardo).toBe(80)
    })

    for (const idioma of IDIOMAS) {
      test(`E5 · a medio corte el titular se ve cortar, o fundir con reduce (${idioma})`, async ({
        page,
      }) => {
        await irA(page, idioma)
        const tinta = await colorDe(page, "--color-ink-950")
        await forzarGrupos(page)
        const congeladas = await congelarAnimaciones(page, "30%", "#subir")
        expect(congeladas).toBeGreaterThanOrEqual(modo === "reduce" ? 2 : 3)

        const fotograma = await page.locator("#subir").evaluate((seccion) => {
          const h2 = seccion.querySelector("h2")!
          const p = seccion.querySelector("h2 + p")!
          const titular = getComputedStyle(h2)
          const cuchilla = getComputedStyle(h2, "::after")
          const entradilla = getComputedStyle(p)
          return {
            titular: { opacidad: parseFloat(titular.opacity), recorte: titular.clipPath },
            cuchilla: {
              content: cuchilla.content,
              opacidad: parseFloat(cuchilla.opacity),
              translate: cuchilla.translate,
              color: cuchilla.borderRightColor,
            },
            entradilla: {
              opacidad: parseFloat(entradilla.opacity),
              translate: entradilla.translate,
            },
          }
        })

        if (modo === "reduce") {
          // Nada recorta ni se desplaza, pero el fundido se ve a medias
          expect(fotograma.titular.recorte).toBe("none")
          expect(fotograma.titular.opacidad).toBeGreaterThan(0.05)
          expect(fotograma.titular.opacidad).toBeLessThan(0.95)
          expect(fotograma.cuchilla.content).toBe("none")
          expect(sinDesplazamiento(fotograma.entradilla.translate)).toBe(true)
        } else {
          // La caja a medio descubrir y la cuchilla de tinta en camino
          expect(fotograma.titular.recorte).toMatch(/^inset\(/)
          expect(fotograma.titular.opacidad).toBe(1)
          expect(fotograma.cuchilla.content).not.toBe("none")
          expect(fotograma.cuchilla.opacidad).toBe(1)
          expect(sinDesplazamiento(fotograma.cuchilla.translate)).toBe(false)
          expect(fotograma.cuchilla.color).toBe(tinta)
          expect(sinDesplazamiento(fotograma.entradilla.translate)).toBe(false)
        }
        // La entradilla aparece en los dos modos (su opacidad natural es 0,8)
        expect(fotograma.entradilla.opacidad).toBeGreaterThan(0)
        expect(fotograma.entradilla.opacidad).toBeLessThan(0.79)
      })
    }

    test("en /precios el CTA no se anima: sin observador se ve terminado", async ({
      page,
    }) => {
      await irA(page, "/precios")
      const titular = page.locator("#subir h2")

      expect(
        await page.locator("#subir [data-motion-group]").getAttribute("data-motion-state")
      ).toBeNull()
      expect(
        await titular.evaluate((el) => el.getAnimations({ subtree: true }).length)
      ).toBe(0)
      await expect(titular).toHaveCSS("clip-path", "none")
      await expect(titular).toHaveCSS("opacity", "1")
      await expect(page.locator("#subir h2 + p")).toHaveCSS("opacity", "0.8")
    })
  })
}

test.describe("CTA sin JavaScript", () => {
  test.use({ javaScriptEnabled: false })

  for (const modo of MODOS) {
    test(`el titular se ve entero y sin estado (reduced-motion: ${modo})`, async ({
      page,
    }) => {
      await modoMovimiento(page, modo)
      // Sin JS no hay hidratación que esperar: `irA` se quedaría colgado
      await page.goto("/", { waitUntil: "load" })

      const titular = page.locator("#subir h2")
      expect(
        await page.locator("#subir [data-motion-group]").getAttribute("data-motion-state")
      ).toBeNull()
      await expect(titular).toHaveCSS("clip-path", "none")
      await expect(titular).toHaveCSS("opacity", "1")
      await expect(page.locator("#subir h2 + p")).toHaveCSS("opacity", "0.8")
    })
  }
})
