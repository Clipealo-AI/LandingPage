import common from "./common.json"
import marketing from "./marketing.json"
import pricing from "./pricing.json"
import routes from "./routes.json"

const messages = { common, marketing, pricing, routes }

export default messages
export type Namespace = keyof typeof messages
