import common from "./common.json"
import marketing from "./marketing.json"
import pricing from "./pricing.json"
import routes from "./routes.json"
import pages from "./pages.json"
import articles from "./articles.json"

const messages = { common, marketing, pricing, routes, pages, articles }

export default messages
export type Namespace = keyof typeof messages
