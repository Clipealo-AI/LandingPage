import { describe, expect, it } from "vitest"

import {
  clamp,
  formatBytes,
  formatCompact,
  formatDuration,
  formatList,
  formatPercent,
  getFormat,
  formatTimecode,
} from "@/lib/format"

describe("formatTimecode", () => {
  it("omite la hora en videos cortos", () => {
    expect(formatTimecode(65)).toBe("1:05")
    expect(formatTimecode(9)).toBe("0:09")
  })

  it("incluye la hora cuando la duracion la alcanza", () => {
    expect(formatTimecode(3725)).toBe("1:02:05")
  })

  it("fuerza la hora cuando el video de referencia dura mas de una", () => {
    expect(formatTimecode(65, { forceHours: true })).toBe("0:01:05")
  })

  it("añade milisegundos para el recorte fino", () => {
    expect(formatTimecode(65.4, { millis: true })).toBe("1:05.400")
  })

  it("nunca devuelve tiempos negativos", () => {
    expect(formatTimecode(-30)).toBe("0:00")
  })
})

describe("formatDuration", () => {
  it("usa segundos por debajo del minuto", () => {
    expect(formatDuration(45)).toBe("45 s")
  })

  it("omite los segundos cuando son cero", () => {
    expect(formatDuration(120)).toBe("2 min")
  })

  it("rellena los segundos a dos cifras", () => {
    expect(formatDuration(125)).toBe("2 min 05 s")
  })

  it("pasa a horas por encima de los 60 minutos", () => {
    expect(formatDuration(3660)).toBe("1 h 01 min")
  })
})

describe("formatBytes", () => {
  it("usa coma decimal, como el resto de la interfaz en español", () => {
    expect(formatBytes(1536)).toBe("1,5 KB")
  })

  it("no pone decimales en bytes sueltos", () => {
    expect(formatBytes(512)).toBe("512 B")
  })

  it("tolera el cero", () => {
    expect(formatBytes(0)).toBe("0 B")
  })

  it("no se sale de la tabla de unidades", () => {
    expect(formatBytes(1024 ** 5)).toContain("TB")
  })
})

describe("helpers numericos", () => {
  it("clamp acota por ambos extremos", () => {
    expect(clamp(5, 0, 3)).toBe(3)
    expect(clamp(-5, 0, 3)).toBe(0)
  })

  it("formatPercent usa coma decimal", () => {
    expect(formatPercent(64.5, 1)).toBe("64,5 %")
  })

  it("formatCompact abrevia miles", () => {
    expect(formatCompact(12_400)).toMatch(/12,4/)
  })
})

describe("list", () => {
  it("une en prosa con la conjunción de cada idioma", () => {
    expect(formatList(["PayPal", "Transferencia bancaria", "Yape"])).toBe(
      "PayPal, Transferencia bancaria y Yape"
    )
    expect(getFormat("en").list(["PayPal", "Bank transfer", "Yape"])).toBe(
      "PayPal, Bank transfer, and Yape"
    )
    expect(getFormat("pt").list(["PayPal", "Transferência bancária", "Yape"])).toBe(
      "PayPal, Transferência bancária e Yape"
    )
  })

  it("dos, uno o ninguno, y la disyunción", () => {
    expect(formatList(["PayPal", "Transferencia"])).toBe("PayPal y Transferencia")
    expect(formatList(["TikTok"])).toBe("TikTok")
    expect(formatList([])).toBe("")
    expect(getFormat("es").list(["TikTok", "YouTube", "X"], "disjunction")).toBe(
      "TikTok, YouTube o X"
    )
    expect(getFormat("en").list(["TikTok", "YouTube"], "disjunction")).toBe(
      "TikTok or YouTube"
    )
    expect(getFormat("pt").list(["TikTok", "YouTube"], "disjunction")).toBe(
      "TikTok ou YouTube"
    )
  })
})
