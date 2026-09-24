import type { NextConfig } from "next"
import bundleAnalyzer from "@next/bundle-analyzer"
import createNextIntlPlugin from "next-intl/plugin"

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
})

// Idiomas: la configuración de cada petición vive en i18n/request.ts
const withNextIntl = createNextIntlPlugin("./i18n/request.ts")
const esDev = process.env.NEXT_PUBLIC_SITE_URL?.includes("landing.dev.clipealo-ai.com") ?? false

const nextConfig: NextConfig = {
  images: {
    // Miniaturas públicas de la landing y pósters del almacenamiento de video.
    remotePatterns: [
      { protocol: "https", hostname: "**.clipealo.com" },
      { protocol: "https", hostname: "storage.googleapis.com" },
    ],
    formats: ["image/avif", "image/webp"],
  },

  async headers() {
    const headers = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
      },
      ...(esDev ? [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }] : []),
    ]

    return [
      {
        source: "/:path*",
        headers,
      },
    ]
  },
}

export default withBundleAnalyzer(withNextIntl(nextConfig))
