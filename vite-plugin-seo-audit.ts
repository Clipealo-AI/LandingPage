import type { Plugin } from 'vite';

/**
 * Post-build SEO audit.
 *
 * Walks every HTML file produced under dist/ and enforces three invariants:
 *   1. The page exposes exactly one <link rel="canonical" href="...">.
 *   2. The page exposes a self-referencing <link rel="alternate" hreflang="es" ...>.
 *   3. The page exposes a self-referencing <link rel="alternate" hreflang="x-default" ...>.
 *   4. The canonical URL and both hreflang URLs are byte-identical
 *      (same protocol, same host, same path, same trailing slash).
 *
 * Any violation throws and fails the build.
 */
export function seoAudit(): Plugin {
  return {
    name: 'seo-audit',
    enforce: 'post',
    apply: 'build',
    async closeBundle() {
      const fs = await import('fs');
      const path = await import('path');

      const distDir = path.resolve(process.cwd(), 'dist');
      if (!fs.existsSync(distDir)) return;

      const htmlFiles: string[] = [];
      const walk = (dir: string) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) walk(full);
          else if (entry.isFile() && entry.name.endsWith('.html')) htmlFiles.push(full);
        }
      };
      walk(distDir);

      const errors: string[] = [];

      const canonicalRe = /<link\s+rel="canonical"\s+href="([^"]+)"/gi;
      const hrefEsRe = /<link\s+rel="alternate"\s+hreflang="es"\s+href="([^"]+)"/i;
      const hrefDefaultRe = /<link\s+rel="alternate"\s+hreflang="x-default"\s+href="([^"]+)"/i;

      for (const file of htmlFiles) {
        const rel = path.relative(distDir, file);
        // Skip Google Search Console verification files and similar token files
        if (/^google[0-9a-f]+\.html$/i.test(path.basename(file))) continue;
        const html = fs.readFileSync(file, 'utf-8');

        const canonicalMatches = [...html.matchAll(canonicalRe)].map((m) => m[1]);
        if (canonicalMatches.length === 0) {
          errors.push(`[${rel}] missing <link rel="canonical">`);
          continue;
        }
        if (canonicalMatches.length > 1) {
          errors.push(`[${rel}] multiple canonical tags found: ${canonicalMatches.join(', ')}`);
        }
        const canonical = canonicalMatches[0];

        const esMatch = html.match(hrefEsRe);
        if (!esMatch) {
          errors.push(`[${rel}] missing self-referencing hreflang="es"`);
        } else if (esMatch[1] !== canonical) {
          errors.push(
            `[${rel}] hreflang="es" (${esMatch[1]}) does not match canonical (${canonical})`,
          );
        }

        const defaultMatch = html.match(hrefDefaultRe);
        if (!defaultMatch) {
          errors.push(`[${rel}] missing self-referencing hreflang="x-default"`);
        } else if (defaultMatch[1] !== canonical) {
          errors.push(
            `[${rel}] hreflang="x-default" (${defaultMatch[1]}) does not match canonical (${canonical})`,
          );
        }
      }

      if (errors.length > 0) {
        const header = `\n❌ SEO audit failed — ${errors.length} issue(s) across ${htmlFiles.length} HTML file(s):\n`;
        const body = errors.map((e) => `  • ${e}`).join('\n');
        throw new Error(`${header}${body}\n`);
      }

      console.log(`✅ SEO audit passed — ${htmlFiles.length} HTML file(s) validated (canonical + hreflang self-references).`);
    },
  };
}