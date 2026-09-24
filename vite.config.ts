import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import autoprefixer from "autoprefixer";
import path from "path";
import tailwindcss from "tailwindcss-legacy";
import { blogPrerender } from "./vite-plugin-blog-prerender";
import { seoAudit } from "./vite-plugin-seo-audit";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  css: {
    postcss: {
      plugins: [
        tailwindcss({ config: "./tailwind.config.vite.ts" }),
        autoprefixer(),
      ],
    },
  },
  plugins: [
    react(),
    {
      name: 'development-no-analytics',
      transformIndexHtml: {
        order: 'pre',
        handler(html) {
          const isDevDeploy = mode === 'dev' || loadEnv(mode, process.cwd(), 'VITE_').VITE_DEPLOY_ENV === 'dev';
          if (!isDevDeploy) return html;
          return html
            .replace(/<!-- Google tag \(gtag\.js\) -->[\s\S]*?(?=<!-- Primary Meta Tags -->)/, '')
            .replace(/<!-- Meta Pixel Code -->[\s\S]*?<!-- End Meta Pixel Code -->/g, '')
            .replace(/<!-- TikTok Pixel Code Start -->[\s\S]*?<!-- TikTok Pixel Code End -->/g, '')
            .replace(/<!-- Meta Pixel noscript fallback -->[\s\S]*?<\/noscript>/g, '')
            .replace(/<meta name="robots" content="[^"]*"\s*\/>/, '<meta name="robots" content="noindex, nofollow, noarchive" />')
            .replace(/<meta name="googlebot" content="[^"]*"\s*\/>/, '<meta name="googlebot" content="noindex, nofollow" />');
        },
      },
    },
    mode === "production" && blogPrerender(),
    mode === "production" && seoAudit(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
