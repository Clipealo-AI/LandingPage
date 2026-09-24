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

La landing reproduce directamente desde `gs://clipealo-gpt-amigos-prod-v1/demos/landing/rubius/v6/` por la URL pública de Google Cloud Storage. La fuente local es la descarga de mayor resolución disponible del video original: 2560×1440 a 60 fps. `overview.mp4` conserva el fragmento en 16:9 de v4, exportado a 1920×1080 a 60 fps. Los seis MP4 de clips son cortes en 9:16, exportados a 1080×1920 a 30 fps, todos con audio AAC.

Los clips se regeneraron en el computador local con el `FFmpegProcessor.process_multi` de `plataform/clip-generator`, usando los títulos, rangos y subtítulos palabra por palabra que entrega el worker desde la BD. Se mantuvo el layout del generador: video horizontal centrado, fondo desenfocado, gancho arriba y subtítulos sincronizados; sin marca de agua. La codificación usa H.264 CRF 12 y preset slow para conservar más detalle. Las miniaturas se extrajeron de los MP4 finales y solo los archivos terminados se subieron a Google Cloud Storage.

El audio está activado por defecto. El video principal espera el clic en reproducir para que el navegador pueda iniciar la reproducción con sonido; abrir un clip desde la lista inicia su reproducción con sonido tras ese gesto.

El visor de cada clip replica la estructura de la app: reproductor, información y transcripción, formato y acciones. Las acciones abren la app activa en `https://app.clipealo-ai.com`; reproducir, buscar, activar audio, ampliar y cerrar funcionan dentro de la landing.

El bucket histórico `clipealo-plataform-prod-v2` al que apuntan los registros antiguos ya no existe. Los archivos de esta demo están en el bucket actual y la landing no modifica las URL históricas de los proyectos.

## Turno en la prueba social

El canal aparece como **Turno** (`@turnoenvivo`). En la BD de Clipealo figura una cuenta Turno con 339 proyectos y 3.103 clips al 23 de septiembre de 2026. El [canal oficial de YouTube](https://www.youtube.com/@turnoenvivo/about) muestra 124 mil suscriptores; esa es la métrica de la tarjeta. El [sitio oficial](https://www.turno.live/) enlaza YouTube, Instagram, TikTok y X, por eso aparecen esos cuatro iconos. La foto de la tarjeta procede del avatar público del canal oficial.
