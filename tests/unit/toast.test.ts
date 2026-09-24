import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("sonner", () => {
  const base = vi.fn(() => "neutro")
  return {
    toast: Object.assign(base, {
      success: vi.fn(() => "exito"),
      error: vi.fn(() => "error"),
      info: vi.fn(() => "info"),
      warning: vi.fn(() => "aviso"),
      dismiss: vi.fn(),
    }),
  }
})
vi.mock("@/lib/sound", () => ({ playSound: vi.fn() }))
vi.mock("@/lib/effects", () => ({ burst: vi.fn(), shake: vi.fn() }))

const { toast: sonner } = await import("sonner")
const { playSound } = await import("@/lib/sound")
const { toast } = await import("@/lib/toast")

beforeEach(() => {
  vi.clearAllMocks()
})

describe("toast con sonido", () => {
  it("el aviso neutro informa sin sonar", () => {
    expect(toast("Preparando descarga…")).toBe("neutro")
    expect(playSound).not.toHaveBeenCalled()
  })

  it("success suena a éxito y no pasa `sound` a sonner", () => {
    toast.success("Ajustes guardados", { description: "9:16" })
    expect(playSound).toHaveBeenCalledWith("success")
    expect(sonner.success).toHaveBeenCalledWith("Ajustes guardados", {
      description: "9:16",
    })
  })

  it("error suena a error", () => {
    toast.error("No se pudo reintentar")
    expect(playSound).toHaveBeenCalledWith("error")
  })

  it("celebrate es un éxito con sonido de hito", () => {
    toast.celebrate("Clip enviado a publicación")
    expect(playSound).toHaveBeenCalledWith("celebrate")
    expect(sonner.success).toHaveBeenCalledWith("Clip enviado a publicación", {})
  })

  it("`sound` cambia el sonido de un aviso o lo quita", () => {
    toast.error("Clip eliminado", { sound: "remove" })
    expect(playSound).toHaveBeenLastCalledWith("remove")

    vi.clearAllMocks()
    toast.success("Restaurado", { sound: false })
    expect(playSound).not.toHaveBeenCalled()

    toast("Recorte actualizado", { sound: "snip" })
    expect(playSound).toHaveBeenCalledWith("snip")
  })

  it("un aviso de advertencia no suena como un fallo", () => {
    toast.warning("Queda poco espacio")
    expect(playSound).not.toHaveBeenCalled()
  })

  it("el resto de la API de sonner sigue disponible", () => {
    toast.dismiss("exito")
    expect(sonner.dismiss).toHaveBeenCalledWith("exito")
  })
})
