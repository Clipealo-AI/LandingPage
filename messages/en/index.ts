import type es from "../es"
import common from "./common.json"
import marketing from "./marketing.json"
import pricing from "./pricing.json"
import routes from "./routes.json"
import pages from "./pages.json"
import articles from "./articles.json"

// Tipado contra el español para mantener sincronizadas las traducciones.
const messages: typeof es = { common, marketing, pricing, routes, pages, articles }

export default messages
