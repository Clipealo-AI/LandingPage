import { expect, test, type Page } from "@playwright/test"

import { irA, modoMovimiento } from "./helpers"

/**
 * Movimiento de Redes (Lote 4): titular cortado al entrar (E5), esquinas del
 * escenario que se cierran al entrar y re-encuadre al cambiar de red (E13), el
 * formato que se recorta sin desplazar el layout y la transición del botón de red.
 *
 * Corre en los dos modos porque el director revisa con reduce: con «reducir
 * movimiento» cada gesto tiene que seguir viéndose (parte de opacidad 0, funde
 * o destella en su sitio) y solo deja de desplazar.
 */

const MODOS = ["no-preference", "reduce"] as const

/** La misma espera que `ESPERA_REENCUADRE` en components/marketing/redes.tsx. */
const ESPERA = 120

/** `EASE_BRAND` de lib/motion.ts (la curva de `--ease-brand`). */
const EASE_BRAND = "cubic-bezier(0.22, 1, 0.36, 1)"

/** Dirección (`--cx`, `--cy`) y orden (`--c`) de cada esquina, como en app/motion/base.css. */
const ESQUINAS = {
  tl: [-1, -1, 0],
  tr: [1, -1, 1],
  br: [1, 1, 2],
  bl: [-1, 1, 3],
} as const

/** Una animación CSS de `#redes` al empezar, con el estilo de su primer fotograma activo. */
type Arranque = {
  nombre: string
  quien: string
  pseudo: string
  retardo: number
  opacidad: string
  translate: string
  clipPath: string
}

/** Una llamada a `Element.animate()` dentro de `#redes`, con el estilo que deja al crearse. */
type Llamada = {
  quien: string
  fotogramas: Record<string, string | number>[]
  opciones: Record<string, string | number>
  opacidad: string
  translate: string
}

type Sonda = { arranques: Arranque[]; llamadas: Llamada[] }

/**
 * Sondas instaladas antes de cargar:
 * - cada `animationstart` dentro de `#redes` (también en `::after`) se lleva un
 *   instante al principio de su parte activa para leer lo que se ve al empezar,
 *   y se devuelve a donde estaba;
 * - cada `Element.animate()` dentro de `#redes` se registra con sus fotogramas,
 *   sus opciones y el estilo calculado justo al crearse.
 */
async function instalarSondas(page: Page) {
  await page.addInitScript(() => {
    const sonda: Sonda = { arranques: [], llamadas: [] }
    ;(window as unknown as { __redes: Sonda }).__redes = sonda
    window.__clipealoSounds = []

    const ORDEN_TEXTO = ["antetitulo", "titular", "entradilla"]
    const quien = (el: Element) => {
      const h = el as HTMLElement
      if (h.dataset.cropCorner) return `esquina-${h.dataset.cropCorner}`
      if (h.hasAttribute("data-redes-patron")) return "patron"
      if (h.hasAttribute("data-redes-marco")) return "marco"
      if (h.classList.contains("m-swap")) return "rotulo"
      if (h.classList.contains("m-anim")) {
        const grupo = h.closest("[data-motion-group]")
        const i = Array.from(grupo?.querySelectorAll(".m-anim") ?? []).indexOf(h)
        return ORDEN_TEXTO[i] ?? `m-anim-${i}`
      }
      return h.tagName.toLowerCase()
    }

    document.addEventListener(
      "animationstart",
      (evento) => {
        const objetivo = evento.target as Element
        if (!objetivo.closest?.("#redes")) return
        const pseudo = evento.pseudoElement || null
        const arranque: Arranque = {
          nombre: evento.animationName,
          quien: quien(objetivo),
          pseudo: pseudo ?? "",
          retardo: Number.NaN,
          opacidad: "",
          translate: "",
          clipPath: "",
        }
        const animacion = objetivo
          .getAnimations({ subtree: true })
          .find(
            (a): a is CSSAnimation =>
              a instanceof CSSAnimation &&
              a.animationName === evento.animationName &&
              (a.effect as KeyframeEffect).target === objetivo &&
              ((a.effect as KeyframeEffect).pseudoElement ?? null) === pseudo
          )
        if (animacion && animacion.currentTime !== null) {
          const retardo = Number(animacion.effect?.getComputedTiming().delay ?? 0)
          const antes = animacion.currentTime
          animacion.currentTime = retardo
          const cs = getComputedStyle(objetivo, pseudo)
          arranque.retardo = retardo
          arranque.opacidad = cs.opacity
          arranque.translate = cs.translate
          arranque.clipPath = cs.clipPath
          animacion.currentTime = antes
        }
        sonda.arranques.push(arranque)
      },
      true
    )

    const animar = Element.prototype.animate
    Element.prototype.animate = function (fotogramas, opciones) {
      const animacion = animar.call(this, fotogramas, opciones)
      if (this.closest("#redes")) {
        const cs = getComputedStyle(this)
        sonda.llamadas.push({
          quien: quien(this),
          fotogramas: JSON.parse(JSON.stringify(fotogramas ?? [])),
          opciones:
            typeof opciones === "number"
              ? { duration: opciones }
              : JSON.parse(JSON.stringify(opciones ?? {})),
          opacidad: cs.opacity,
          translate: cs.translate,
        })
      }
      return animacion
    }
  })
}

const sonda = (page: Page) =>
  page.evaluate(() => (window as unknown as { __redes: Sonda }).__redes)

const grupoTexto = (page: Page) =>
  page.locator('#redes [data-motion-group="client"]').filter({ has: page.locator("h2") })

const escenario = (page: Page) =>
  page
    .locator('#redes [data-motion-group="client"]')
    .filter({ has: page.locator("[data-redes-marco]") })

const botones = (page: Page) => page.locator("#redes ul[aria-label] button")

/** `none`, `0px` o `0px 0px`: sin desplazamiento. Una cadena vacía (sin medir) no cuenta. */
const sinDesplazar = (valor: string) =>
  valor === "none" ||
  valor
    .trim()
    .split(/\s+/)
    .every((v) => Number.parseFloat(v) === 0)

/** Espera a que acaben las animaciones finitas en marcha dentro de `#redes` (máximo 5 s). */
const esperarAnimaciones = (page: Page) =>
  page.evaluate(async () => {
    const raiz = document.querySelector("#redes")
    if (!raiz) return
    const finitas = raiz
      .getAnimations({ subtree: true })
      .filter(
        (a) =>
          a.playState === "running" &&
          Number.isFinite(Number(a.effect?.getComputedTiming().endTime))
      )
    await Promise.race([
      Promise.all(finitas.map((a) => a.finished.catch(() => undefined))),
      new Promise((listo) => setTimeout(listo, 5000)),
    ])
  })

const esperarFrames = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<void>((listo) =>
        requestAnimationFrame(() => requestAnimationFrame(() => listo()))
      )
  )

for (const modo of MODOS) {
  test.describe(`movimiento de Redes (reduced-motion: ${modo})`, () => {
    const reduce = modo === "reduce"

    test.beforeEach(async ({ page }) => {
      await modoMovimiento(page, modo)
      await instalarSondas(page)
    })

    test("el titular se corta al entrar en pantalla (con reduce, funde sin cuchilla), y solo una vez", async ({
      page,
    }) => {
      await irA(page, "/")
      const grupo = grupoTexto(page)
      const titular = grupo.locator("h2")
      await expect(grupo).toHaveAttribute("data-motion-state", "idle")

      // Mientras espera está oculto en su primer fotograma; la lista de redes no se anima
      if (reduce) await expect(titular).toHaveCSS("opacity", "0")
      else await expect(titular).toHaveCSS("clip-path", /^inset\(/)
      await expect(botones(page)).toHaveCount(6)
      await expect(botones(page).first()).toHaveCSS("animation-name", "none")

      await titular.evaluate((el) =>
        el.scrollIntoView({ block: "center", behavior: "instant" })
      )
      await expect(grupo).toHaveAttribute("data-motion-state", "play")
      await esperarAnimaciones(page)

      const { arranques } = await sonda(page)
      const de = (quien: string, pseudo = "") =>
        arranques.filter((a) => a.quien === quien && a.pseudo === pseudo)

      // Antetítulo y entradilla suben (con reduce, solo funden) a 0 y 160 ms
      for (const [quien, retardo] of [
        ["antetitulo", 0],
        ["entradilla", 160],
      ] as const) {
        const lista = de(quien)
        expect(
          lista.map((a) => a.nombre),
          quien
        ).toEqual(["rise-in"])
        expect(lista[0].retardo).toBeCloseTo(retardo, 0)
        expect(lista[0].opacidad, `${quien} se ve aparecer`).toBe("0")
        expect(sinDesplazar(lista[0].translate), `${quien}: ${lista[0].translate}`).toBe(
          reduce
        )
      }

      const cortes = de("titular")
      const cuchillas = de("titular", "::after")
      expect(cortes).toHaveLength(1)
      expect(cortes[0].retardo).toBeCloseTo(80, 0)
      if (reduce) {
        // Fundido en su sitio, que se ve porque parte de opacidad 0; sin recorte ni cuchilla
        expect(cortes[0].nombre).toBe("fade-soft")
        expect(cortes[0].opacidad).toBe("0")
        expect(cortes[0].clipPath).toBe("none")
        expect(cuchillas).toEqual([])
        expect(
          await titular.evaluate((el) => getComputedStyle(el, "::after").content)
        ).toBe("none")
      } else {
        expect(cortes[0].nombre).toBe("cut-in")
        expect(cortes[0].clipPath).toMatch(/^inset\(/)
        expect(cuchillas.map((a) => a.nombre)).toEqual(["cut-blade"])
        expect(cuchillas[0].retardo).toBeCloseTo(80, 0)
      }

      // Termina entero y a la vista
      await expect(titular).toHaveCSS("clip-path", "none")
      await expect(titular).toHaveCSS("opacity", "1")

      // Una vez por visita: salir y volver no lo repite
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }))
      await esperarFrames(page)
      await titular.evaluate((el) =>
        el.scrollIntoView({ block: "center", behavior: "instant" })
      )
      await esperarFrames(page)
      expect(
        (await sonda(page)).arranques.filter((a) => a.quien === "titular")
      ).toHaveLength(
        reduce ? 1 : 2 // sin reduce, el corte y su cuchilla
      )
    })

    test("las esquinas del escenario se cierran al entrar: desde fuera, o en su sitio con reduce", async ({
      page,
    }) => {
      await irA(page, "/")
      const grupo = escenario(page)
      const esquinas = grupo.locator("[data-crop-corner]")
      await expect(grupo).toHaveAttribute("data-motion-state", "idle")
      await expect(esquinas).toHaveCount(4)
      for (const esquina of await esquinas.all()) {
        await expect(esquina).toHaveCSS("opacity", "0")
      }

      await grupo.evaluate((el) =>
        el.scrollIntoView({ block: "center", behavior: "instant" })
      )
      await expect(grupo).toHaveAttribute("data-motion-state", "play")
      await esperarAnimaciones(page)

      const cierres = (await sonda(page)).arranques.filter((a) =>
        a.quien.startsWith("esquina-")
      )
      expect(cierres.map((a) => a.nombre)).toEqual(Array(4).fill("crop-close"))
      // Una tras otra en el sentido del reloj: 200 ms y 60 ms más por esquina
      expect(
        Object.fromEntries(cierres.map((a) => [a.quien, Math.round(a.retardo)]))
      ).toEqual({
        "esquina-tl": 200,
        "esquina-tr": 260,
        "esquina-br": 320,
        "esquina-bl": 380,
      })
      for (const a of cierres) {
        expect(a.opacidad, `${a.quien} se ve aparecer`).toBe("0")
        expect(sinDesplazar(a.translate), `${a.quien}: ${a.translate}`).toBe(reduce)
      }
      for (const esquina of await esquinas.all()) {
        await expect(esquina).toHaveCSS("opacity", "1")
      }

      // Entrar en pantalla no re-encuadra ni funde el rótulo
      expect((await sonda(page)).llamadas).toEqual([])
      await expect(grupo).not.toHaveAttribute("data-redes-cambio")
      await expect(grupo.locator(".m-swap")).toHaveCSS("animation-name", "none")
    })

    test(
      reduce
        ? "con reduce el botón de red no sube: responde con el borde, el fondo y la sombra"
        : "el botón de red sube con una transición de translate, no de transform",
      async ({ page }) => {
        await irA(page, "/")
        const boton = botones(page).nth(1)
        await boton.evaluate((el) =>
          el.scrollIntoView({ block: "center", behavior: "instant" })
        )

        const propiedades = await boton.evaluate((el) =>
          getComputedStyle(el)
            .transitionProperty.split(",")
            .map((p) => p.trim())
        )
        expect(propiedades).not.toContain("transform")
        expect(propiedades).toEqual(
          expect.arrayContaining(["border-color", "box-shadow"])
        )
        if (reduce) expect(propiedades).not.toContain("translate")
        else expect(propiedades).toContain("translate")
        await expect(boton).toHaveCSS("transition-duration", /0\.2s/)

        // Sin ratón no hay hover que probar
        if (test.info().project.name === "movil") return
        await boton.evaluate((el) => {
          const registro: string[] = []
          ;(el as unknown as { __transiciones: string[] }).__transiciones = registro
          el.addEventListener("transitionrun", (e) =>
            registro.push((e as TransitionEvent).propertyName)
          )
        })
        const bordeAntes = await boton.evaluate((el) => getComputedStyle(el).borderColor)
        await boton.hover()
        const transiciones = () =>
          boton.evaluate(
            (el) => (el as unknown as { __transiciones: string[] }).__transiciones
          )
        if (reduce) {
          // En su sitio, pero se ve: el borde cambia de color
          await expect
            .poll(() => boton.evaluate((el) => getComputedStyle(el).borderColor))
            .not.toBe(bordeAntes)
          await expect(boton).toHaveCSS("translate", "none")
          expect(await transiciones()).not.toContain("translate")
        } else {
          await expect(boton).toHaveCSS("translate", "0px -2px")
          expect(await transiciones()).toContain("translate")
        }
      }
    )

    test("al elegir otra red espera 120 ms con la misma red y lanza una sola tanda: cuatro esquinas y el patrón", async ({
      page,
    }) => {
      const conRaton = test.info().project.name !== "movil"
      await page.clock.install()
      await irA(page, "/")

      const grupo = escenario(page)
      await grupo.evaluate((el) =>
        el.scrollIntoView({ block: "center", behavior: "instant" })
      )
      await expect(grupo).toHaveAttribute("data-motion-state", "play")
      await esperarAnimaciones(page)
      // Ni cargar ni entrar en pantalla re-encuadran (el primer montaje se salta)
      expect((await sonda(page)).llamadas).toEqual([])
      await expect(grupo).not.toHaveAttribute("data-redes-cambio")

      const rotulo = page.locator("#redes [aria-live]")
      await rotulo.evaluate(
        (el) => ((el as unknown as { __mismo: boolean }).__mismo = true)
      )

      const lista = botones(page)
      await lista
        .first()
        .evaluate((el) =>
          el.closest("ul")?.scrollIntoView({ block: "center", behavior: "instant" })
        )
      const centros = await lista.evaluateAll((els) =>
        els.map((el) => {
          const r = el.getBoundingClientRect()
          return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
        })
      )
      const elegir = async (i: number) => {
        if (conRaton) await page.mouse.move(centros[i].x, centros[i].y)
        else await lista.nth(i).evaluate((el) => (el as HTMLElement).focus())
        await expect(lista.nth(i)).toHaveAttribute("aria-pressed", "true")
      }

      // Con el reloj parado, los temporizadores solo corren con runFor
      const ahora = await page.evaluate(() => Date.now())
      await page.clock.pauseAt(ahora + 1000)

      // Seis cambios rápidos (pasar el ratón por la lista, o el foco)
      for (const i of [1, 2, 3, 4, 5, 1]) await elegir(i)

      const tras = await sonda(page)
      expect(tras.llamadas.filter((l) => l.quien !== "marco")).toEqual([])
      const fundidos = tras.llamadas.filter((l) => l.quien === "marco")
      if (reduce) {
        // El ancho salta sin transición: el marco funde en el mismo fotograma, sin esperar
        expect(fundidos.length).toBeGreaterThanOrEqual(1)
        for (const f of fundidos) {
          expect(f.fotogramas).toEqual([{ opacity: 0.5 }, { opacity: 1 }])
          // Un fundido que se lee: 300 ms con ease-out (la curva de marca lo
          // dejaba casi hecho en el primer fotograma)
          expect(f.opciones).toMatchObject({ duration: 300, easing: "ease-out" })
          expect(f.opacidad).toBe("0.5")
        }
      } else {
        expect(fundidos).toEqual([])
      }

      await page.clock.runFor(ESPERA - 1)
      expect((await sonda(page)).llamadas.filter((l) => l.quien !== "marco")).toEqual([])
      await page.clock.runFor(1)

      const tanda = (await sonda(page)).llamadas.filter((l) => l.quien !== "marco")
      const esquinas = tanda.filter((l) => l.quien.startsWith("esquina-"))
      const patron = tanda.filter((l) => l.quien === "patron")
      expect(esquinas.map((l) => l.quien).sort()).toEqual([
        "esquina-bl",
        "esquina-br",
        "esquina-tl",
        "esquina-tr",
      ])
      expect(patron).toHaveLength(1)

      for (const l of esquinas) {
        const [cx, cy, c] =
          ESQUINAS[l.quien.replace("esquina-", "") as keyof typeof ESQUINAS]
        expect(l.opciones, l.quien).toMatchObject({
          duration: 450,
          delay: c * 40,
          easing: EASE_BRAND,
          fill: "backwards",
        })
        expect(l.fotogramas[0].opacity).toBe(0)
        expect(l.fotogramas[l.fotogramas.length - 1].opacity).toBe(1)
        // Se ve: la esquina se apaga y vuelve a encenderse
        expect(l.opacidad, `${l.quien} al crearse`).toBe("0")
        if (reduce) {
          for (const f of l.fotogramas) {
            expect(sinDesplazar(String(f.translate ?? "none")), l.quien).toBe(true)
          }
          expect(sinDesplazar(l.translate), l.quien).toBe(true)
        } else {
          expect(l.fotogramas[0].translate).toBe(`${cx * 12}px ${cy * 12}px`)
          expect(l.translate).toBe(`${cx * 12}px ${cy * 12}px`)
        }
      }

      // El patrón destella al doble de su opacidad y vuelve (igual con reduce: es luz)
      const [inicio, pico, fin] = patron[0].fotogramas.map((f) => Number(f.opacity))
      expect(inicio).toBeCloseTo(0.16, 2)
      expect(pico).toBeCloseTo(0.32, 2)
      expect(fin).toBeCloseTo(0.16, 2)
      expect(patron[0].opciones).toMatchObject({ duration: 500 })

      // Una sola tanda
      await page.clock.runFor(1000)
      expect(
        (await sonda(page)).llamadas.filter((l) => l.quien !== "marco")
      ).toHaveLength(5)

      // El rótulo nuevo entra en fundido (también con reduce) y el `p` anunciado es el mismo
      await expect(grupo).toHaveAttribute("data-redes-cambio", "")
      await expect(rotulo).toContainText("Instagram · 9:16")
      await expect(rotulo.locator(".m-swap")).toHaveCSS("animation-name", "fade-soft")
      expect(
        await rotulo.evaluate((el) => (el as unknown as { __mismo?: boolean }).__mismo)
      ).toBe(true)
      await expect
        .poll(async () =>
          (await sonda(page)).arranques.filter((a) => a.quien === "rotulo")
        )
        .not.toEqual([])
      for (const a of (await sonda(page)).arranques.filter((a) => a.quien === "rotulo")) {
        expect(a.nombre).toBe("fade-soft")
        expect(a.opacidad).toBe("0")
      }

      // Otro cambio con la tanda anterior aún en marcha: la cancela, no la acumula
      await elegir(3)
      await page.clock.runFor(ESPERA)
      expect(
        (await sonda(page)).llamadas.filter((l) => l.quien.startsWith("esquina-"))
      ).toHaveLength(8)
      const porEsquina = await grupo
        .locator("[data-crop-corner]")
        .evaluateAll((els) =>
          els.map(
            (el) =>
              el
                .getAnimations()
                .filter(
                  (a) => !(a instanceof CSSAnimation) && !(a instanceof CSSTransition)
                ).length
          )
        )
      for (const n of porEsquina) expect(n).toBeLessThanOrEqual(1)

      // Cambiar de red no suena
      expect(await page.evaluate(() => window.__clipealoSounds)).toEqual([])
    })

    test("el clip conserva 9:16 al elegir otra red", async ({ page }) => {
      await irA(page, "/")
      const grupo = escenario(page)
      await grupo.evaluate((el) =>
        el.scrollIntoView({ block: "center", behavior: "instant" })
      )
      const marco = grupo.locator("[data-redes-marco]")
      const antes = await marco.boundingBox()
      await botones(page).nth(4).click()
      await expect(grupo.locator("[aria-live]")).toContainText("LinkedIn · 9:16")
      const despues = await marco.boundingBox()
      expect(antes).not.toBeNull()
      expect(despues).not.toBeNull()
      expect(Math.abs(despues!.width - antes!.width)).toBeLessThanOrEqual(0.5)
      expect(Math.abs(despues!.x - antes!.x)).toBeLessThanOrEqual(0.5)
    })

    test("pasar el ratón por la lista de redes no desplaza el layout (CLS)", async ({
      page,
    }) => {
      test.skip(test.info().project.name === "movil", "sin ratón no hay hover")
      await page.addInitScript(() => {
        type Desplazamiento = PerformanceEntry & {
          value: number
          hadRecentInput: boolean
          sources?: { node?: Node | null }[]
        }
        const registro = { total: 0, escenario: 0, fuentes: [] as string[] }
        ;(window as unknown as { __clsRedes: typeof registro }).__clsRedes = registro
        new PerformanceObserver((lista) => {
          const seccion = document.getElementById("redes")
          const escena = document
            .querySelector("#redes [data-redes-marco]")
            ?.closest("[data-motion-group]")
          for (const entrada of lista.getEntries() as Desplazamiento[]) {
            if (entrada.hadRecentInput || !seccion) continue
            const propias = (entrada.sources ?? []).filter(
              (s) => s.node && seccion.contains(s.node)
            )
            if (!propias.length) continue
            registro.total += entrada.value
            if (propias.some((s) => s.node && escena?.contains(s.node))) {
              registro.escenario += entrada.value
            }
            for (const s of propias) {
              const el = s.node instanceof Element ? s.node : s.node?.parentElement
              registro.fuentes.push(
                `${entrada.value.toFixed(4)} ${el?.tagName.toLowerCase()}.${el?.getAttribute("class")?.slice(0, 50)}`
              )
            }
          }
        }).observe({ type: "layout-shift", buffered: true })
      })
      type Registro = { total: number; escenario: number; fuentes: string[] }
      const registro = () =>
        page.evaluate(() => (window as unknown as { __clsRedes: Registro }).__clsRedes)

      await irA(page, "/")
      await page
        .locator("#redes ul[aria-label]")
        .evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }))
      await esperarAnimaciones(page)
      await page.evaluate(() => {
        const r = (window as unknown as { __clsRedes: Registro }).__clsRedes
        r.total = 0
        r.escenario = 0
        r.fuentes = []
      })

      // Ida y vuelta por la lista, despacio, como quien lee las opciones
      const lista = botones(page)
      for (const i of [0, 1, 2, 3, 4, 5, 4, 3, 2, 1, 0]) {
        await lista.nth(i).hover()
        await page.waitForTimeout(reduce ? 250 : 600)
      }

      const cls = await registro()
      // El escenario conserva sus dimensiones al cambiar de destino
      expect(cls.escenario, cls.fuentes.join("\n")).toBeLessThan(0.001)
      expect(cls.total, cls.fuentes.join("\n")).toBeLessThan(0.02)
    })

    for (const idioma of ["/en", "/pt"] as const) {
      test(`en ${idioma} el titular termina entero y el rótulo cambia con fundido`, async ({
        page,
      }) => {
        await irA(page, idioma)
        const grupo = grupoTexto(page)
        const titular = grupo.locator("h2")
        await titular.evaluate((el) =>
          el.scrollIntoView({ block: "center", behavior: "instant" })
        )
        await expect(grupo).toHaveAttribute("data-motion-state", "play")
        await esperarAnimaciones(page)
        expect(
          (await sonda(page)).arranques.some(
            (a) => a.quien === "titular" && a.nombre === (reduce ? "fade-soft" : "cut-in")
          )
        ).toBe(true)
        await expect(titular).toHaveCSS("clip-path", "none")
        await expect(titular).toHaveCSS("opacity", "1")

        await botones(page).nth(3).click()
        const rotulo = page.locator("#redes [aria-live]")
        await expect(rotulo).toContainText("X · 9:16")
        await expect(rotulo.locator(".m-swap")).toHaveCSS("animation-name", "fade-soft")
        await expect(escenario(page)).toHaveAttribute("data-redes-cambio", "")
      })
    }
  })
}

test.describe("movimiento de Redes con la bandera ?movimiento=", () => {
  for (const [bandera, sistema, reducido] of [
    ["reducido", "no-preference", true],
    ["completo", "reduce", false],
  ] as const) {
    test(`?movimiento=${bandera} manda sobre el sistema (${sistema}) en el CSS y en el JS`, async ({
      page,
    }) => {
      await modoMovimiento(page, sistema)
      await instalarSondas(page)
      await irA(page, `/?movimiento=${bandera}`)

      const grupo = escenario(page)
      await grupo.evaluate((el) =>
        el.scrollIntoView({ block: "center", behavior: "instant" })
      )
      await expect(grupo).toHaveAttribute("data-motion-state", /^(play|static)$/)
      // CSS: el marco sigue la preferencia elegida
      await expect(grupo.locator(".m-redes-media")).toHaveCSS(
        "transition-duration",
        reducido ? "0s" : "0.5s"
      )

      // JS: el fundido del marco y las esquinas en su sitio, también según la bandera
      await botones(page).nth(4).click()
      await expect
        .poll(
          async () =>
            (await sonda(page)).llamadas.filter((l) => l.quien.startsWith("esquina-"))
              .length
        )
        .toBe(4)
      const { llamadas } = await sonda(page)
      expect(llamadas.filter((l) => l.quien === "marco")).toHaveLength(reducido ? 1 : 0)
      for (const l of llamadas.filter((l) => l.quien.startsWith("esquina-"))) {
        expect(l.opacidad, l.quien).toBe("0")
        expect(sinDesplazar(l.translate), `${l.quien}: ${l.translate}`).toBe(reducido)
      }
    })
  }
})
