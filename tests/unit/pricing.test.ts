import { describe, expect, it } from "vitest"

import en from "@/messages/en"
import es from "@/messages/es"
import pt from "@/messages/pt"
import {
  EXTRA_HOUR_MAX,
  EXTRA_HOUR_PRICE_PEN,
  EXTRA_HOUR_PRICE_USD,
  FEATURE_GROUPS,
  PLANS,
} from "@/lib/pricing"

describe("datos públicos de planes", () => {
  it("mantiene las cuatro cuotas mensuales publicadas", () => {
    expect(PLANS.map(({ id, includedMinutes }) => [id, includedMinutes])).toEqual([
      ["free", 30],
      ["basic", 300],
      ["standard", 600],
      ["premium", 1200],
    ])
  })

  it("refleja los plazos de almacenamiento configurados en los tres idiomas", () => {
    const almacenamiento = {
      free: "1 semana",
      basic: "1 mes",
      standard: "3 meses",
      premium: "3 meses",
    }

    expect(es.pricing.values.storage).toEqual(almacenamiento)
    expect(en.pricing.values.storage).toEqual({
      free: "1 week",
      basic: "1 month",
      standard: "3 months",
      premium: "3 months",
    })
    expect(pt.pricing.values.storage).toEqual({
      free: "1 semana",
      basic: "1 mês",
      standard: "3 meses",
      premium: "3 meses",
    })
  })

  it("limita la comparativa a funciones con disponibilidad comprobada por plan", () => {
    const ids = FEATURE_GROUPS.flatMap(({ rows }) => rows.map(({ id }) => id))

    expect(ids).toEqual([
      "videoHours",
      "videoSources",
      "noWatermark",
      "downloadQuality",
      "storage",
      "exportFormats",
      "publishNetworks",
    ])
  })

  it("mantiene el precio cotizado y el tope de horas extra", () => {
    expect(EXTRA_HOUR_PRICE_PEN).toBe(5)
    expect(EXTRA_HOUR_PRICE_USD).toBe(1.5)
    expect(EXTRA_HOUR_MAX).toBe(100)
  })
})
