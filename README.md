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

- `/`: portada de marketing
- `/precios` (`/pricing`, `/precos`): planes y comparativa
- `/legal/privacidad`, `/legal/terminos`: páginas legales

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
