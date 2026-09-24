# Clipealo Landing Page

The public landing is the Vite + React site in `src/`. The repository also
contains a Next.js application; Firebase Hosting deploys only the static Vite
landing.

## Run the landing with Bun

```sh
bun install --frozen-lockfile
bun run dev:landing
```

## Landing scripts

- `bun run build:landing`: production landing build
- `bun run build:landing:dev`: dev build with analytics removed and indexing blocked
- `bun run check:landing`: landing typecheck, lint, and production build
- `bun run preview:landing`: preview the last landing build locally

Pushes to `dev` build and deploy to Firebase Hosting in
`clipealo-gpt-amigos-dev`. The production Cloud Build trigger follows `main`
and deploys the production build to the existing Firebase Hosting site.
