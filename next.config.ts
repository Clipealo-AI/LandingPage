import type { NextConfig } from "next"
import bundleAnalyzer from "@next/bundle-analyzer"
import createNextIntlPlugin from "next-intl/plugin"

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
})

// Idiomas: la configuración de cada petición vive en i18n/request.ts
const withNextIntl = createNextIntlPlugin("./i18n/request.ts")

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    // La landing se publica como archivos estáticos en Firebase Hosting.
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "**.clipealo.com" },
      { protocol: "https", hostname: "storage.googleapis.com" },
    ],
  },
}

export default withBundleAnalyzer(withNextIntl(nextConfig))
