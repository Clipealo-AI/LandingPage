import { test, expect } from "@playwright/test"
import { featureNavigation, useCaseNavigation } from "../../lib/marketing/navigation"
import { irA } from "./helpers"

for (const locale of ["es", "en", "pt"]) {
  test(`imágenes de todas las funcionalidades y casos: ${locale}`, async ({ page }) => {
    test.setTimeout(180_000)
    const errors: string[] = []
    page.on("pageerror", (error) => errors.push(error.message))
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text())
    })
    const sources = new Set<string>()
    for (const [section, routes] of [
      ["funciones", featureNavigation],
      ["casos", useCaseNavigation],
    ] as const) {
      for (const route of routes) {
        const response = await irA(page, `/${locale}/${section}/${route.slug}/`)
        expect(response?.status()).toBe(200)
        const media = page.locator('main img[src*="/media/routes/"]')
        await expect(media).toHaveCount(1)
        await media.scrollIntoViewIfNeeded()
        await expect
          .poll(() =>
            media.evaluate(
              (image: HTMLImageElement) => image.complete && image.naturalWidth > 0
            )
          )
          .toBe(true)
        expect(await media.getAttribute("alt")).toBeTruthy()
        sources.add((await media.getAttribute("src"))!)
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)
        ).toBe(true)
      }
      await irA(page, `/${locale}/${section}/`)
      const thumbnails = page.locator('main img[src*="/media/routes/"]')
      await expect(thumbnails).toHaveCount(routes.length)
      for (const thumbnail of await thumbnails.all()) {
        await thumbnail.scrollIntoViewIfNeeded()
        await expect
          .poll(() =>
            thumbnail.evaluate(
              (image: HTMLImageElement) => image.complete && image.naturalWidth > 0
            )
          )
          .toBe(true)
      }
    }
    expect(sources.size).toBe(15)
    expect(errors).toEqual([])
  })
}

test("los títulos largos mantienen la imagen dentro de 320 px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 820 })
  for (const route of [
    "/en/funciones/gestion-proyectos-carpetas/",
    "/es/casos/coaches/",
  ]) {
    await irA(page, route)
    const result = await page.evaluate(() => {
      const image = document.querySelector<HTMLImageElement>(
        'main img[src*="/media/routes/"]'
      )
      return {
        documentWidth: document.documentElement.scrollWidth,
        imageRight: image?.getBoundingClientRect().right,
        currentSrc: image?.currentSrc,
      }
    })
    expect(result.documentWidth).toBe(320)
    expect(result.imageRight).toBeLessThanOrEqual(320)
    expect(result.currentSrc).toContain("-640.avif")
  }
})
