import { defineConfig, devices } from "@playwright/test"

const PORT = Number(process.env.PORT ?? 3100)
const baseURL = `http://127.0.0.1:${PORT}`

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    locale: "es-ES",
    /**
     * Chromium completo, no `headless-shell`.
     *
     * El shell no pinta frames: el reloj de las animaciones no avanza y React
     * no llega a hidratar los boundaries perezosos, asi que cualquier test que
     * anime o que interactue con un componente cliente falla de forma
     * intermitente por el navegador, no por el codigo. En CI hace falta
     * `npx playwright install chromium`.
     */
    channel: "chromium",
  },
  projects: [
    { name: "escritorio", use: { ...devices["Desktop Chrome"] } },
    { name: "movil", use: { ...devices["Pixel 7"] } },
    // El claro es el tema por defecto, asi que el oscuro solo se prueba si se
    // prueba a proposito: sin este proyecto se degrada sin que nadie lo note.
    // No basta con `colorScheme`: la app ya no hereda el tema del sistema, hay
    // que sembrar la eleccion guardada.
    {
      name: "oscuro",
      use: {
        ...devices["Desktop Chrome"],
        colorScheme: "dark",
        storageState: {
          cookies: [],
          origins: [
            {
              origin: baseURL,
              localStorage: [{ name: "clipealo-theme", value: "dark" }],
            },
          ],
        },
      },
    },
  ],
  webServer: {
    // Se prueba el build de produccion: en dev el HTML no es el que ve el usuario
    command: `npm run build && npx next start -p ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
