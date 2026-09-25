import { expect, test, type Locator, type Page } from "@playwright/test"

import esMarketing from "../../messages/es/marketing.json"
import enMarketing from "../../messages/en/marketing.json"
import ptMarketing from "../../messages/pt/marketing.json"
import { irA, modoMovimiento } from "./helpers"

/**
 * Movimiento de Features y Steps (Lote 3): titulares cortados a 12 fps (E5),
 * tarjetas que entran por filas y sus gestos (E9), la luz bajo el puntero
 * (E11) y los pasos que se encienden en orden
 * (E12).
 *
 * Todo corre en los dos modos: el director revisa con las animaciones de Windows
 * apagadas, que Chrome traduce a reduce. Con reduce no basta con que nada se
 * desplace (eso lo guarda movimiento.spec.ts): cada efecto tiene que seguir
 * viéndose, así que se compara su primer fotograma con el estado natural.
 *
 * Para medir sin carreras, cada grupo se reinicia desde cero y sus animaciones
 * se congelan en una fracción de su parte activa (`reproducirCongelado`).
 */

const MODOS = ["no-preference", "reduce"] as const

const IDIOMAS_SUBTITULOS = ["ES", "EN", "PT"]

const LOCALES = [
  { ruta: "/", m: esMarketing },
  { ruta: "/en", m: enMarketing },
  { ruta: "/pt", m: ptMarketing },
] as const

/** Ningún gesto de entrada dura más: AGENTS.md, regla 5. */
const GESTO_MAX = 1500

type Animacion = {
  nombre: string
  /** La animación es del propio elemento del grupo (no de un descendiente). */
  grupo: boolean
  pseudo: string | null
  clase: string
  esquina: string | null
  slot: string | null
  texto: string
  retardo: number
  activa: number
  fin: number
}

type Estilo = {
  opacity: string
  translate: string
  scale: string
  clipPath: string
  color: string
  backgroundColor: string
  borderRightColor: string
  animationName: string
}

const desplaza = (valor: string) =>
  valor !== "none" &&
  valor
    .trim()
    .split(/\s+/)
    .some((v) => parseFloat(v) !== 0)

const escala = (valor: string) =>
  valor !== "none" &&
  valor
    .trim()
    .split(/\s+/)
    .some((v) => parseFloat(v) !== 1)

/**
 * Reinicia el grupo desde cero (pasa por «static», que quita sus animaciones, y
 * vuelve a «play») y congela cada animación CSS del subárbol, pseudo-elementos
 * incluidos, en `retardo + fracción × parte activa`. Devuelve qué corre y cuándo.
 */
function reproducirCongelado(grupo: Locator, fraccion: number) {
  return grupo.evaluate((el: HTMLElement, fraccion: number): Animacion[] => {
    el.style.removeProperty("--m-wait")
    el.dataset.motionState = "static"
    void el.offsetHeight
    el.dataset.motionState = "play"
    return el
      .getAnimations({ subtree: true })
      .filter((a): a is CSSAnimation => a instanceof CSSAnimation)
      .map((a) => {
        const efecto = a.effect as KeyframeEffect
        const tiempo = efecto.getComputedTiming()
        const retardo = Number(tiempo.delay ?? 0)
        const activa = Number(tiempo.activeDuration ?? 0)
        a.pause()
        a.currentTime = retardo + activa * fraccion
        const objetivo = efecto.target as Element
        return {
          nombre: a.animationName,
          grupo: objetivo === el,
          pseudo: efecto.pseudoElement ?? null,
          clase: objetivo.getAttribute("class") ?? "",
          esquina: objetivo.getAttribute("data-crop-corner"),
          slot: objetivo.getAttribute("data-slot"),
          texto: (objetivo.textContent ?? "").trim(),
          retardo,
          activa,
          fin: Number(tiempo.endTime),
        }
      })
  }, fraccion)
}

/** Lleva al final todas las animaciones del grupo: queda el estado natural. */
function terminar(grupo: Locator) {
  return grupo.evaluate((el) => {
    for (const a of el.getAnimations({ subtree: true })) a.finish()
  })
}

/** Estilos calculados de todos los elementos del locator (o de su pseudo). */
function estilos(loc: Locator, pseudo: string | null = null) {
  return loc.evaluateAll(
    (els, pseudo): Estilo[] =>
      els.map((el) => {
        const cs = getComputedStyle(el, pseudo)
        return {
          opacity: cs.opacity,
          translate: cs.translate,
          scale: cs.scale,
          clipPath: cs.clipPath,
          color: cs.color,
          backgroundColor: cs.backgroundColor,
          borderRightColor: cs.borderRightColor,
          animationName: cs.animationName,
        }
      }),
    pseudo
  )
}

/** Color calculado de un token en el contexto de un elemento. */
function colorDeToken(loc: Locator, token: string) {
  return loc.evaluate((el, token) => {
    const sonda = document.createElement("span")
    sonda.style.color = `var(${token})`
    el.appendChild(sonda)
    const color = getComputedStyle(sonda).color
    sonda.remove()
    return color
  }, token)
}

async function llevarAPantalla(grupo: Locator) {
  await grupo.evaluate((el) =>
    el.scrollIntoView({ block: "center", behavior: "instant" })
  )
  await expect(grupo).toHaveAttribute("data-motion-state", "play")
}

const esEscritorio = (page: Page) => (page.viewportSize()?.width ?? 0) >= 768

function localizar(page: Page, m: typeof esMarketing = esMarketing) {
  const producto = page.locator("#producto")
  const tarjetas = producto.locator("article")
  const tarjeta = (titulo: string) =>
    tarjetas.filter({ has: page.getByRole("heading", { name: titulo, exact: true }) })
  const pasos = page.locator("main section").filter({ has: page.locator("ol") })
  return {
    producto,
    tarjetas,
    cabecera: producto.locator("div[data-motion-group]"),
    ia: tarjeta(m.features.ai.title),
    vertical: tarjeta(m.features.vertical.title),
    subtitulos: tarjeta(m.features.captions.title),
    todo: tarjeta(m.features.allInOne.title),
    pasos,
    tituloPasos: pasos.locator("h2[data-motion-group]"),
    paso: pasos.locator("li[data-motion-group]"),
  }
}

/** Retardos crecientes con un paso fijo (medio milisegundo de margen). */
function expectEscalonado(animaciones: Animacion[], paso: number) {
  for (let i = 1; i < animaciones.length; i++) {
    expect(animaciones[i].retardo - animaciones[i - 1].retardo).toBeCloseTo(paso, 0)
  }
}

/** La entrada del propio grupo (la tarjeta que sube). */
function entradaDe(animaciones: Animacion[]) {
  const entrada = animaciones.find((a) => a.grupo && a.nombre === "rise-in")
  expect(entrada, "la tarjeta no tiene su entrada").toBeDefined()
  return entrada!
}

const finDe = (a: Animacion) => a.retardo + a.activa

for (const modo of MODOS) {
  const reduce = modo === "reduce"

  test.describe(`Features y Steps (reduced-motion: ${modo})`, () => {
    test.beforeEach(async ({ page }) => {
      await modoMovimiento(page, modo)
    })

    test("cada tarjeta, cada paso y los titulares esperan fuera de pantalla y se reproducen al llegar", async ({
      page,
    }) => {
      await irA(page, "/")
      const l = localizar(page)
      await expect(l.tarjetas).toHaveCount(4)
      await expect(l.paso).toHaveCount(3)

      const grupos = [
        l.cabecera,
        ...(await l.tarjetas.all()),
        l.tituloPasos,
        ...(await l.paso.all()),
      ]
      // Todos quedan por debajo del reencuadre: esperan, ocultos y en pausa
      for (const grupo of grupos) {
        await expect(grupo).toHaveAttribute("data-motion-state", "idle")
      }
      await expect(l.ia).toHaveCSS("opacity", "0")
      // Solo las animaciones del movimiento: en oscuro, el cambio de tema al
      // hidratar lanza una transición (`transition-all` de la barra) que no es suya
      expect(
        await l.ia.evaluate((el) =>
          el
            .getAnimations({ subtree: true })
            .filter((a) => a instanceof CSSAnimation)
            .map((a) => a.playState)
        )
      ).not.toContain("running")

      for (const grupo of grupos) await llevarAPantalla(grupo)
    })

    test("E9 · las tarjetas entran por filas: la de la derecha, 80 ms después en escritorio", async ({
      page,
    }) => {
      await irA(page, "/")
      const l = localizar(page)
      const escritorio = esEscritorio(page)
      // Orden de la rejilla: IA, Vertical | Subtítulos, Todo en uno
      const esperados = escritorio ? [0, 80, 80, 160] : [0, 0, 0, 0]

      const tarjetas = await l.tarjetas.all()
      for (const [n, tarjeta] of tarjetas.entries()) {
        await llevarAPantalla(tarjeta)
        const entrada = entradaDe(await reproducirCongelado(tarjeta, 0))
        expect(entrada.retardo).toBeCloseTo(esperados[n], 0)
        expect(entrada.activa).toBeCloseTo(520, 0)

        // Primer fotograma: invisible. Sube sin reduce; con reduce, fundido en su sitio
        const [inicio] = await estilos(tarjeta)
        expect(Number(inicio.opacity)).toBeLessThan(0.05)
        expect(desplaza(inicio.translate)).toBe(!reduce)

        // Al 10 % de la entrada se está fundiendo, también con reduce: el efecto se ve
        await reproducirCongelado(tarjeta, 0.1)
        const [medio] = await estilos(tarjeta)
        expect(Number(medio.opacity)).toBeGreaterThan(0.05)
        expect(Number(medio.opacity)).toBeLessThan(0.95)

        await terminar(tarjeta)
        const [final] = await estilos(tarjeta)
        expect(final.opacity).toBe("1")
        expect(desplaza(final.translate)).toBe(false)
      }
    })

    test("E9 · Vertical: el 16:9 se apaga y después se cierran las esquinas del 9:16", async ({
      page,
    }) => {
      await irA(page, "/")
      const { vertical } = localizar(page)
      await llevarAPantalla(vertical)
      const horizontal = vertical.locator(".m-dim")
      const esquinas = vertical.locator("[data-crop-corner]")
      await expect(esquinas).toHaveCount(4)

      const animaciones = await reproducirCongelado(vertical, 0)
      const entrada = entradaDe(animaciones)
      const apagado = animaciones.find((a) => a.nombre === "dim-in")
      const cierres = animaciones
        .filter((a) => a.nombre === "crop-close")
        .sort((a, b) => a.retardo - b.retardo)

      expect(apagado, "el 16:9 no se apaga").toBeDefined()
      expect(apagado!.retardo).toBeGreaterThanOrEqual(finDe(entrada) - 1)
      expect(apagado!.fin).toBeLessThan(GESTO_MAX)

      expect(cierres.map((c) => c.esquina)).toEqual(["tl", "tr", "br", "bl"])
      expect(cierres[0].retardo).toBeGreaterThan(apagado!.retardo)
      expectEscalonado(cierres, 60)
      for (const cierre of cierres) expect(cierre.fin).toBeLessThan(GESTO_MAX)

      // Primer fotograma: el 16:9 a plena opacidad y las esquinas sin pintar. Sin
      // reduce llegan desde fuera; con reduce, en su sitio
      const [inicioHorizontal] = await estilos(horizontal)
      expect(inicioHorizontal.opacity).toBe("1")
      for (const esquina of await estilos(esquinas)) {
        expect(esquina.opacity).toBe("0")
        expect(desplaza(esquina.translate)).toBe(!reduce)
      }

      // Al 10 % de su cierre, las esquinas se están fundiendo también con reduce
      await reproducirCongelado(vertical, 0.1)
      for (const esquina of await estilos(esquinas)) {
        expect(Number(esquina.opacity)).toBeGreaterThan(0.05)
        expect(Number(esquina.opacity)).toBeLessThan(0.95)
      }

      await terminar(vertical)
      const [finalHorizontal] = await estilos(horizontal)
      expect(Number(finalHorizontal.opacity)).toBeCloseTo(0.7, 2)
      for (const esquina of await estilos(esquinas)) {
        expect(esquina.opacity).toBe("1")
        expect(desplaza(esquina.translate)).toBe(false)
      }
    })

    test("E9 · Subtítulos: los 3 idiomas de muestra se iluminan en orden", async ({
      page,
    }) => {
      await irA(page, "/")
      const { subtitulos } = localizar(page)
      await llevarAPantalla(subtitulos)
      const idiomas = subtitulos.locator('[data-slot="badge"]')

      await terminar(subtitulos)
      const naturales = await estilos(idiomas)

      const animaciones = await reproducirCongelado(subtitulos, 0)
      const entrada = entradaDe(animaciones)
      const luces = animaciones
        .filter((a) => a.nombre === "light-up")
        .sort((a, b) => a.retardo - b.retardo)

      expect(luces).toHaveLength(3)
      expect(luces.map((l) => l.texto)).toEqual(IDIOMAS_SUBTITULOS)
      expect(luces[0].retardo).toBeGreaterThanOrEqual(finDe(entrada) - 1)
      expectEscalonado(luces, 60)
      expect(Math.max(...luces.map((l) => l.fin))).toBeLessThan(GESTO_MAX)

      // En el pico de su luz, cada idioma cambia de color (igual con reduce)
      await reproducirCongelado(subtitulos, 0.5)
      const encendidos = await estilos(idiomas)
      for (const [n, idioma] of encendidos.entries()) {
        expect(idioma.color, IDIOMAS_SUBTITULOS[n]).not.toBe(naturales[n].color)
        expect(idioma.backgroundColor, IDIOMAS_SUBTITULOS[n]).not.toBe(
          naturales[n].backgroundColor
        )
      }

      await terminar(subtitulos)
      expect(await estilos(idiomas)).toEqual(naturales)
    })

    for (const { ruta, m } of LOCALES) {
      test(`E5 · los titulares de Features y Steps se cortan a 12 fps, o se funden con reduce (${ruta})`, async ({
        page,
      }) => {
        await irA(page, ruta)
        const l = localizar(page, m)

        // En Features el grupo es la cabecera; en Steps, el propio titular
        const titulares = [
          { grupo: l.cabecera, h2: l.cabecera.locator("h2") },
          { grupo: l.tituloPasos, h2: l.tituloPasos },
        ]
        for (const { grupo, h2 } of titulares) {
          await llevarAPantalla(grupo)
          await expect(h2).toHaveClass(/\bm-cut\b/)
          const primary = await colorDeToken(h2, "--primary")

          const animaciones = await reproducirCongelado(grupo, 0)
          const delTitular = animaciones.filter((a) => a.clase.includes("m-cut"))
          const nombres = delTitular.map((a) => `${a.nombre}${a.pseudo ?? ""}`).sort()
          for (const a of delTitular) expect(a.fin).toBeLessThan(GESTO_MAX)

          const [inicio] = await estilos(h2)
          if (reduce) {
            // Sin cuchilla ni recorte: un fundido en su sitio que se ve
            expect(nombres).toEqual(["fade-soft"])
            expect(inicio.opacity).toBe("0")
            expect(inicio.clipPath).toBe("none")
          } else {
            expect(nombres).toEqual(["cut-blade::after", "cut-in"])
            expect(inicio.clipPath).toMatch(/^inset\(/)
            // La cuchilla va en primary: nada naranja nuevo
            const [cuchilla] = await estilos(h2, "::after")
            expect(cuchilla.borderRightColor).toBe(primary)
          }

          // A mitad del corte o del fundido, el titular está a medias
          await reproducirCongelado(grupo, 0.5)
          const [medio] = await estilos(h2)
          if (reduce) {
            expect(Number(medio.opacity)).toBeGreaterThan(0.05)
            expect(Number(medio.opacity)).toBeLessThan(1)
          } else {
            expect(medio.clipPath).toMatch(/^inset\(/)
            expect(medio.clipPath).not.toBe(inicio.clipPath)
          }

          await terminar(grupo)
          const [final] = await estilos(h2)
          expect(final.opacity).toBe("1")
          expect(final.clipPath).toBe("none")
        }

        // En Features, antetítulo y entradilla suben alrededor del titular
        const cabecera = await reproducirCongelado(l.cabecera, 0)
        const subidas = cabecera
          .filter((a) => a.nombre === "rise-in")
          .map((a) => a.retardo)
          .sort((a, b) => a - b)
        expect(subidas).toHaveLength(2)
        expect(subidas[0]).toBeCloseTo(0, 0)
        expect(subidas[1]).toBeCloseTo(160, 0)
        await terminar(l.cabecera)
      })
    }

    test("E12 · los pasos se encienden en orden: marco, número y esquinas del 02", async ({
      page,
    }) => {
      await irA(page, "/")
      const { paso } = localizar(page)
      const escritorio = esEscritorio(page)

      for (const [n, item] of (await paso.all()).entries()) {
        await llevarAPantalla(item)
        const i = escritorio ? n : 0
        const marco = item.locator(".m-rise")
        const numero = item.locator(".m-pop")

        const animaciones = await reproducirCongelado(item, 0)
        const subida = animaciones.find((a) => a.nombre === "rise-in")
        const pop = animaciones.find((a) => a.nombre === "pop")
        expect(subida, "el marco no sube").toBeDefined()
        expect(pop, "el número no hace pop").toBeDefined()
        expect(subida!.retardo).toBeCloseTo(i * 80, 0)
        expect(pop!.retardo).toBeCloseTo(250 + i * 80, 0)
        expect(pop!.fin).toBeLessThan(GESTO_MAX)

        // Primer fotograma invisible; sin reduce sube y escala, con reduce solo se funde
        const [marcoInicio] = await estilos(marco)
        const [numeroInicio] = await estilos(numero)
        expect(marcoInicio.opacity).toBe("0")
        expect(numeroInicio.opacity).toBe("0")
        expect(desplaza(marcoInicio.translate)).toBe(!reduce)
        expect(escala(numeroInicio.scale)).toBe(!reduce)

        const cierres = animaciones
          .filter((a) => a.nombre === "crop-close")
          .sort((a, b) => a.retardo - b.retardo)
        if (n === 1) {
          // Único gesto de marca de recorte de la sección, al terminar la entrada
          expect(cierres.map((c) => c.esquina)).toEqual(["tl", "tr", "br", "bl"])
          expect(cierres[0].retardo).toBeGreaterThanOrEqual(finDe(subida!) - 1)
          expectEscalonado(cierres, 60)
          for (const cierre of cierres) expect(cierre.fin).toBeLessThan(GESTO_MAX)
          for (const esquina of await estilos(item.locator("[data-crop-corner]"))) {
            expect(esquina.opacity).toBe("0")
            expect(desplaza(esquina.translate)).toBe(!reduce)
          }
        } else {
          expect(cierres).toEqual([])
        }

        // Al 10 %, el marco y el número se están fundiendo también con reduce
        await reproducirCongelado(item, 0.1)
        const [marcoMedio] = await estilos(marco)
        const [numeroMedio] = await estilos(numero)
        expect(Number(marcoMedio.opacity)).toBeGreaterThan(0.05)
        expect(Number(marcoMedio.opacity)).toBeLessThan(0.95)
        expect(Number(numeroMedio.opacity)).toBeGreaterThan(0.05)

        await terminar(item)
        const [marcoFinal] = await estilos(marco)
        const [numeroFinal] = await estilos(numero)
        expect(marcoFinal.opacity).toBe("1")
        expect(numeroFinal.opacity).toBe("1")
        expect(escala(numeroFinal.scale)).toBe(false)
      }
    })

    test("E11 · luz bajo el puntero en las tarjetas claras y en la de tinta", async ({
      page,
    }) => {
      await irA(page, "/")
      const l = localizar(page)

      await expect(l.ia).toHaveAttribute("data-light", "claro")
      await expect(l.vertical).toHaveAttribute("data-light", "tinta")
      await expect(l.subtitulos).toHaveAttribute("data-light", "claro")
      await expect(l.todo).toHaveAttribute("data-light", "claro")

      // Solo con ratón: en táctil no hay puntero que seguir
      test.skip(test.info().project.name === "movil", "sin hover en táctil")

      const intensidad = (tarjeta: Locator) =>
        tarjeta.evaluate((el) =>
          getComputedStyle(el).getPropertyValue("--light-strength").trim()
        )

      await llevarAPantalla(l.ia)
      await l.ia.hover()
      await expect(l.ia).toHaveAttribute("data-lit", "")
      await expect.poll(() => intensidad(l.ia)).toBe("9%")
      expect(await l.ia.evaluate((el) => getComputedStyle(el).backgroundImage)).toContain(
        "radial-gradient"
      )

      // Es luz, no movimiento: con reduce se queda igual
      await llevarAPantalla(l.vertical)
      await l.vertical.hover()
      await expect(l.vertical).toHaveAttribute("data-lit", "")
      await expect(l.ia).not.toHaveAttribute("data-lit")
      await expect.poll(() => intensidad(l.vertical)).toBe("7%")
    })
  })
}

test.describe("Features y Steps sin JavaScript", () => {
  test.use({ javaScriptEnabled: false })

  for (const modo of MODOS) {
    test(`todo se ve terminado (reduced-motion: ${modo})`, async ({ page }) => {
      await modoMovimiento(page, modo)
      // Sin JS no hay hidratación que esperar: `irA` se quedaría colgado
      await page.goto("/", { waitUntil: "load" })
      const l = localizar(page)

      await expect(l.producto.locator("[data-motion-state]")).toHaveCount(0)
      await expect(l.pasos.locator("[data-motion-state]")).toHaveCount(0)

      await expect(l.vertical.locator(".m-dim")).toHaveCSS("opacity", "0.7")
      await expect(l.producto.locator("h2")).toHaveCSS("clip-path", "none")
      await expect(l.pasos.locator("h2")).toHaveCSS("opacity", "1")
    })
  }
})
