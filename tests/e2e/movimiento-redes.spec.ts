import { expect, test } from "@playwright/test"

import { irA, modoCaptura } from "./helpers"

const TEXTOS = {
  es: {
    hook: "[Hook Viral]",
    transcript: "[Transcripción]",
    blur: "9:16 · desenfoque",
    x: "Para ti",
  },
  en: {
    hook: "[Viral Hook]",
    transcript: "[Transcript]",
    blur: "9:16 · blur",
    x: "For you",
  },
  pt: {
    hook: "[Gancho viral]",
    transcript: "[Transcrição]",
    blur: "9:16 · desfoque",
    x: "Para você",
  },
} as const

for (const [locale, text] of Object.entries(TEXTOS)) {
  test(`cuatro encuadres del mismo clip en ${locale}`, async ({ page }) => {
    await modoCaptura(page)
    await irA(page, `/${locale}`)

    const section = page.locator("#redes")
    await section.scrollIntoViewIfNeeded()
    const figures = section.locator("figure")
    await expect(figures).toHaveCount(4)
    await expect(figures.locator("figcaption")).toHaveText([
      "16:9",
      "1:1",
      "9:16",
      text.blur,
    ])
    await expect(figures.locator("[data-crop-corner]")).toHaveCount(0)
    await expect(section.locator("[data-social-card]")).toHaveCount(6)
    await expect(section.locator("[data-social-card=x]")).toContainText(text.x)
    await expect(section.locator("[data-social-card] [data-light='claro']")).toHaveCount(
      6
    )
    if (test.info().project.name !== "movil") {
      const card = section.locator("[data-social-card=instagram] [data-light]")
      await card.hover()
      await expect(card).toHaveAttribute("data-lit", "")
      await expect
        .poll(() =>
          card.evaluate((el) =>
            getComputedStyle(el).getPropertyValue("--light-strength").trim()
          )
        )
        .toBe("9%")
    }
    await expect(figures.nth(1).locator("img")).toHaveClass(/object-cover/)
    const squareDimensions = await figures
      .nth(1)
      .locator("img")
      .evaluate((img) => {
        const image = img as HTMLImageElement
        return [image.naturalWidth, image.naturalHeight]
      })
    expect(squareDimensions[0]).toBe(squareDimensions[1])
    await expect(figures.nth(3).locator("img").first()).toHaveClass(/blur-md/)
    const labelBottoms = await figures
      .locator("figcaption")
      .evaluateAll((labels) =>
        labels.map((label) => label.getBoundingClientRect().bottom)
      )
    expect(Math.max(...labelBottoms) - Math.min(...labelBottoms)).toBeLessThan(2)
    if (page.viewportSize()!.width < 600) {
      const gallery = section.getByRole("region")
      const overflow = await gallery.evaluate((el) => el.scrollWidth > el.clientWidth)
      expect(overflow).toBe(true)
      await gallery.evaluate((el) => {
        el.scrollLeft = el.scrollWidth
      })
      await expect(figures.last()).toBeInViewport()
    }
    await expect(section.getByText(text.hook, { exact: true })).toBeVisible()
    await expect(section.getByText(text.transcript, { exact: true })).toBeVisible()
    await expect(section.locator("button")).toHaveCount(0)
    await expect(section).not.toContainText("Una idea, un clip")

    const imageData = await figures.locator("img").evaluateAll((images) =>
      images.map((image) => {
        const img = image as HTMLImageElement
        return {
          loaded: img.complete && img.naturalWidth > 0,
          src: img.getAttribute("src"),
        }
      })
    )
    expect(imageData).toHaveLength(5)
    expect(imageData.every(({ loaded }) => loaded)).toBe(true)
    expect(new Set(imageData.map(({ src }) => src)).size).toBe(3)

    const ratios = await figures.evaluateAll((els) =>
      els.map((el) => {
        const frame = el.querySelector(
          "figure > div > div, figure > div > div > div"
        ) as HTMLElement
        const box = frame.getBoundingClientRect()
        return box.width / box.height
      })
    )
    expect(ratios[0]).toBeCloseTo(16 / 9, 1)
    expect(ratios[1]).toBeCloseTo(1, 1)
    expect(ratios[2]).toBeCloseTo(9 / 16, 1)
    expect(ratios[3]).toBeCloseTo(9 / 16, 1)
  })
}

test("el fondo pulsa en naranja cada cuatro segundos y se detiene con movimiento reducido", async ({
  page,
}) => {
  await irA(page, "/es")
  const pattern = page.locator("#redes [data-redes-patron]")
  const glow = page.locator("#redes [data-redes-glow]")
  await expect(pattern).toHaveCSS("animation-duration", "4s")
  await expect(glow).toHaveCSS("animation-duration", "4s")
  await expect(pattern).toHaveCSS("animation-name", "networks-pattern-pulse")
  await expect(glow).toHaveCSS("animation-name", "networks-glow-pulse")

  await page.locator("html").evaluate((root) => {
    root.setAttribute("data-motion", "reduced")
  })
  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced")
  await expect(page.locator("#redes [data-redes-patron]")).toHaveCSS(
    "animation-name",
    "none"
  )
  await expect(page.locator("#redes [data-redes-glow]")).toHaveCSS(
    "animation-name",
    "none"
  )
})
