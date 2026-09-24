import * as React from "react"
import { act } from "react"
import { hydrateRoot } from "react-dom/client"
import { renderToString } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { render } from "@testing-library/react"

import { TypeWords, trocearPalabras } from "@/components/shared/type-words"
import es from "@/messages/es"
import en from "@/messages/en"
import pt from "@/messages/pt"

const NBSP = " "
const NNBSP = " "

/** La cita de Features en cada idioma y cuántas palabras tiene. */
const CITAS = [
  { idioma: "es", texto: es.marketing.features.quote.text, palabras: 7 },
  { idioma: "en", texto: en.marketing.features.quote.text, palabras: 5 },
  { idioma: "pt", texto: pt.marketing.features.quote.text, palabras: 6 },
] as const

function pintar(ui: React.ReactElement) {
  const { container } = render(<p>{ui}</p>)
  const visible = container.querySelector<HTMLElement>("[aria-hidden]")!
  const palabras = Array.from(visible.querySelectorAll<HTMLElement>(".m-word"))
  return { container, visible, palabras }
}

describe("trocearPalabras", () => {
  it("parte por espacios y conserva cada separador tal cual", () => {
    expect(trocearPalabras("Las ideas\tno\n valen")).toEqual([
      { palabra: "Las", separador: " " },
      { palabra: "ideas", separador: "\t" },
      { palabra: "no", separador: "\n " },
      { palabra: "valen", separador: "" },
    ])
  })

  it("los espacios duros no parten: la cifra y su unidad son una sola palabra", () => {
    const texto = `Hasta 18${NBSP}% más con 6,8${NNBSP}millones`
    expect(trocearPalabras(texto).map((p) => p.palabra)).toEqual([
      "Hasta",
      `18${NBSP}%`,
      "más",
      "con",
      `6,8${NNBSP}millones`,
    ])
  })

  it("recorta los extremos y un texto vacío no tiene palabras", () => {
    expect(trocearPalabras("  Hola mundo \n")).toEqual([
      { palabra: "Hola", separador: " " },
      { palabra: "mundo", separador: "" },
    ])
    expect(trocearPalabras("")).toEqual([])
    expect(trocearPalabras(" \n\t")).toEqual([])
  })

  it("una sola palabra", () => {
    expect(trocearPalabras("Clipealo")).toEqual([{ palabra: "Clipealo", separador: "" }])
  })
})

describe("TypeWords", () => {
  for (const { idioma, texto, palabras } of CITAS) {
    it(`pinta un span por palabra con la cita en ${idioma} (${palabras} palabras)`, () => {
      const { visible, palabras: spans } = pintar(<TypeWords text={texto} />)

      expect(spans).toHaveLength(palabras)
      // Los espacios van fuera de los span y el texto visible es el original
      expect(visible.textContent).toBe(texto)
      for (const span of spans) expect(span.textContent).not.toMatch(/\s/)
      // Escalonado por índice, sin huecos
      expect(spans.map((s) => s.style.getPropertyValue("--i"))).toEqual(
        spans.map((_, i) => String(i))
      )
    })
  }

  it("funciona con 5, 6 y 7 palabras: el escalonado sale del índice", () => {
    for (const n of [5, 6, 7]) {
      const texto = Array.from({ length: n }, (_, i) => `palabra${i}`).join(" ")
      const { palabras } = pintar(<TypeWords text={texto} />)
      expect(palabras).toHaveLength(n)
      expect(palabras.at(-1)!.style.getPropertyValue("--i")).toBe(String(n - 1))
    }
  })

  it("el lector de pantalla lee la frase una sola vez", () => {
    const texto = es.marketing.features.quote.text
    const { container, visible } = pintar(<TypeWords text={texto} />)

    const leida = container.querySelectorAll(".sr-only")
    expect(leida).toHaveLength(1)
    expect(leida[0].textContent).toBe(texto)
    expect(visible).toHaveAttribute("aria-hidden", "true")
    // Todas las palabras animadas quedan dentro de la parte oculta al lector
    expect(container.querySelectorAll(".m-word")).toHaveLength(
      visible.querySelectorAll(".m-word").length
    )
  })

  it("conserva los espacios duros en lo que se ve", () => {
    const texto = `Clip 9:16${NBSP}listo en 18${NBSP}%`
    const { visible, palabras } = pintar(<TypeWords text={texto} />)
    expect(visible.textContent).toBe(texto)
    expect(palabras.map((p) => p.textContent)).toEqual([
      "Clip",
      `9:16${NBSP}listo`,
      "en",
      `18${NBSP}%`,
    ])
  })

  it("el momento y el escalonado van en variables del contenedor", () => {
    const { visible } = pintar(<TypeWords text="Una frase corta" />)
    expect(visible.style.getPropertyValue("--m-at")).toBe("250ms")
    expect(visible.style.getPropertyValue("--stagger")).toBe("70ms")

    const { visible: propio } = pintar(
      <TypeWords text="Otra frase" at="var(--m-fin-entrada, 250ms)" stagger="60ms" />
    )
    expect(propio.style.getPropertyValue("--m-at")).toBe("var(--m-fin-entrada, 250ms)")
    expect(propio.style.getPropertyValue("--stagger")).toBe("60ms")
  })

  it("cada palabra lleva las clases del grupo de movimiento", () => {
    const { palabras } = pintar(<TypeWords text="Ideas are worthless" />)
    for (const span of palabras) {
      expect(span).toHaveClass("m-anim", "m-word")
    }
  })

  it("el HTML del servidor hidrata sin avisos en los tres idiomas", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {})
    try {
      for (const { texto } of CITAS) {
        const ui = <TypeWords text={texto} at="var(--m-fin-entrada, 250ms)" />
        const contenedor = document.createElement("p")
        contenedor.innerHTML = renderToString(ui)
        document.body.appendChild(contenedor)
        const antes = contenedor.innerHTML

        let raiz: ReturnType<typeof hydrateRoot> | undefined
        await act(async () => {
          raiz = hydrateRoot(contenedor, ui, {
            onRecoverableError: (e) => {
              throw e
            },
          })
        })
        expect(contenedor.innerHTML).toBe(antes)
        act(() => raiz!.unmount())
        contenedor.remove()
      }
      expect(error).not.toHaveBeenCalled()
    } finally {
      error.mockRestore()
    }
  })
})
