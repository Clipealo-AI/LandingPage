import { hasLocale } from "next-intl"
import { getRequestConfig } from "next-intl/server"

import { routing } from "@/i18n/routing"

const MENSAJES = {
  es: () => import("@/messages/es"),
  en: () => import("@/messages/en"),
  pt: () => import("@/messages/pt"),
} as const

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale
  return {
    locale,
    messages: (await MENSAJES[locale]()).default,
  }
})
