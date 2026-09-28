import { expect, test } from "@playwright/test"

import { irA } from "./helpers"

test("los controles de la demo tienen nombres accesibles y área táctil suficiente", async ({
  page,
}) => {
  await irA(page, "/")

  await expect(
    page.getByRole("button", { name: /El teclado de patos/ }).first()
  ).toBeVisible()

  const timeline = page.getByRole("slider", {
    name: "Mover la reproducción del video original",
  })
  await expect(timeline).toBeVisible()
  const bounds = await timeline.boundingBox()
  expect(bounds?.height).toBeGreaterThanOrEqual(24)
})
