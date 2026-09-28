# Imágenes de funcionalidades y casos de uso

## Cobertura

15 páginas de detalle y sus dos índices, en español, inglés y portugués.
Los ocho casos respetan la asignación del CPO del 28 de septiembre de 2026.
La ruta `comunidades` corresponde al equipo de e-sports de esa asignación.

| Ruta                                   | Recurso           | Origen   |
| -------------------------------------- | ----------------- | -------- |
| casos/cliperos                         | cliperos          | Drive 10 |
| casos/streamers                        | streamers         | Drive 7  |
| casos/podcasters                       | podcasters        | Drive 6  |
| casos/coaches                          | coaches           | Drive 5  |
| casos/creadores                        | creators          | Drive 4  |
| casos/comunidades                      | communities       | Drive 2  |
| casos/agencias                         | agencies          | Drive 1  |
| casos/marcas                           | brands            | Drive 0  |
| funciones/clips-automaticos-con-ia     | automaticClips    | imagegen |
| funciones/editor-subtitulos-estilos    | subtitleEditor    | Drive 11 |
| funciones/exporta-dos-formatos         | verticalExport    | Drive 12 |
| funciones/plantillas-de-marca          | brandTemplates    | imagegen |
| funciones/ia-entrenada-contenido-latam | latamAi           | Drive 13 |
| funciones/exportacion-en-masa          | batchExport       | Drive 3  |
| funciones/gestion-proyectos-carpetas   | projectManagement | imagegen |

## Archivos y selección

- Originales de Drive: `/home/siesta/clipealo/recursos-visuales/drive-2026-09-28/`.
  `manifest.json` conserva los nombres y enlaces de los 14 archivos descargados.
- Imágenes web: `public/media/routes/{recurso}-{640,1280}.avif`.
- Inventario tipado: `lib/marketing/route-media.ts`.
- Se revisaron los recursos históricos `src/assets/use-case-*`, `how-step-*` y
  `step-*` en el commit anterior a `a5580ec`. Mostraban interfaces anteriores,
  acentos morados y métricas ilustradas; se priorizaron los originales nuevos
  del CPO y fotografía coherente con la marca actual.
- Las imágenes generadas son representaciones conceptuales, no capturas del
  producto. Los prompts se conservan en `generation-prompts.md`.
- Casos: fotografía completa junto al contexto, sin cortar las composiciones.
- Funcionalidades: imagen en cabecera; subtítulos usa una composición vertical
  con texto localizado y encuadre muestra una guía 9:16.
- Índices: miniaturas 16:9, decorativas porque el enlace ya tiene nombre.
- Variantes AVIF de 640 y 1280 px, sin ampliar originales. La fuente móvil se
  selecciona con `picture`, compatible con la exportación estática.
- No fue necesario un diagrama adicional: los encuadres y subtítulos se
  representan con elementos HTML accesibles sobre las imágenes.

## Verificación

`tests/e2e/route-media.spec.ts` recorre las 15 páginas y los dos índices en
los tres idiomas. Verifica imágenes cargadas, imágenes distintas por página,
texto alternativo, ausencia de desbordamiento y errores de consola.
