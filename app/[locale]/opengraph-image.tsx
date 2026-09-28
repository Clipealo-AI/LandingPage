import { ImageResponse } from "next/og"
import { hasLocale } from "next-intl"
import { getTranslations } from "next-intl/server"

import { routing } from "@/i18n/routing"
import { siteConfig } from "@/lib/site"

/**
 * Texto alternativo sin idioma. `alt` es una exportación estática y no recibe
 * `params`; para variarlo por idioma habría que pasar a `generateImageMetadata`,
 * que cuelga la imagen de un segmento dinámico más (`/opengraph-image/[id]`) y
 * deja de poder generarse en el build.
 */
export const alt = siteConfig.name
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

/**
 * Una imagen por idioma, generada en el build. Las rutas de metadatos son
 * manejadores de ruta y no heredan el `generateStaticParams` del layout: sin
 * este, `/[locale]/opengraph-image` se dibujaría en cada petición.
 */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

/**
 * Imagen de compartición.
 *
 * Se dibuja con los colores del manual y el isotipo en SVG. No carga Climate
 * Crisis a propósito: traerla en tiempo de build ata la compilación a una
 * descarga externa, y la composición ya identifica la marca sin ella.
 */
export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: pedido } = await params
  const locale = hasLocale(routing.locales, pedido) ? pedido : routing.defaultLocale
  const t = await getTranslations({ locale, namespace: "marketing" })

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#071025",
        padding: 72,
        fontFamily: "sans-serif",
      }}
    >
      {/* Marca */}
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <svg width="64" height="64" viewBox="0 0 32 32" fill="none">
          <g
            stroke="#f8fbfe"
            strokeWidth={5.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M13 4.75H7.5A2.75 2.75 0 0 0 4.75 7.5V13" />
            <path d="M4.75 19v5.5a2.75 2.75 0 0 0 2.75 2.75H13" />
            <path d="M19 27.25h5.5a2.75 2.75 0 0 0 2.75-2.75V19" />
          </g>
          <rect x="18" y="4" width="10" height="10" rx="3" fill="#fd5e1c" />
        </svg>
        <span
          style={{ color: "#f8fbfe", fontSize: 40, fontWeight: 800, letterSpacing: -1 }}
        >
          {siteConfig.name}
        </span>
      </div>

      {/* Titular encuadrado por la marca de recorte */}
      <div style={{ display: "flex", position: "relative", paddingLeft: 28 }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 44,
            height: 44,
            borderLeft: "8px solid #fd5e1c",
            borderTop: "8px solid #fd5e1c",
            borderTopLeftRadius: 10,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            bottom: 0,
            width: 44,
            height: 44,
            borderLeft: "8px solid #fd5e1c",
            borderBottom: "8px solid #fd5e1c",
            borderBottomLeftRadius: 10,
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            color: "#f8fbfe",
            fontSize: 82,
            fontWeight: 800,
            letterSpacing: -3,
            lineHeight: 1.04,
            paddingLeft: 32,
          }}
        >
          <span>{t("og.titleTop")}</span>
          <span>{t("og.titleBottom")}</span>
        </div>
      </div>

      {/* Reclamo */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <span
          style={{
            background: "#fd5e1c",
            color: "#071025",
            fontSize: 26,
            fontWeight: 700,
            padding: "12px 24px",
            borderRadius: 14,
          }}
        >
          {t("claim")}
        </span>
        <span style={{ color: "#dce9ff", fontSize: 26, opacity: 0.6 }}>
          Vertical · 9:16
        </span>
      </div>
    </div>,
    size
  )
}
