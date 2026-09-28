import {
  parse,
  TYPE,
  type MessageFormatElement,
} from "@formatjs/icu-messageformat-parser"
import { describe, expect, it } from "vitest"

import es from "@/messages/es"
import en from "@/messages/en"
import pt from "@/messages/pt"
import { getFormat } from "@/lib/format"

type Tree = { [key: string]: string | Tree }

/** Aplana `{ a: { b: "x" } }` a `{ "a.b": "x" }`. */
function flatten(tree: Tree, prefix = ""): Record<string, string> {
  return Object.fromEntries(
    Object.entries(tree).flatMap(([key, value]) => {
      const path = prefix ? `${prefix}.${key}` : key
      return typeof value === "string"
        ? [[path, value]]
        : Object.entries(flatten(value, path))
    })
  )
}

/** Variables y etiquetas de un mensaje ICU: `{nombre}`, `{n, plural, …}`, `<b>…</b>`. */
function firma(elements: MessageFormatElement[], out = new Set<string>()) {
  for (const el of elements) {
    if (el.type === TYPE.literal || el.type === TYPE.pound) continue
    if (el.type === TYPE.tag) {
      out.add(`<${el.value}>`)
      firma(el.children, out)
      continue
    }
    out.add(el.value)
    if (el.type === TYPE.plural || el.type === TYPE.select) {
      for (const option of Object.values(el.options)) firma(option.value, out)
    }
  }
  return out
}

const IDIOMAS = { es, en, pt } as const
const planos = Object.fromEntries(
  Object.entries(IDIOMAS).map(([locale, messages]) => [locale, flatten(messages as Tree)])
) as Record<keyof typeof IDIOMAS, Record<string, string>>

const NEGACIONES = [
  "no publica por ti",
  "no publica por nadie",
  "doesn't publish for you",
  "does not publish for you",
  "não publica por você",
  "não publica por ninguém",
]

describe("mensajes de los tres idiomas", () => {
  it("conservan la marca de la cifra animada en Comunidad", () => {
    for (const mensajes of Object.values(planos)) {
      expect(mensajes["marketing.community.title"]).toMatch(/<b>[^<]+<\/b>/)
    }
  })

  it("no vuelven a decir que Clipealo no publica", () => {
    const culpables: string[] = []
    for (const [locale, mensajes] of Object.entries(planos))
      for (const [clave, texto] of Object.entries(mensajes)) {
        const plano = texto.toLowerCase()
        if (NEGACIONES.some((frase) => plano.includes(frase)))
          culpables.push(`${locale}: ${clave}`)
      }
    expect(culpables).toEqual([])
  })

  it("tienen exactamente las mismas claves", () => {
    const claves = Object.keys(planos.es).sort()
    expect(Object.keys(planos.en).sort()).toEqual(claves)
    expect(Object.keys(planos.pt).sort()).toEqual(claves)
  })

  it("son ICU válido y usan las mismas variables y etiquetas que el español", () => {
    const errores: string[] = []
    for (const [clave, texto] of Object.entries(planos.es)) {
      const referencia = [...firma(parse(texto))].sort()
      for (const locale of ["en", "pt"] as const) {
        const traducido = planos[locale][clave]
        if (traducido === undefined) continue
        try {
          const propia = [...firma(parse(traducido))].sort()
          if (propia.join() !== referencia.join()) {
            errores.push(`${locale} ${clave}: ${propia.join()} ≠ ${referencia.join()}`)
          }
        } catch (error) {
          errores.push(`${locale} ${clave}: ICU inválido (${(error as Error).message})`)
        }
      }
    }
    expect(errores).toEqual([])
  })

  it("no dejan textos vacíos", () => {
    const vacios = Object.entries(planos).flatMap(([locale, plano]) =>
      Object.entries(plano)
        .filter(([, texto]) => texto.trim() === "")
        .map(([clave]) => `${locale} ${clave}`)
    )
    expect(vacios).toEqual([])
  })
})

describe("formatos por idioma", () => {
  it("dinero: símbolo de la web y separadores de cada idioma", () => {
    expect(getFormat("es").money(1633)).toBe("US$ 1.633")
    expect(getFormat("en").money(1633)).toBe("US$1,633")
    expect(getFormat("pt").money(1633)).toBe("US$ 1.633")
    expect(getFormat("en").money(9.17)).toBe("US$9.17")
    expect(getFormat("pt").money(9.17)).toBe("US$ 9,17")
  })

  it("porcentajes y variaciones", () => {
    expect(getFormat("es").percent(64.5, 1)).toBe("64,5 %")
    expect(getFormat("en").percent(64.5, 1)).toBe("64.5%")
    expect(getFormat("pt").delta(-3)).toBe("−3%")
    expect(getFormat("en").delta(12.4)).toBe("+12.4%")
  })

  it("meses en el idioma", () => {
    expect(getFormat("en").month("2026-09")).toBe("September 2026")
    expect(getFormat("pt").month("2026-09", { capital: true })).toBe("Setembro de 2026")
    expect(getFormat("en").monthShort("2026-09")).toBe("Sep")
    expect(getFormat("pt").monthShort("2026-09")).toBe("set")
  })

  it("compactos y bytes", () => {
    expect(getFormat("en").compact(12_400)).toBe("12.4K")
    expect(getFormat("pt").compact(12_400)).toMatch(/12,4/)
    expect(getFormat("en").bytes(1536)).toBe("1.5 KB")
  })
})
