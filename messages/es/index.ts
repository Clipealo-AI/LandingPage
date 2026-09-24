import common from "./common.json"
import marketing from "./marketing.json"
import designSystem from "./designSystem.json"
import auth from "./auth.json"
import app from "./app.json"
import campaigns from "./campaigns.json"
import campaignsAgencia from "./campaigns-agencia.json"
import calendario from "./calendario.json"
import compromisos from "./compromisos.json"
import formacion from "./formacion.json"
import feedback from "./feedback.json"
import settings from "./settings.json"
import analytics from "./analytics.json"
import admin from "./admin.json"
import pricing from "./pricing.json"
import taxonomy from "./taxonomy.json"
// El espacio `onboarding` se compone de un archivo por parte (`onboarding/<parte>.json`)
// para que cada parte tenga su dueño: `t("onboarding.<parte>.<clave>")`
import onboardingMeta from "./onboarding/meta.json"
import onboardingChrome from "./onboarding/chrome.json"
import onboardingCuenta from "./onboarding/cuenta.json"
import onboardingClipero from "./onboarding/clipero.json"
import onboardingCreador from "./onboarding/creador.json"
import onboardingAgencia from "./onboarding/agencia.json"
import onboardingRender from "./onboarding/render.json"
import onboardingResultado from "./onboarding/resultado.json"
import onboardingErrors from "./onboarding/errors.json"
import onboardingMicro from "./onboarding/micro.json"
import onboardingMontaje from "./onboarding/montaje.json"

/**
 * Textos en español, el idioma de referencia: sus claves definen el tipo de los
 * mensajes (`global.d.ts`) y los otros idiomas deben tener exactamente las mismas.
 */
const messages = {
  common,
  marketing,
  designSystem,
  auth,
  app,
  campaigns,
  campaignsAgencia,
  calendario,
  compromisos,
  formacion,
  feedback,
  settings,
  analytics,
  admin,
  pricing,
  taxonomy,
  onboarding: {
    meta: onboardingMeta,
    chrome: onboardingChrome,
    cuenta: onboardingCuenta,
    clipero: onboardingClipero,
    creador: onboardingCreador,
    agencia: onboardingAgencia,
    render: onboardingRender,
    resultado: onboardingResultado,
    errors: onboardingErrors,
    micro: onboardingMicro,
    montaje: onboardingMontaje,
  },
}

export default messages
export type Namespace = keyof typeof messages
