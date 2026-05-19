import type { Plugin } from 'vite';
import { blogArticlesData } from './src/data/blogArticlesMetadata';

const BASE_URL = 'https://www.clipealo-ai.com';
const DEFAULT_OG_IMAGE = 'https://storage.googleapis.com/gpt-engineer-file-uploads/uUehV3bYuzgNzbsXMdDHUepZq4z2/social-images/social-1770175321286-file (2).jpg';

export function blogPrerender(): Plugin {
  return {
    name: 'blog-prerender',
    enforce: 'post',
    apply: 'build',
    async closeBundle() {
      const fs = await import('fs');
      const path = await import('path');
      const distDir = path.resolve(__dirname, 'dist');
      const indexHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');

      for (const article of blogArticlesData) {
        const slug = article.id;
        const title = `${article.title} | Clipealo`;
        const desc = article.metaDescription;
        // Always include trailing slash so canonical & hreflang match the audit invariant.
        const url = `${BASE_URL}/blog/${slug}/`;
        const dateISO = article.isoDate;
        const modifiedISO = article.modifiedDate;

        // Build custom HTML with correct meta tags
        let html = indexHtml;

        // Replace title
        html = html.replace(
          /<title>[^<]*<\/title>/,
          `<title>${title}</title>`
        );

        // Replace meta description
        html = html.replace(
          /<meta name="description" content="[^"]*"/,
          `<meta name="description" content="${desc}"`
        );

        // Replace OG tags
        html = html.replace(
          /<meta property="og:title" content="[^"]*"/,
          `<meta property="og:title" content="${title}"`
        );
        html = html.replace(
          /<meta property="og:description" content="[^"]*"/,
          `<meta property="og:description" content="${desc}"`
        );
        html = html.replace(
          /<meta property="og:url" content="[^"]*"/,
          `<meta property="og:url" content="${url}"`
        );
        html = html.replace(
          /<meta property="og:type" content="[^"]*"/,
          `<meta property="og:type" content="article"`
        );

        // Replace Twitter tags
        html = html.replace(
          /<meta name="twitter:title" content="[^"]*"/,
          `<meta name="twitter:title" content="${title}"`
        );
        html = html.replace(
          /<meta name="twitter:description" content="[^"]*"/,
          `<meta name="twitter:description" content="${desc}"`
        );

        // Replace canonical
        html = html.replace(
          /<link rel="canonical" href="[^"]*"/,
          `<link rel="canonical" href="${url}"`
        );

        // Replace hreflang self-references so they match canonical exactly.
        html = html.replace(
          /<link rel="alternate" hreflang="es" href="[^"]*"\s*\/>/,
          `<link rel="alternate" hreflang="es" href="${url}" />`
        );
        html = html.replace(
          /<link rel="alternate" hreflang="x-default" href="[^"]*"\s*\/>/,
          `<link rel="alternate" hreflang="x-default" href="${url}" />`
        );

        // Add article meta tags before </head>
        const articleMeta = `
    <meta property="article:published_time" content="${dateISO}" />
    <meta property="article:modified_time" content="${modifiedISO}" />
    <meta property="article:author" content="Equipo Clipealo" />
    <meta property="article:section" content="${article.category}" />`;

        html = html.replace('</head>', `${articleMeta}\n  </head>`);

        // Add article-specific JSON-LD before </head>
        const jsonLd = {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: article.title,
          description: article.metaDescription,
          image: DEFAULT_OG_IMAGE,
          author: { '@type': 'Person', name: 'Equipo Clipealo' },
          publisher: {
            '@type': 'Organization',
            name: 'Clipealo',
            logo: { '@type': 'ImageObject', url: `${BASE_URL}/favicon.png` },
          },
          datePublished: dateISO,
          dateModified: modifiedISO,
          mainEntityOfPage: url,
          inLanguage: 'es',
        };

        const jsonLdScript = `\n    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`;
        html = html.replace('</head>', `${jsonLdScript}\n  </head>`);

        // Add static content in noscript for the specific article
        const staticContent = `
    <div style="max-width:800px;margin:0 auto;padding:40px 20px;font-family:system-ui,sans-serif;color:#fff;background:#0a0a1a;">
      <h1>${article.title}</h1>
      <p>${article.metaDescription}</p>
      <p>Publicado el ${article.displayDate}</p>
      <p><a href="${BASE_URL}/blog">Volver al blog</a> | <a href="${BASE_URL}/precios">Ver precios</a> | <a href="${BASE_URL}">Inicio</a></p>
    </div>`;

        // Replace the generic noscript with article-specific one
        html = html.replace(
          /(<noscript>\s*<div style="max-width:800px;margin:0 auto.*?<\/div>\s*<\/noscript>)/s,
          `<noscript>${staticContent}\n    </noscript>`
        );

        // Write file
        const dir = path.join(distDir, 'blog', slug);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, 'index.html'), html);
      }

      console.log(`✅ Pre-rendered ${blogArticlesData.length} blog posts`);
    },
  };
}