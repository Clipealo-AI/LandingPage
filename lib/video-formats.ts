/** Aspect ratios used by marketing previews and published clips. */
export const ASPECT_RATIOS = {
  "9:16": { ratio: 9 / 16, css: "9 / 16" },
  "16:9": { ratio: 16 / 9, css: "16 / 9" },
} as const

export type AspectRatioKey = keyof typeof ASPECT_RATIOS
