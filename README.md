# Clipealo · sitio de marketing

Landing de Clipealo en español, inglés y portugués de Brasil. Presenta el
producto, sus casos de uso, precios y recursos de marca; las acciones para
usar Clipealo dirigen a `https://app.clipealo-ai.com/`.

## Desarrollo local

```bash
npm install
npm run dev
```

El sitio queda en [http://localhost:5173](http://localhost:5173).

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## Rutas

- `/{es,en,pt}`: portada de marketing
- `/{locale}/precios`: planes y comparativa
- `/{locale}/legal/privacidad`, `/{locale}/legal/terminos`: páginas legales

Firebase redirige `/` a `/es/` y conserva redirecciones permanentes desde las
direcciones históricas `/en/pricing`, `/pt/precos`, `/en/legal/privacy` y sus
equivalentes legales en portugués.

## Estructura

- `app/`: rutas públicas, metadatos, estilos y animaciones de la landing
- `components/marketing/`: secciones y navegación del sitio
- `components/brand/`: logotipo, iconos y recursos visuales de Clipealo
- `components/video/`: muestras visuales usadas por las secciones de marketing
- `messages/{es,en,pt}/`: textos de las páginas públicas
- `docs/marca/`: referencias visuales del rebranding
- `tests/`: pruebas de componentes y navegación de marketing

La paleta y los temas claro/oscuro se definen en `app/globals.css`. Los
componentes consumen sus tokens semánticos para mantener el mismo diseño en
ambos temas.

## Entrega continua

Los pushes a `dev` y `main` ejecutan el mismo workflow reutilizable: instala con
lockfile, valida tipos, lint, traducciones, pruebas y código muerto, genera el
sitio estático y lo publica en el Firebase Hosting de su entorno. GitHub se
autentica mediante Workload Identity Federation; el repositorio no guarda
claves de Google Cloud.

- `dev` → `https://landing.dev.clipealo-ai.com`
- `main` → `https://clipealo-ai.com`

Los pull requests hacia ambas ramas deben superar el workflow de validación.
