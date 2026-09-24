<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Clipealo

Plataforma de clipping de video en tres idiomas: español (referencia, sin
prefijo), inglés (`/en`) y portugués de Brasil (`/pt`). En español: «comillas
angulares», coma decimal y espacio antes del `%`; en inglés, “comillas” y
`12.4%`; en portugués de Brasil, “aspas” y `12,4%`.

## Reglas del sistema de diseño

1. **Un componente nunca escribe un color.** Consume tokens semánticos
   (`bg-card`, `text-muted-foreground`, `bg-brand`). Las primitivas
   (`--color-ink-700`, `bg-blue-500`) solo se usan en `app/globals.css` y en
   superficies que son siempre oscuras pase lo que pase (hero, footer, 404 y el
   monitor del onboarding: la columna `bg-stage` de `/bienvenida` con la tarjeta
   9:16 y el timeline, en tinta también con el tema claro; la página y las
   preguntas siguen en tema claro).
2. **Azul = estructura, naranja = acento.** `--primary` es azul. `--brand` es
   naranja y es un token aparte para que nada lo herede sin querer: como máximo
   una acción `variant="brand"` visible por vista, más la marca de recorte y el
   clip seleccionado.
3. **La display es solo para titulares de marketing** (utilidad `.display`,
   Climate Crisis). Los títulos de componente van en DM Sans bold: a tamaño de
   tarjeta la display es ilegible. `--font-heading` apunta a la sans a propósito.
4. **Los timecodes llevan `data-slot="timecode"`** o la clase `tabular`, o el
   contador baila durante la reproducción.
5. **Movimiento de la landing: la historia «de video largo a clip», breve y con
   red.** Cuatro disparadores y ninguno más:
   - **Al cargar**, solo en la primera pantalla, solo con CSS (antes de
     hidratar), una vez y terminado en 2 s: esquinas del titular, entrada del
     badge, la fila de acciones y el claim, barrido del cabezal y halo. Nunca se
     anima el `h1` ni la descripción del hero (candidatos a LCP): ni opacidad,
     ni máscara, ni partirlos.
   - **Al entrar en pantalla**, una vez por visita, con los grupos
     `data-motion-group` de `lib/motion.ts`: cada gesto dura menos de 1,5 s y lo
     que ya se veía al hidratar no se oculta para animarlo (solo se reproduce si
     es decorativo y parte invisible).
   - **Ligado al scroll**, solo el reencuadre (`useScrollProgress`). Sin
     `animation-timeline` ni `scroll-snap`.
   - **Ligado al gesto**: hover, foco, clic, cambio de red o de ciclo. Luces y
     pre-encuadres de puntero solo con `(hover: hover) and (pointer: fine)`.

   En bucle, solo el carrusel de la comunidad; cualquier otra animación termina
   sola en menos de 5 s. Como mucho un gesto de marca de recorte por sección y
   nada naranja nuevo: el naranja es la marca de recorte y el clip
   seleccionado; cabezales, cuchillas y luces van en `primary`, tinta o blanco.
   Solo se animan `opacity`, `translate`, `scale`, color, la luz de fondo y
   `clip-path` (a pasos, o ligado al scroll en el reencuadre); nunca estado de
   React por frame ni librerías de animación. El CSS de movimiento vive en
   `app/motion/*.css`.

6. **«Reducir movimiento» reduce, no quita.** El movimiento completo es el de
   por defecto para todo el mundo (decisión del director, 15 sep 2026): manda la
   preferencia guardada del usuario (Ajustes › Perfil › Movimiento, o
   `?movimiento=reducido|completo|sistema`), que el script de arranque deja en
   `data-motion` antes del primer pintado; la del sistema solo decide sin JS.
   En modo reducido se quita lo que desplaza o escala contenido y se
   sustituye en su sitio: desplazar → fundido; escalar → opacidad o anillo;
   barrido o cuchilla → destello o fundido; geometría ligada al scroll → cortes
   de montaje con fundido; cambio de tamaño animado → cambio instantáneo con
   fundido del contenido. Se quedan igual la pulsación de 1 px, el color, la
   luz, los avisos, los indicadores (barras de progreso, cabezal en su sitio) y
   el texto que se escribe palabra a palabra. Distancias y escalas iniciales
   viven en las variables `--motion-*`, que valen 0 o 1 en ese modo: una sola
   animación para los dos, sin overrides por nombre de clase de Tailwind. Las
   reglas propias de ese modo se escriben con `@variant reduced`, y el JS
   pregunta a `prefiereMenosMovimiento()`. Nunca una regla global que corte
   transiciones a 0 ms. `?movimiento=completo|reducido|sistema` fuerza un modo
   durante la sesión para revisar.
7. **Sonido y efecto solo cuando lo merece.** `Button variant="brand"` suena
   («pop») y se encuadra con la marca de recorte por defecto; los interruptores
   y las opciones de un grupo suenan solos. Los resultados van con
   `toast` de `@/lib/toast` (nunca de `sonner`): `success` y `error` suenan,
   `celebrate` es para hitos (publicar, terminar una subida, conectar una red) y
   el `toast()` neutro no suena. Nada de sonido en navegación, hover, filtros ni
   acciones del backoffice que no sean la principal. En la landing suena también
   el botón de tinta del CTA final («pop»: es la acción principal de su vista y
   sobre naranja no puede ser `brand`), que se encuadra en tinta con
   `--crop-color`. Nunca suenan la luz, los pre-encuadres, la entrada de
   secciones ni el scroll.
8. **El estado natural es el estado final.** Sin JS, sin
   `IntersectionObserver`, al imprimir, en páginas sin observador o con
   `html[data-capture]`, todo se ve terminado: las animaciones usan `backwards`
   (nunca `forwards`) y lo oculto solo existe en `[data-motion-state="idle"]` o
   detrás de `.js`. Los `@keyframes` van fuera de `@theme` (Tailwind descarta
   los que ninguna clase `animate-*` usa) y un test comprueba que cada
   `animation-name` existe. Las transiciones nombran `translate` y `scale`, no
   `transform`. Ningún antepasado de la cabecera fija ni del bloque `sticky` del
   reencuadre lleva `transform`, `filter`, `contain` ni `will-change`. El estado
   del movimiento va en atributos (`data-motion-state`), nunca en clases que
   React pueda reescribir.

## Idiomas (next-intl)

- **Ningún texto visible escrito a mano en un componente**, tampoco `aria-label`,
  `title`, `placeholder`, `alt`, metadatos ni avisos de `toast`. Todo sale de
  `messages/{es,en,pt}/<espacio>.json` con `useTranslations` (cliente y servidor
  síncrono) o `getTranslations` (servidor `async` y `generateMetadata`).
- Espacios: `common` (piezas compartidas, video, marca), `marketing`, `pricing`
  (catálogo de planes, se pinta en marketing, ajustes y admin), `designSystem`,
  `auth`, `app`, `campaigns` (campañas y wallet), `settings`, `analytics`, `admin`,
  `taxonomy` (etiquetas de los catálogos de `lib/taxonomia.ts`: verticales,
  sectores, tramos, finalidades…) y `onboarding` («Tu primer corte»). Qué
  espacios viajan al cliente en cada zona: `i18n/messages.ts`.
- `onboarding` se compone de un archivo por parte en
  `messages/<idioma>/onboarding/<parte>.json` (`meta`, `chrome`, `cuenta`,
  `clipero`, `creador`, `agencia`, `render`, `resultado`, `errors`, `micro`,
  `montaje`), unidos en `messages/<idioma>/index.ts`: la clave es
  `onboarding.<parte>.<clave>`. Una parte nueva se registra en los tres índices.
- El español define las claves y los tipos: una clave inexistente no compila, y
  `tests/unit/messages.test.ts` exige las mismas claves, variables y etiquetas
  ICU en los tres idiomas. Plurales con ICU (`{n, plural, one {# clip} other {# clips}}`);
  negritas y saltos de línea con `t.rich`.
- Los datos de `lib/` guardan ids, no etiquetas: el componente traduce
  (``t(`estado.${estado}`)``). Las validaciones devuelven códigos, no frases.
- Números, dinero y fechas: `useFormat()` de `hooks/use-format.ts` (en un
  componente `async`, `getFormat(await getLocale())`). Los `formatX` sueltos de
  `lib/format.ts` son la versión española, solo para tests.
- Enlaces y navegación: `Link`, `useRouter`, `usePathname` y `redirect` de
  `@/i18n/navigation`, nunca de `next/link` ni `next/navigation` (`useSearchParams`,
  `useParams` y `notFound` sí vienen de `next/navigation`). Las rutas se escriben
  en español (`/campanas`) y se traducen solas; las dinámicas, con
  `hrefDinamico("/campanas/[id]", { id })`. `usePathname` devuelve la ruta interna.
  Un enlace relativo de consulta (`?clip=…`) no se toca.
- Cada página y layout empieza con `await idiomaDe(params)` (`i18n/server.ts`) o la
  ruta deja de ser estática. Las páginas públicas añaden `alternates(href, locale)`
  de `i18n/metadata.ts` a sus metadatos.
- Contenido de demo que en producción escribiría un usuario (títulos de clips y
  campañas, nombres de creadores y marcas) no se traduce.

## Convenciones de código

- `components/ui/**` lo genera la CLI de shadcn (`npm run ui:add <nombre>`).
  Se puede extender con variantes nuevas —así se añadieron `brand` a `Button` y
  `Badge`— pero nunca reescribirlo: se regenera.
- Los componentes de `components/video/**` solo dependen de `lib/types.ts`.
  Cambiar el origen de datos no debe obligar a tocarlos.
- Los datos de demo (`lib/mock-data.ts`) son deterministas a propósito: un
  `Math.random()` provoca desajuste de hidratación.
- Todo lo que se pinta como número pasa por `lib/format.ts` (en la interfaz, `useFormat()`).
- Cualquier componente que use `nuqs` necesita un `<Suspense>` por encima o la
  ruta deja de poder prerenderizarse.
- Radix, no Base UI: la API es `asChild`, no `render`.
- Foco y pulsación de los botones cuelgan de `[data-button]` (bloque 4b de
  `globals.css`), nunca de `[data-slot="button"]`: cualquier Trigger con
  `asChild` pisa el `data-slot`. Sobre una superficie naranja, pon
  `[--ring:var(--color-ink-950)]` en el contenedor o el foco no se ve.

## Comprobaciones antes de dar algo por terminado

```bash
npm run check      # typecheck + lint + unit
npm run test:e2e   # Playwright (escritorio y móvil) sobre el build de producción
```

Si tocas color, tipografía o un componente de `components/video/**`, mira
`/design-system` — documenta el cambio automáticamente porque renderiza los
componentes reales.

Para revisar animaciones con Playwright, lanza `chromium.launch({ channel: "chromium" })`:
el `headless-shell` por defecto no avanza el reloj de animación sin frames y todo
lo animado aparece congelado en su estado inicial.

## Datos y estado

- **Todo lo que habla con el servidor vive en `lib/api/`.** Conectar la API real
  es cambiar el cuerpo de esas funciones; ni los hooks ni los componentes se
  enteran. Nada de `fetch` sueltos dentro de un componente.
- Las consultas van por `hooks/use-jobs.ts`, con las claves de caché en
  `jobKeys`. El sondeo se apaga solo devolviendo `false` en `refetchInterval`:
  no hay temporizadores que limpiar.
- `useJobs` exige `initialData` del render de servidor. Así la primera pintura
  no tiene estado de carga y `data` queda tipado como definido.
- La subida es por archivo. Si necesitas un porcentaje global, derívalo
  (`totalProgress`), no lo guardes.

## Backoffice (`app/(admin)`)

- Las definiciones de negocio viven en `lib/admin/metrics.ts` y solo ahí:
  cliente de pago, MRR, puente, baja con gracia de 7 días, activación, PQL. Una
  página nunca recalcula una métrica; la lee de la instantánea (`getAdminMonth`).
- Las variaciones son absolutas (`deltaOf`), nunca «% vs mes anterior». El mes
  en curso se compara con los mismos días del mes anterior y lleva la etiqueta
  «hasta hoy» (`snap.mtd`).
- Importes con `formatMoney` (soles). Nunca `new Date()` sin argumento: «hoy» es
  `snap.updatedAt`.
- `AdminTable` usa `nuqs`: solo desde un componente cliente propio y dentro de
  `<Suspense>`. Los parámetros de URL que enlaza el panel (`segmento`, `cola`,
  `q`, `mes`) son parte del contrato entre páginas.
- Las acciones del operador son `MockAction` hasta que exista la API; cada una
  declara en `efecto` lo que haría.

## Tests

- Playwright corre con `channel: "chromium"`, no con `headless-shell`. El shell
  no pinta frames: el reloj de las animaciones no avanza y React no hidrata los
  boundaries perezosos, así que todo lo animado o interactivo falla de forma
  intermitente por el navegador. En CI: `npx playwright install chromium`.
- Navega siempre con `irA(page, ruta)` de `tests/e2e/helpers.ts`: espera a
  `html[data-hydrated="true"]`. Playwright espera a que un elemento sea visible,
  pero no a que tenga manejadores.
- Tres proyectos: `escritorio`, `movil` y `oscuro`. El oscuro siembra
  `localStorage` porque el tema ya no se hereda del sistema.
- Movimiento: `tests/e2e/movimiento.spec.ts` guarda las invariantes (keyframes
  que existen, `h1` quieto, estado final, sin JS, nada se desplaza con reduce).
  Para capturas, `modoCaptura(page)` antes de navegar deja todo terminado; para
  un fotograma intermedio, `forzarGrupos(page)` y `congelarAnimaciones(page, ms)`
  de `helpers.ts`.
