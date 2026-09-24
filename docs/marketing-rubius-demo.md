# Vista previa de Rubius en la landing

## Selección de clips

Se revisaron los registros de `projects` y `clips` para las dos fuentes de Rubius identificadas en la base de datos: 40 clips de cuatro procesamientos del [unboxing de Rubius Z](https://www.youtube.com/watch?v=PlVQZbF1ijo) y 24 clips de dos procesamientos del directo de Chepamón y Among Us. La selección es editorial, basada en los títulos, motivos, escenas y transcripciones. La base de datos no contiene visualizaciones reales ni una puntuación de viralidad de estos clips.

Se conservaron seis cortes con premisa y resultado propios. Las variantes que repiten la misma escena y el corte que mezcla unos segundos de teclado con el siguiente paquete quedaron fuera.

| Clip de la base de datos               | Tiempo del origen | Gancho                                                    |
| -------------------------------------- | ----------------- | --------------------------------------------------------- |
| `63278474-fe9d-4e34-9196-0a143c1c79c0` | 01:09–01:52       | Premios de Twitch por hasta 250 millones de horas vistas. |
| `0cf08e11-e774-4482-a127-9c4e9a5547e7` | 04:25–05:12       | Teclas de pato que también son llaveros.                  |
| `7eb2ce28-e16c-4e96-989a-133411c87d0a` | 06:02–06:41       | Teclado de patos en funcionamiento.                       |
| `9aef052e-2ec6-4bb1-8639-00ce3f628500` | 07:24–08:05       | Código de Indiana Jones grabado en una pieza.             |
| `1ac312f5-243d-476e-8f34-3d96d1408f89` | 08:23–09:17       | Puzle físico de la edición coleccionista.                 |
| `79655d24-72d4-43de-a93e-8cb0eb7013ba` | 09:55–10:30       | Antes y después de las cartas Pokémon en su expositor.    |

Los títulos y las transcripciones literales se exportaron a `lib/marketing/rubius-demo.json`. Los títulos cortos y las explicaciones que se muestran en el visor son copia editorial de la landing; viven en `lib/marketing/rubius-demo.ts` y `messages/{es,en,pt}/marketing.json`. Los 90 valores de `rubius-waveform.json` son niveles RMS del audio del fragmento.

## Reproductor y almacenamiento

El reproductor muestra solo **05:55–08:10** (2:15 min), un fragmento continuo que contiene dos de los seis clips seleccionados. Las marcas de la línea temporal usan sus tiempos reales. La lista contiene los seis resultados, muestra cuatro tarjetas y permite desplazarse para ver las demás.

La landing reproduce directamente desde `gs://clipealo-gpt-amigos-prod-v1/demos/landing/rubius/v3/` por la URL pública de Google Cloud Storage. `overview.mp4` es el fragmento en 16:9; los seis MP4 restantes son cortes en 9:16 (540×960) con subtítulos derivados de la transcripción. Todos incluyen una pista AAC. El audio empieza silenciado para permitir reproducción automática y el control de volumen lo activa por gesto del visitante.

El visor de cada clip replica la estructura de la app: reproductor, información y transcripción, formato y acciones. Las acciones abren la app activa en `https://app.clipealo-ai.com`; reproducir, buscar, activar audio, ampliar y cerrar funcionan dentro de la landing.

El bucket histórico `clipealo-plataform-prod-v2` al que apuntan los registros antiguos ya no existe. Los archivos de esta demo están en el bucket actual y la landing no modifica las URL históricas de los proyectos.
