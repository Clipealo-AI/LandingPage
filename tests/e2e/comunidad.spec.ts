import { expect, test } from "@playwright/test"

import { irA } from "./helpers"

test("las dos franjas de la comunidad muestran los mismos canales reales", async ({
  page,
}) => {
  await irA(page, "/")

  const franjas = page.locator('section[aria-labelledby="comunidad"] [data-marquee]')
  await expect(franjas).toHaveCount(2)

  const nombresArriba = await franjas
    .nth(0)
    .locator('ul[role="list"] [data-channel]')
    .evaluateAll((items) => items.map((item) => item.getAttribute("data-channel")))
  const nombresAbajo = await franjas
    .nth(1)
    .locator('ul[role="list"] [data-channel]')
    .evaluateAll((items) => items.map((item) => item.getAttribute("data-channel")))

  expect(nombresArriba).toHaveLength(8)
  expect(nombresAbajo).toEqual(nombresArriba)
  expect(nombresAbajo.join(" ")).not.toMatch(/Radio Andina|Banco del Valle|Kunan Media/)
})
