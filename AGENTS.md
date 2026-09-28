<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Clipealo marketing site

This repository contains the public landing, pricing, resource, and legal
pages. Product app routes and mock dashboards do not belong here. Product
actions link to `https://app.clipealo-ai.com/`.

## Brand and interface

- Keep the Clipealo brand, layout, copy, and section order consistent with the
  rebranding reference. The site supports light and dark themes.
- Components use semantic color tokens from `app/globals.css`; keep the blue
  structural and orange as the action accent.
- Use the display font for marketing headlines and the sans font for interface
  text. Keep visible copy and accessibility labels in `messages/{es,en,pt}/`.
- Keep interactions keyboard accessible and respect reduced-motion settings.
- Landing motion belongs in `app/motion/*.css`; avoid per-frame React state.

## Routes and translations

- Public routes are `/`, `/precios` (translated to `/pricing` and `/precos`),
  feature, use case, blog, privacy, and terms routes.
- Localized links use `Link`, `useRouter`, and `usePathname` from
  `@/i18n/navigation`.
- The public message namespaces are `common`, `marketing`, `pricing`, and
  `routes`. Keep each locale's keys and ICU parameters aligned.

## Code and checks

- Marketing sections live in `components/marketing/`; brand assets in
  `components/brand/`; public copy in `messages/`.
- Keep demo data deterministic so server and browser output match.
- Run `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`
  for changes that affect the site.
