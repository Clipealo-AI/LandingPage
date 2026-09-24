/** Datos deterministas para la vista previa del producto en la landing. */

function seededNoise(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 0xffffffff
  }
}

/** Forma de onda reproducible para evitar diferencias de hidratación. */
export function buildWaveform(
  bars: number,
  seed = 7,
  peaks: readonly number[] = [0.22, 0.55, 0.78]
) {
  const random = seededNoise(seed)
  return Array.from({ length: bars }, (_, index) => {
    const position = index / (bars - 1)
    const peak = peaks.reduce(
      (sum, point) => sum + Math.exp(-(((position - point) * 9) ** 2)),
      0
    )
    const base = 0.28 + random() * 0.3
    return Math.round(Math.min(1, base + peak * 0.55) * 1000) / 1000
  })
}
