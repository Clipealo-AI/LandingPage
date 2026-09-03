export interface FeaturePageData {
  slug: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  intro: string;
  sections: { heading: string; content: string }[];
  faqs: { question: string; answer: string }[];
  internalLinks: { label: string; href: string }[];
  isoDate: string;
  displayDate: string;
}

const TODAY = '2026-05-03';
const TODAY_ISO = '2026-05-03T00:00:00-05:00';
const TODAY_DISPLAY = '3 de mayo de 2026';

export const featurePages: FeaturePageData[] = [
  {
    slug: 'clips-automaticos-con-ia',
    metaTitle: 'Clips Automáticos con IA — Clipealo',
    metaDescription: 'Pega el link o sube tu video y Clipealo genera clips listos para publicar automáticamente. Sin edición manual. Para agencias, editores y cliperos en LATAM.',
    h1: 'Clips automáticos con IA: de video largo a clips listos en minutos',
    intro: 'Clipealo analiza tu video completo, detecta los mejores momentos por energía, contexto y retención, y genera hasta 10 clips listos para TikTok, Reels y Shorts en solo 5 minutos, sin que toques la línea de tiempo. Ideal para agencias, cliperos y equipos de contenido que necesitan producir volumen sin contratar más editores.',
    sections: [
      {
        heading: 'Cómo funciona el proceso de clipping automático',
        content: 'El proceso es simple: pega el enlace de tu video de YouTube, Twitch, Kick, Facebook, Google Drive o una grabación pública de Zoom sin contraseña, o sube el archivo directamente. La IA de Clipealo transcribe el audio completo, analiza la energía del contenido, detecta cambios de tema y momentos con alto potencial viral, y genera hasta 10 clips listos en 5 minutos.\n\nCada clip incluye subtítulos sincronizados, un título sugerido por IA y un score de viralidad que te ayuda a priorizar qué publicar primero. No necesitas ver el video original ni abrir un editor de video. El resultado son clips de 30 a 90 segundos ya formateados para cada plataforma.\n\nEl flujo completo toma menos de 10 minutos de trabajo activo: 2 minutos para subir el video, 5 minutos de procesamiento automático y 3 minutos para revisar y descargar tus clips.'
      },
      {
        heading: 'Qué detecta la IA: picos de energía, momentos virales y contexto',
        content: 'La IA de Clipealo está entrenada para identificar los momentos que generan más retención en plataformas de video corto. Detecta:\n\n- **Picos de energía vocal:** cuando el speaker sube el tono, se emociona o reacciona con intensidad.\n- **Cambios de tema relevantes:** transiciones naturales que marcan el inicio de una idea nueva y autocontenida.\n- **Momentos de humor:** risas genuinas, comentarios inesperados, situaciones cómicas.\n- **Declaraciones impactantes:** frases con alta carga emocional, datos sorprendentes o afirmaciones polémicas.\n- **Consejos prácticos:** recomendaciones accionables que la audiencia puede aplicar inmediatamente.\n- **Historias personales:** anécdotas narradas con pasión que generan conexión emocional.\n\nCada momento detectado recibe un score compuesto por 4 métricas: Gancho, Ritmo, Formato y Potencial. Este sistema te permite identificar rápidamente qué clips tienen mayor probabilidad de funcionar en redes.'
      },
      {
        heading: 'Cuántos clips genera por hora de video',
        content: 'Clipealo genera **hasta 10 clips por video procesado**, independientemente de la duración del video fuente. El procesamiento toma solo 5 minutos.\n\nLa IA selecciona los 10 mejores momentos del video basándose en su potencial de engagement. Cada clip tiene entre 30 y 90 segundos de duración, el rango óptimo para TikTok, Reels y Shorts.\n\nPara un clipero que procesa 3 videos por día, esto significa 30 clips diarios listos para publicar. Para una agencia con 5 clientes que producen 2 videos semanales, son hasta 100 clips por semana sin edición manual.'
      },
      {
        heading: 'Para qué tipo de videos funciona mejor',
        content: 'Clipealo funciona con cualquier tipo de video largo que contenga momentos valiosos para redes sociales:\n\n- **Streams de gaming y Just Chatting** en Twitch, Kick y YouTube\n- **Podcasts y entrevistas** grabadas en cualquier formato\n- **Webinars y charlas** corporativas o educativas\n- **Presentaciones y demos** de producto\n- **Eventos y conferencias** grabadas\n- **Clases y tutoriales** en video\n\nLa IA está entrenada específicamente en contenido en español latino, lo que le permite entender jerga local, modismos y el ritmo natural del contenido de creadores LATAM. También funciona con contenido en inglés.'
      },
      {
        heading: 'Por qué es mejor que editar manualmente',
        content: 'La edición manual de clips requiere ver el video completo, marcar timestamps, recortar con precisión, agregar subtítulos sincronizados y adaptar el formato para cada plataforma. Este proceso toma entre 3 y 5 horas por video.\n\nCon Clipealo, el mismo resultado toma 5 minutos de procesamiento automático más 3-5 minutos de revisión. El ahorro es de más de 3 horas por video.\n\n**Comparativa real:**\n- Edición manual de 1 video: ~4 horas → 10 clips\n- Clipealo: ~5 minutos → hasta 10 clips\n\nEl tiempo ahorrado permite procesar más videos, atender más clientes o dedicar más tiempo a la estrategia de contenido en lugar de la ejecución operativa.'
      },
      {
        heading: 'Quién usa esta función: agencias, cliperos y equipos de marketing',
        content: '**Cliperos profesionales** que trabajan con múltiples streamers y necesitan producir alto volumen de clips semanalmente. Con Clipealo procesan un stream de 4 horas en 5 minutos y obtienen hasta 10 clips listos.\n\n**Agencias de contenido** que gestionan las redes de varios clientes. Cada cliente tiene su propia plantilla de marca, y los clips se generan con el branding correcto automáticamente.\n\n**Equipos de marketing** que producen webinars, demos y presentaciones y necesitan reutilizar ese contenido en redes sociales sin contratar editores adicionales.\n\n**Social media managers** que necesitan mantener un ritmo de publicación constante en TikTok, Reels y Shorts sin dedicar horas a la edición.\n\nClipealo tiene planes desde S/.48/mes, con precios en soles peruanos y soporte en español.'
      },
    ],
    faqs: [
      { question: '¿Cuánto tarda en procesar 1 hora de video?', answer: '5 minutos. Clipealo procesa cualquier video en 5 minutos y genera hasta 10 clips automáticamente.' },
      { question: '¿Funciona con streams, podcasts, entrevistas y webinars?', answer: 'Sí. Funciona con streams de Twitch, Kick y YouTube, archivos de video y grabaciones públicas de Zoom sin contraseña.' },
      { question: '¿La IA entiende contenido en español latino?', answer: 'Sí. Clipealo está entrenada específicamente en español latino. Entiende jerga peruana, mexicana, argentina y colombiana.' },
      { question: '¿Puedo editar los clips después de generarlos?', answer: 'Sí. Puedes personalizar subtítulos, ajustar el estilo y modificar los clips antes de descargarlos.' },
      { question: '¿Cuánto cuesta?', answer: 'Desde S/.48/mes. Visita la página de precios para ver todos los planes disponibles.' },
    ],
    internalLinks: [
      { label: 'Ver precios de Clipealo', href: '/precios' },
      { label: 'Editor de subtítulos y estilos', href: '/funciones/editor-subtitulos-estilos' },
    ],
    isoDate: TODAY_ISO,
    displayDate: TODAY_DISPLAY,
  },
  {
    slug: 'editor-subtitulos-estilos',
    metaTitle: 'Editor de Subtítulos y Estilos — Clipealo',
    metaDescription: 'Personaliza fuentes, colores, animaciones y posición de subtítulos. Generación automática sincronizada. Sin edición frame por frame. Para clips profesionales en LATAM.',
    h1: 'Editor de subtítulos y estilos: clips con identidad visual sin esfuerzo',
    intro: 'Clipealo genera subtítulos automáticos sincronizados con el audio y te permite personalizar fuente, color, tamaño, animación y posición desde un editor visual. No necesitas editar frame por frame ni exportar a otro programa. En 5 minutos tienes hasta 10 clips con subtítulos profesionales. Ideal para cliperos que quieren entregar clips con estilo y para agencias que necesitan consistencia visual.',
    sections: [
      {
        heading: 'Cómo funciona el editor de subtítulos de Clipealo',
        content: 'Cuando Clipealo procesa tu video en 5 minutos y genera hasta 10 clips, cada clip incluye subtítulos automáticos perfectamente sincronizados con el audio. La transcripción se realiza con IA entrenada en español latino, lo que garantiza precisión incluso con modismos y jerga local.\n\nDesde el editor visual puedes:\n- Cambiar la fuente tipográfica entre más de 20 opciones\n- Ajustar el color del texto y del fondo\n- Seleccionar animaciones de entrada y salida\n- Modificar el tamaño y la posición en pantalla\n- Aplicar efectos de resaltado por palabra\n\nTodos los cambios se previsualizan en tiempo real. No necesitas exportar para ver el resultado final.'
      },
      {
        heading: 'Estilos disponibles: fuentes, colores, animaciones y posición',
        content: 'El editor de Clipealo ofrece control completo sobre la apariencia de los subtítulos:\n\n**Fuentes:** Más de 20 tipografías optimizadas para video corto, incluyendo opciones bold para gaming, elegantes para contenido corporativo y dinámicas para entretenimiento.\n\n**Colores:** Selector completo de color para texto, contorno y fondo. Puedes usar los colores de tu marca o los de tu cliente.\n\n**Animaciones:** Efectos de aparición palabra por palabra, resaltado dinámico, fade in/out y más. Las animaciones están optimizadas para retención en TikTok y Reels.\n\n**Posición:** Coloca los subtítulos en la parte superior, central o inferior del video. Ajusta la posición exacta con controles precisos.\n\nCada configuración se puede guardar como plantilla para reutilizarla en proyectos futuros.'
      },
      {
        heading: 'Por qué los subtítulos aumentan la retención en TikTok y Reels',
        content: 'El 85% de los videos en redes sociales se ven sin sonido. Sin subtítulos, pierdes a la mayoría de tu audiencia potencial.\n\nLos datos de TikTok confirman que los clips con subtítulos tienen:\n- **40% más de tiempo de visualización** que los clips sin subtítulos\n- **25% más de engagement** (likes, comentarios, compartidos)\n- **2x más probabilidad** de ser compartidos\n\nPero no cualquier subtítulo funciona. Los subtítulos genéricos sin estilo se perciben como contenido de baja calidad. Los subtítulos personalizados con la fuente, color y animación correctos transmiten profesionalismo y captan la atención.\n\nClipealo genera subtítulos animados y personalizables que transforman un clip básico en contenido de calidad profesional.'
      },
      {
        heading: 'Cómo aplicar el mismo estilo a todos los clips de un proyecto',
        content: 'Una vez que configuras el estilo de subtítulos que quieres — fuente, color, animación y posición — puedes guardarlo como plantilla y aplicarlo a todos los clips de un proyecto con un solo clic.\n\nEsto es especialmente valioso para:\n- **Cliperos** que trabajan con un streamer y necesitan mantener un estilo consistente en todos sus clips\n- **Agencias** que gestionan múltiples clientes y necesitan un estilo diferente para cada uno\n- **Equipos de marketing** que quieren que todos los clips de su marca se vean uniformes\n\nLa plantilla se aplica automáticamente a los clips nuevos que generes en ese proyecto, eliminando la necesidad de configurar el estilo cada vez.'
      },
      {
        heading: 'Subtítulos automáticos vs subtítulos manuales: comparativa de tiempo',
        content: 'Agregar subtítulos manualmente a un clip de 60 segundos toma entre 15 y 30 minutos: transcribir, sincronizar, formatear y revisar. Multiplicado por 10 clips, son de 2.5 a 5 horas de trabajo.\n\n**Con Clipealo:**\n- Los subtítulos se generan automáticamente durante el procesamiento de 5 minutos\n- La sincronización es precisa al milisegundo\n- El estilo se aplica con un clic\n- **Total: 0 minutos de trabajo adicional para subtítulos**\n\nEsto representa un ahorro de más de 4 horas por cada lote de 10 clips procesados. Para un clipero que procesa 3 videos por semana, son más de 12 horas semanales ahorradas solo en subtítulos.'
      },
      {
        heading: 'Para quién es ideal: cliperos, agencias y equipos de contenido',
        content: '**Cliperos profesionales** que quieren diferenciarse entregando clips con estilo visual profesional sin invertir horas en edición de subtítulos.\n\n**Agencias de contenido** que necesitan mantener la identidad visual de cada cliente en todos los clips que producen. Cada cliente tiene su plantilla de estilo.\n\n**Social media managers** que publican contenido en múltiples plataformas y necesitan que los subtítulos se adapten automáticamente al formato (vertical u horizontal).\n\n**Creadores de contenido** que quieren que sus clips se vean profesionales sin aprender a usar software de edición complejo.\n\nTodos los planes de Clipealo incluyen el editor de subtítulos. Desde S/.48/mes.'
      },
    ],
    faqs: [
      { question: '¿Los subtítulos se generan automáticamente?', answer: 'Sí. Se generan durante el procesamiento del video, perfectamente sincronizados con el audio. Todo en 5 minutos.' },
      { question: '¿Puedo cambiar el estilo después de generarlos?', answer: 'Sí. Puedes modificar fuente, color, animación y posición en cualquier momento desde el editor visual.' },
      { question: '¿Funciona bien con acento peruano y LATAM?', answer: 'Sí. La IA está entrenada en español latino y reconoce acentos de Perú, México, Argentina, Colombia y otros países de la región.' },
      { question: '¿Puedo guardar un estilo para reutilizarlo en otros proyectos?', answer: 'Sí. Puedes crear plantillas de estilo y aplicarlas a cualquier proyecto o cliente.' },
      { question: '¿Los subtítulos se exportan quemados en el video?', answer: 'Sí. Los subtítulos se integran directamente en el video exportado, listos para publicar.' },
    ],
    internalLinks: [
      { label: 'Ver precios de Clipealo', href: '/precios' },
      { label: 'Plantillas de marca', href: '/funciones/plantillas-de-marca' },
    ],
    isoDate: TODAY_ISO,
    displayDate: TODAY_DISPLAY,
  },
  {
    slug: 'exportacion-en-masa',
    metaTitle: 'Exportación en Masa de Clips — Clipealo',
    metaDescription: 'Descarga todos los clips de un proyecto en un solo clic. Ahorra horas de trabajo al gestionar múltiples videos o clientes. Para agencias y cliperos en LATAM.',
    h1: 'Exportación en masa: entrega todos tus clips en un solo clic',
    intro: 'Con Clipealo no necesitas descargar clip por clip. Procesa tu video en 5 minutos, genera hasta 10 clips, y descárgalos todos en un solo clic ya formateados para cada plataforma. Ideal para agencias que manejan múltiples clientes y cliperos que producen alto volumen de contenido semanalmente.',
    sections: [
      {
        heading: 'Cómo funciona la exportación en masa en Clipealo',
        content: 'Después de que Clipealo procesa tu video en 5 minutos y genera hasta 10 clips, puedes descargarlos todos con un solo clic usando la función de exportación en masa.\n\nEl proceso es simple:\n1. Abre tu proyecto con los clips generados\n2. Selecciona los clips que quieres descargar (o selecciona todos)\n3. Elige el formato de exportación: 9:16 para TikTok y Reels, o 16:9 para YouTube\n4. Haz clic en "Descargar todos"\n5. Recibe un archivo ZIP con todos tus clips organizados\n\nCada clip incluye subtítulos quemados, el estilo que hayas configurado y el formato correcto para la plataforma destino. No necesitas post-procesamiento adicional.'
      },
      {
        heading: 'Cuánto tiempo ahorras frente a la descarga individual',
        content: 'Descargar clips uno por uno toma entre 30 y 45 segundos por clip: seleccionar, esperar la preparación, descargar y renombrar. Para 10 clips, son de 5 a 8 minutos de trabajo repetitivo.\n\nCon exportación en masa, el mismo proceso toma menos de 30 segundos: un clic y todos los clips se descargan organizados.\n\nPero el ahorro real se nota a escala. Para un clipero que procesa 5 videos por semana (50 clips), la descarga individual consume 40 minutos semanales en una tarea puramente mecánica. Con exportación en masa, ese tiempo se reduce a 3 minutos.\n\nPara agencias con 5 clientes y 2 videos semanales por cliente (100 clips/semana), el ahorro semanal es de más de 1 hora solo en descargas.'
      },
      {
        heading: 'Formatos disponibles: 9:16 para TikTok y Reels, 16:9 para YouTube',
        content: 'La exportación en masa de Clipealo soporta los dos formatos principales que necesitas para redes sociales:\n\n**9:16 (vertical):** Optimizado para TikTok, Instagram Reels y YouTube Shorts. El reencuadre automático ajusta el contenido para que el hablante siempre esté centrado. Los subtítulos se posicionan automáticamente en la zona óptima de lectura.\n\n**16:9 (horizontal):** Para YouTube, Twitch y Kick. Mantiene el formato original del video con los subtítulos integrados.\n\nPuedes exportar todos los clips en un formato o en ambos simultáneamente. Esto te permite tener las dos versiones listas para publicar en diferentes plataformas sin procesar el video dos veces.'
      },
      {
        heading: 'Cómo organizar tus clips antes de exportar',
        content: 'Antes de exportar, Clipealo te permite organizar tus clips de varias formas:\n\n- **Por score de viralidad:** Ordena los clips del más viral al menos viral para priorizar cuáles publicar primero.\n- **Por duración:** Agrupa clips cortos (30s) para TikTok y más largos (60-90s) para Reels y Shorts.\n- **Selección manual:** Elige solo los clips que quieres exportar y descarta el resto.\n\nEsta organización previa te permite entregar a tu cliente exactamente lo que necesita, sin clips innecesarios, y programar la publicación de forma estratégica.'
      },
      {
        heading: 'Casos de uso: agencias con múltiples clientes y cliperos de alto volumen',
        content: '**Agencias con 5+ clientes:** Cada cliente tiene su propio proyecto en Clipealo. Cuando procesas un video de un cliente, exportas todos los clips con un clic y los entregas como archivo ZIP. El branding de cada cliente se aplica automáticamente con las plantillas de marca.\n\n**Cliperos que producen 20+ clips por semana:** Sin exportación en masa, descargar 20 clips uno por uno consume una cantidad absurda de tiempo. Con un clic, tienes todos los clips listos en tu computadora.\n\n**Equipos de marketing que publican en múltiples redes:** Exportan los clips en formato vertical y horizontal simultáneamente, y programan la publicación en cada plataforma.\n\n**Social media managers:** Reciben los clips organizados, los suben a sus herramientas de programación y publican durante toda la semana.'
      },
      {
        heading: 'Exportación en masa vs descarga manual: comparativa real',
        content: '**Descarga manual (10 clips):**\n- Seleccionar cada clip: 10 clics\n- Esperar preparación individual: 30s × 10 = 5 minutos\n- Renombrar archivos: 2 minutos\n- Organizar en carpetas: 3 minutos\n- **Total: ~10 minutos por proyecto**\n\n**Exportación en masa (10 clips):**\n- Seleccionar todos: 1 clic\n- Descargar ZIP: 30 segundos\n- **Total: ~30 segundos por proyecto**\n\nMultiplicado por 5 proyectos semanales, la diferencia es de 50 minutos vs 2.5 minutos. A lo largo de un mes, son más de 3 horas recuperadas en una tarea que no agrega ningún valor creativo.'
      },
    ],
    faqs: [
      { question: '¿Puedo exportar clips de diferentes proyectos a la vez?', answer: 'Actualmente la exportación en masa funciona por proyecto. Puedes exportar todos los clips de un proyecto con un clic.' },
      { question: '¿En qué formatos se exportan los clips?', answer: 'En MP4, disponible en formato 9:16 (vertical para TikTok/Reels) y 16:9 (horizontal para YouTube). Puedes elegir uno o ambos.' },
      { question: '¿Los subtítulos y estilos se mantienen en la exportación?', answer: 'Sí. Los subtítulos, estilos y plantillas de marca se integran directamente en el video exportado.' },
      { question: '¿Hay límite de clips por exportación?', answer: 'No. Puedes exportar todos los clips de un proyecto sin límite.' },
      { question: '¿Cuánto cuesta el plan que incluye exportación en masa?', answer: 'La exportación en masa está disponible en todos los planes. Desde S/.48/mes.' },
    ],
    internalLinks: [
      { label: 'Ver precios de Clipealo', href: '/precios' },
      { label: 'Gestión de proyectos y carpetas', href: '/funciones/gestion-proyectos-carpetas' },
    ],
    isoDate: TODAY_ISO,
    displayDate: TODAY_DISPLAY,
  },
  {
    slug: 'plantillas-de-marca',
    metaTitle: 'Plantillas de Marca por Cliente — Clipealo',
    metaDescription: 'Configura plantillas visuales con los colores, fuentes y estilo de cada cliente. Aplícalas a todos sus clips en segundos. Para agencias de contenido en LATAM.',
    h1: 'Plantillas de marca: aplica la identidad visual de cada cliente en segundos',
    intro: 'Con Clipealo configuras una plantilla por cliente con sus colores, tipografía, estilo de subtítulos y posición de elementos. Una vez configurada, se aplica automáticamente a todos los clips de ese cliente. Procesa el video en 5 minutos, genera hasta 10 clips y aplica el branding en un clic. Ideal para agencias audiovisuales y cliperos con varias marcas.',
    sections: [
      {
        heading: 'Cómo configurar una plantilla de marca en Clipealo',
        content: 'Crear una plantilla de marca en Clipealo toma menos de 5 minutos y solo necesitas hacerlo una vez por cliente:\n\n1. **Abre la configuración de plantillas** en tu proyecto\n2. **Define los colores corporativos:** color principal, secundario y de acento para subtítulos y elementos gráficos\n3. **Selecciona la tipografía:** elige entre más de 20 fuentes optimizadas para video corto\n4. **Configura el estilo de subtítulos:** animación, tamaño, posición y efectos\n5. **Guarda la plantilla** con el nombre de tu cliente\n\nUna vez guardada, la plantilla se aplica automáticamente a todos los clips que generes en ese proyecto. Si cambias algún elemento, los clips futuros reflejan el cambio sin reconfiguración.'
      },
      {
        heading: 'Qué elementos incluye cada plantilla: colores, fuentes, subtítulos y más',
        content: 'Cada plantilla de marca en Clipealo incluye:\n\n- **Colores corporativos:** color de texto, color de fondo de subtítulos, color de acento y contorno\n- **Tipografía:** fuente para subtítulos con control de peso (regular, bold, extra-bold)\n- **Estilo de subtítulos:** animación de entrada, efecto de resaltado, posición vertical\n- **Formato preferido:** configuración por defecto de 9:16, 16:9 o ambos\n\nTodos estos elementos se combinan para crear una identidad visual única que hace que los clips de cada cliente sean inmediatamente reconocibles como suyos. Sin importar quién en tu equipo procese el video, el resultado siempre tendrá el branding correcto.'
      },
      {
        heading: 'Cómo aplicar una plantilla a todos los clips de un cliente',
        content: 'Aplicar una plantilla de marca es un proceso de un solo clic:\n\n1. Sube el video de tu cliente a su proyecto\n2. Clipealo procesa el video en 5 minutos y genera hasta 10 clips\n3. La plantilla de marca del proyecto se aplica automáticamente\n4. Todos los clips tienen el branding correcto sin configuración adicional\n\nSi necesitas cambiar la plantilla para un proyecto específico, puedes hacerlo y los clips existentes se actualizan automáticamente. También puedes previsualizar los clips con diferentes plantillas antes de exportar.'
      },
      {
        heading: 'Por qué las plantillas reducen el tiempo de entrega a la mitad',
        content: 'Sin plantillas, aplicar el branding de un cliente a 10 clips requiere:\n- Abrir cada clip en un editor\n- Cambiar fuentes y colores manualmente\n- Verificar consistencia visual entre clips\n- Exportar cada clip individualmente\n- **Tiempo: ~45 minutos por lote de 10 clips**\n\nCon plantillas de Clipealo:\n- El branding se aplica automáticamente durante el procesamiento\n- Todos los clips tienen el mismo estilo sin intervención\n- Solo necesitas revisar y exportar\n- **Tiempo: 0 minutos adicionales**\n\nEsto reduce el tiempo de entrega total de ~1 hora a menos de 10 minutos por video procesado, incluyendo el procesamiento de 5 minutos y la revisión.'
      },
      {
        heading: 'Casos de uso: agencias audiovisuales y cliperos con cartera activa',
        content: '**Agencias con 5-10 clientes:** Cada cliente tiene su plantilla. Cuando recibes un nuevo video, lo subes al proyecto del cliente y los clips salen con el branding correcto automáticamente. Sin confusiones, sin errores de marca.\n\n**Cliperos que trabajan con múltiples streamers:** Cada streamer tiene su estilo visual. Las plantillas garantizan que los clips de cada streamer mantengan su identidad sin que tengas que recordar los colores de cada uno.\n\n**Productoras audiovisuales:** Cuando un cliente aprueba un estilo visual, se configura una vez y todos los entregables futuros mantienen la misma línea. Sin correcciones innecesarias.\n\n**Equipos de marketing in-house:** Configuran la plantilla de su marca una vez y todos los videos que procesan mantienen la identidad corporativa automáticamente.'
      },
      {
        heading: 'Plantillas de marca vs configuración manual por clip: comparativa',
        content: '**Configuración manual (por clip):**\n- Tiempo por clip: 5-8 minutos de configuración visual\n- Riesgo de inconsistencia: alto (cada clip puede verse ligeramente diferente)\n- Escalabilidad: baja (más clips = más tiempo)\n- Costo humano: requiere un editor con buen ojo de diseño\n\n**Plantillas de marca (automático):**\n- Tiempo de configuración: 5 minutos (una vez)\n- Consistencia: 100% garantizada\n- Escalabilidad: ilimitada (10, 50 o 100 clips, mismo esfuerzo)\n- Costo humano: cero después de la configuración inicial\n\nPara agencias que producen más de 20 clips semanales, las plantillas ahorran más de 3 horas de trabajo por semana solo en configuración visual.'
      },
    ],
    faqs: [
      { question: '¿Puedo tener plantillas diferentes para cada cliente?', answer: 'Sí. Cada proyecto puede tener su propia plantilla de marca con colores, fuentes y estilos diferentes.' },
      { question: '¿Incluye logo y colores de marca?', answer: 'Incluye colores corporativos, tipografía y estilo de subtítulos personalizado.' },
      { question: '¿Se aplica automáticamente a clips nuevos del mismo proyecto?', answer: 'Sí. Todos los clips generados en un proyecto heredan la plantilla configurada automáticamente.' },
      { question: '¿Puedo modificar la plantilla después de aplicarla?', answer: 'Sí. Puedes actualizar la plantilla en cualquier momento y los clips futuros reflejarán los cambios.' },
      { question: '¿En qué plan está disponible esta función?', answer: 'Las plantillas de marca están disponibles en todos los planes. Desde S/.48/mes.' },
    ],
    internalLinks: [
      { label: 'Ver precios de Clipealo', href: '/precios' },
      { label: 'Clips automáticos con IA', href: '/funciones/clips-automaticos-con-ia' },
    ],
    isoDate: TODAY_ISO,
    displayDate: TODAY_DISPLAY,
  },
  {
    slug: 'gestion-proyectos-carpetas',
    metaTitle: 'Gestión de Proyectos y Carpetas — Clipealo',
    metaDescription: 'Organiza todos tus videos y clips por proyecto, cliente o campaña. Encuentra cualquier entrega en segundos. Para agencias y cliperos con múltiples clientes en LATAM.',
    h1: 'Gestión de proyectos y carpetas: organiza todo tu contenido en un solo lugar',
    intro: 'Clipealo te permite crear proyectos y carpetas para organizar tus videos y clips por cliente, campaña o fecha. Cada video se procesa en 5 minutos generando hasta 10 clips. Encuentra cualquier entrega en segundos sin revisar carpetas locales ni drives desordenados. Ideal para agencias y cliperos con múltiples clientes.',
    sections: [
      {
        heading: 'Cómo organizar tus proyectos en Clipealo',
        content: 'Clipealo organiza tu trabajo en una estructura jerárquica simple:\n\n**Proyectos:** Cada proyecto es un espacio dedicado para un cliente, campaña o tipo de contenido. Dentro de cada proyecto tienes todos los videos fuente y los clips generados organizados cronológicamente.\n\n**Carpetas:** Dentro de cada proyecto puedes crear carpetas para organizar por mes, por tipo de contenido o por campaña específica.\n\nCuando subes un nuevo video a un proyecto, Clipealo lo procesa en 5 minutos, genera hasta 10 clips y los organiza automáticamente dentro del proyecto. Si el proyecto tiene una plantilla de marca configurada, los clips heredan el branding del cliente automáticamente.'
      },
      {
        heading: 'Estructura recomendada: por cliente, por campaña o por fecha',
        content: '**Para agencias (por cliente):**\n- Proyecto: Cliente A\n  - Carpeta: Mayo 2026\n  - Carpeta: Junio 2026\n- Proyecto: Cliente B\n  - Carpeta: Campaña Lanzamiento\n  - Carpeta: Contenido Semanal\n\n**Para cliperos (por streamer):**\n- Proyecto: Streamer X\n- Proyecto: Streamer Y\n- Proyecto: Streamer Z\n\n**Para equipos de marketing (por campaña):**\n- Proyecto: Lanzamiento Q2\n- Proyecto: Contenido Orgánico\n- Proyecto: Webinars\n\nLa estructura correcta depende de tu volumen de trabajo y de cómo entregas el contenido. La clave es que sea consistente y fácil de navegar.'
      },
      {
        heading: 'Cómo encontrar cualquier clip en segundos',
        content: 'Con todos tus clips organizados en proyectos y carpetas, encontrar una entrega específica toma segundos en lugar de minutos:\n\n- **Navega por proyecto:** Ve directamente al proyecto del cliente o streamer\n- **Filtra por fecha:** Los videos y clips se organizan cronológicamente dentro de cada proyecto\n- **Busca por nombre:** Cada clip tiene un título descriptivo generado por IA\n\nEsto elimina el problema clásico de los cliperos y agencias: ¿en qué carpeta guardé los clips del stream del martes? ¿Cuál era la versión final? ¿Ya exporté estos clips?\n\nTodo está en un solo lugar, organizado y accesible desde cualquier dispositivo.'
      },
      {
        heading: 'Por qué la organización es clave para escalar como clipero o agencia',
        content: 'El desorden es el enemigo de la escalabilidad. Cuando un clipero gestiona 2 streamers, las carpetas locales funcionan. Cuando gestiona 5 o 10, el caos es inevitable.\n\nLas agencias enfrentan el mismo problema multiplicado: carpetas de Google Drive con nombres inconsistentes, archivos duplicados, versiones perdidas y entregas que se retrasan porque nadie encuentra el clip correcto.\n\nClipealo resuelve esto centralizando todo en una plataforma diseñada para producción de clips a escala. Cada video se procesa en 5 minutos, los clips se generan y organizan automáticamente, y las entregas se exportan en masa.\n\nEl resultado: menos tiempo buscando archivos, más tiempo produciendo contenido. El clipero que organiza bien puede atender 3x más clientes con el mismo esfuerzo.'
      },
      {
        heading: 'Gestión de proyectos en Clipealo vs carpetas locales: comparativa',
        content: '**Carpetas locales (Google Drive / Disco duro):**\n- Organización: manual, depende de la disciplina del usuario\n- Búsqueda: lenta, requiere navegar múltiples niveles\n- Acceso: limitado al dispositivo o a links compartidos\n- Branding: no integrado, cada clip requiere configuración manual\n- Exportación: archivo por archivo\n- Escalabilidad: se degrada con el volumen\n\n**Gestión de proyectos en Clipealo:**\n- Organización: automática por proyecto y fecha\n- Búsqueda: inmediata por proyecto, fecha o nombre\n- Acceso: desde cualquier dispositivo con tu cuenta\n- Branding: integrado con plantillas de marca\n- Exportación: en masa con un clic\n- Escalabilidad: diseñada para alto volumen\n\nLa diferencia se nota cuando pasas de 10 clips semanales a 50 o 100. Con carpetas locales, el caos crece. Con Clipealo, la gestión se mantiene simple.'
      },
      {
        heading: 'Casos de uso: agencias audiovisuales y cliperos con 5+ clientes',
        content: '**Clipero profesional con 5 streamers:** Cada streamer tiene su proyecto. Los clips se generan con el estilo visual de cada uno. Las entregas semanales se exportan en masa y se comparten directamente.\n\n**Agencia de contenido con 8 clientes:** Cada cliente tiene su proyecto con su plantilla de marca. Los coordinadores de cuenta ven solo los proyectos de sus clientes. Las entregas se organizan por mes.\n\n**Social media manager con 3 marcas:** Cada marca tiene su proyecto con su identidad visual. Los clips se programan para publicación durante toda la semana.\n\n**Productora audiovisual:** Organiza los proyectos por evento o campaña. Los clips de cada grabación se agrupan automáticamente y se entregan al cliente con exportación en masa.\n\nClipealo procesa cada video en 5 minutos, genera hasta 10 clips y los organiza automáticamente. Tú solo revisas y entregas.'
      },
    ],
    faqs: [
      { question: '¿Cuántos proyectos puedo tener activos?', answer: 'No hay límite de proyectos activos. Puedes crear tantos como necesites.' },
      { question: '¿Puedo compartir proyectos con mi equipo o cliente?', answer: 'Actualmente los proyectos están ligados a tu cuenta. Puedes exportar y compartir los clips fácilmente.' },
      { question: '¿Los proyectos se eliminan automáticamente?', answer: 'No. Tus proyectos y clips se mantienen disponibles mientras tu cuenta esté activa.' },
      { question: '¿Puedo mover clips entre proyectos?', answer: 'Actualmente los clips permanecen en el proyecto donde fueron generados.' },
      { question: '¿En qué plan está disponible la gestión avanzada de proyectos?', answer: 'La gestión de proyectos está disponible en todos los planes. Desde S/.48/mes.' },
    ],
    internalLinks: [
      { label: 'Ver precios de Clipealo', href: '/precios' },
      { label: 'Exportación en masa', href: '/funciones/exportacion-en-masa' },
    ],
    isoDate: TODAY_ISO,
    displayDate: TODAY_DISPLAY,
  },
  {
    slug: 'exporta-dos-formatos',
    metaTitle: 'Exporta en 2 Formatos: 16:9 y 9:16 — Clipealo',
    metaDescription: 'Exporta tus clips en 16:9 para YouTube y Twitch, o en 9:16 para TikTok, Reels y Shorts. Reencuadre automático en 1 clic. Para agencias y cliperos en LATAM.',
    h1: 'Exporta en 2 formatos: 16:9 para YouTube y 9:16 para TikTok en 1 clic',
    intro: 'Clipealo genera tus clips en el formato correcto para cada plataforma automáticamente. 16:9 para YouTube, Twitch y Kick. 9:16 para TikTok, Instagram Reels y YouTube Shorts. Procesa tu video en 5 minutos, genera hasta 10 clips con reencuadre automático. Ideal para cliperos y agencias que publican en múltiples plataformas.',
    sections: [
      {
        heading: 'Por qué el formato correcto importa en cada plataforma',
        content: 'Cada plataforma de video tiene un formato nativo que maximiza el espacio de pantalla y la experiencia del usuario:\n\n**TikTok, Instagram Reels, YouTube Shorts:** Formato vertical 9:16. Los videos horizontales en estas plataformas se ven con barras negras arriba y abajo, ocupando menos del 50% de la pantalla. Esto reduce drásticamente la retención y el engagement.\n\n**YouTube, Twitch, Kick:** Formato horizontal 16:9. El formato estándar para contenido de larga duración y clips de gaming.\n\nPublicar un clip horizontal en TikTok sin adaptarlo es desperdiciar el 50% de la pantalla. Publicar un clip vertical en YouTube se ve poco profesional. El formato correcto no es opcional — es la base mínima para que el contenido funcione.\n\nClipealo genera tus clips en ambos formatos automáticamente en los 5 minutos de procesamiento.'
      },
      {
        heading: 'Cómo funciona el reencuadre automático de Clipealo',
        content: 'Cuando Clipealo genera un clip en formato 9:16 a partir de un video 16:9, la IA realiza un reencuadre inteligente:\n\n1. **Detecta al hablante principal:** Identifica la posición del speaker en cada frame\n2. **Centra el encuadre:** Mantiene al hablante centrado en el formato vertical\n3. **Sigue el movimiento:** Si el hablante se mueve, el encuadre lo sigue suavemente\n4. **Posiciona los subtítulos:** Los coloca en la zona óptima del formato vertical\n\nEl resultado es un clip vertical que se ve como si hubiera sido grabado en vertical, no como un recorte mecánico de un video horizontal. El hablante siempre está en el centro, los subtítulos son legibles y la composición visual es profesional.\n\nTodo esto ocurre automáticamente durante los 5 minutos de procesamiento. No necesitas ajustar nada manualmente.'
      },
      {
        heading: '16:9 para YouTube y Twitch: cuándo y cómo usarlo',
        content: 'El formato 16:9 es ideal para:\n\n- **Clips de gaming en YouTube:** Los viewers de YouTube esperan contenido horizontal. Los clips de gameplay se ven mejor en 16:9 con toda la interfaz del juego visible.\n- **Recopilaciones y highlights:** Cuando armas un video compilación de los mejores momentos, el formato horizontal permite más contexto visual.\n- **Contenido para Twitch y Kick:** Clips que se comparten en estas plataformas mantienen el formato nativo del stream.\n\nClipealo genera automáticamente la versión 16:9 de tus clips manteniendo el encuadre original del video fuente con subtítulos integrados en la parte inferior.'
      },
      {
        heading: '9:16 para TikTok, Reels y Shorts: cuándo y cómo usarlo',
        content: 'El formato 9:16 es obligatorio para:\n\n- **TikTok:** La plataforma de video corto más importante para descubrimiento orgánico. Los videos verticales reciben 3x más distribución que los horizontales.\n- **Instagram Reels:** El formato de mayor alcance en Instagram. Los Reels verticales dominan el Explore y el feed.\n- **YouTube Shorts:** El formato de video corto de YouTube con distribución masiva en la pestaña Shorts.\n\nClipealo genera clips verticales con reencuadre automático inteligente. El hablante siempre está centrado, los subtítulos se posicionan en la zona inferior y la composición visual es profesional.\n\nPara cliperos y agencias que publican en las 3 plataformas, tener la versión 9:16 lista automáticamente ahorra 15-20 minutos de reencuadre manual por clip.'
      },
      {
        heading: 'Exportar en múltiples formatos vs reencuadre manual: comparativa',
        content: '**Reencuadre manual por clip:**\n- Abrir el clip en un editor (Premiere, CapCut, etc.)\n- Crear una nueva secuencia en 9:16\n- Ajustar el encuadre frame por frame\n- Reposicionar subtítulos para el nuevo formato\n- Exportar la nueva versión\n- **Tiempo: 15-20 minutos por clip**\n\n**Reencuadre automático con Clipealo:**\n- El clip se genera en ambos formatos durante los 5 minutos de procesamiento\n- El reencuadre es inteligente: sigue al hablante\n- Los subtítulos se adaptan automáticamente\n- **Tiempo adicional: 0 minutos**\n\nPara un clipero que produce 10 clips por video, el reencuadre manual de todos a formato vertical toma 2.5-3 horas. Con Clipealo, ese tiempo es cero.'
      },
      {
        heading: 'Para quién es ideal: cliperos, agencias y creadores multiplataforma',
        content: '**Cliperos profesionales:** Publican clips de sus streamers en TikTok, Reels y Shorts simultáneamente. Necesitan las dos versiones de cada clip sin reencuadrar manualmente.\n\n**Agencias de contenido:** Entregan clips a sus clientes formateados para cada plataforma. La exportación dual ahorra el paso de post-producción que antes requería un editor.\n\n**Creadores multiplataforma:** Publican en 3-4 plataformas y necesitan que cada clip se vea nativo en cada una.\n\n**Equipos de marketing:** Producen contenido para redes sociales y YouTube simultáneamente a partir de webinars y presentaciones.\n\nClipealo procesa cada video en 5 minutos, genera hasta 10 clips y los entrega en ambos formatos. Desde S/.48/mes.'
      },
    ],
    faqs: [
      { question: '¿Puedo exportar el mismo clip en los dos formatos a la vez?', answer: 'Sí. Puedes descargar cada clip en formato 9:16 y 16:9 simultáneamente.' },
      { question: '¿El reencuadre automático funciona bien con múltiples personas en pantalla?', answer: 'La IA detecta al hablante principal y centra el encuadre en él. Funciona mejor con 1-2 personas en pantalla.' },
      { question: '¿Puedo ajustar manualmente el encuadre si la IA no lo hace bien?', answer: 'Sí. Puedes modificar el punto de enfoque del reencuadre antes de exportar.' },
      { question: '¿Los subtítulos se adaptan al formato automáticamente?', answer: 'Sí. Los subtítulos se reposicionan automáticamente para cada formato, optimizados para la zona de lectura de cada plataforma.' },
      { question: '¿En qué plan está disponible?', answer: 'La exportación en dos formatos está disponible en todos los planes. Desde S/.48/mes.' },
    ],
    internalLinks: [
      { label: 'Ver precios de Clipealo', href: '/precios' },
      { label: 'Clips automáticos con IA', href: '/funciones/clips-automaticos-con-ia' },
    ],
    isoDate: TODAY_ISO,
    displayDate: TODAY_DISPLAY,
  },
  {
    slug: 'ia-entrenada-contenido-latam',
    metaTitle: 'IA Entrenada en Contenido LATAM — Clipealo',
    metaDescription: 'Clipealo detecta momentos virales en español latino. Entiende jerga local, contexto cultural y ritmo del contenido de LATAM. La única herramienta de clipping nativa para la región.',
    h1: 'IA entrenada en contenido LATAM: entiende el español latino, no el genérico',
    intro: 'La mayoría de herramientas de clipping están entrenadas en inglés o español neutro. Clipealo detecta momentos virales en español latino — entiende jerga peruana, mexicana, argentina y colombiana, reconoce el ritmo del contenido de creadores LATAM y ajusta sus detecciones al contexto cultural de la región. Procesa cualquier video en 5 minutos y genera hasta 10 clips.',
    sections: [
      {
        heading: 'Por qué las herramientas globales fallan con contenido en español latino',
        content: 'Las herramientas de clipping como Opus Clip, WayinVideo y otras están diseñadas para el mercado angloparlante. Cuando procesan contenido en español, enfrentan tres problemas:\n\n**1. Transcripción deficiente:** Los modelos de voz entrenados en inglés cometen errores frecuentes con acentos latinoamericanos, modismos y jerga local. "Causa" no es una causa, es un amigo. "Pata" no es una extremidad, es un compañero.\n\n**2. Detección de momentos incorrecta:** Los picos de energía en contenido LATAM tienen un ritmo diferente al contenido en inglés. Lo que suena como un momento normal para un modelo entrenado en inglés puede ser un momento viral para la audiencia latina.\n\n**3. Contexto cultural perdido:** Los momentos que funcionan en TikTok LATAM son diferentes a los de TikTok US. Las reacciones, el humor y las referencias culturales que generan engagement en la región no son captadas por modelos genéricos.\n\nClipealo resuelve estos tres problemas con una IA entrenada específicamente en contenido de creadores latinoamericanos.'
      },
      {
        heading: 'Qué significa que la IA esté entrenada en contenido LATAM',
        content: 'Clipealo fue entrenada con miles de horas de contenido de creadores latinoamericanos: streamers de Twitch y Kick, podcasters, entrevistadores y educadores de toda la región.\n\nEsto significa que el modelo de IA:\n\n- **Transcribe con precisión** el español latino, incluyendo modismos, jerga y expresiones coloquiales de cada país\n- **Detecta el ritmo correcto** de los momentos virales en español: las reacciones, los cambios de energía y el humor latino\n- **Entiende el contexto cultural:** sabe que "ta\' bueno" es aprobación, que "qué roche" es vergüenza, que "no manches" es sorpresa\n- **Genera títulos y descripciones** en español natural, no en traducciones de inglés\n\nEl resultado: clips que suenan y se leen como contenido nativo, no como contenido traducido. Todo generado en 5 minutos con hasta 10 clips por video.'
      },
      {
        heading: 'Cómo detecta momentos virales en español: jerga, ritmo y contexto',
        content: 'La detección de momentos virales en Clipealo combina tres señales:\n\n**Señal de audio:** Picos de volumen, cambios de tono, risas, exclamaciones. Pero calibrados para el español latino — donde la energía base del contenido es diferente al inglés.\n\n**Señal lingüística:** Análisis del contenido hablado para detectar declaraciones impactantes, historias personales, consejos prácticos y opiniones polémicas. Todo en español, con comprensión de jerga y modismos.\n\n**Señal de estructura:** Identificación de segmentos autocontenidos que funcionan como clips independientes — con inicio, desarrollo y cierre naturales.\n\nEstas tres señales se combinan para generar un score de viralidad por cada clip detectado. Los clips con mayor score son los que tienen más probabilidad de funcionar en TikTok, Reels y Shorts para audiencias latinoamericanas.'
      },
      {
        heading: 'Diferencias entre Clipealo y herramientas globales como Opus Clip o WayinVideo',
        content: '**Clipealo:**\n- IA entrenada en español latino\n- Precios en soles peruanos (desde S/.48/mes)\n- 5 minutos de procesamiento, hasta 10 clips por video\n- Soporte en español\n- Fuentes: YouTube, Twitch, Kick, Facebook, Google Drive y Zoom público sin contraseña\n- Funciones para agencias: plantillas de marca, exportación en masa\n\n**Opus Clip:**\n- IA entrenada principalmente en inglés\n- Precios en USD (desde $19/mes)\n- Sin especialización en español latino\n- Soporte en inglés\n- Sin plantillas de marca por cliente\n\n**WayinVideo:**\n- IA funcional pero genérica\n- Precios en USD\n- Sin optimización para contenido LATAM\n- Funcionalidades básicas\n- Sin exportación en masa\n\nPara creadores, cliperos y agencias en LATAM que trabajan con contenido en español, Clipealo ofrece mejor precisión de transcripción, mejor detección de momentos y funcionalidades diseñadas para la operación de agencias y cliperos profesionales.'
      },
      {
        heading: 'Para qué países y acentos funciona mejor',
        content: 'Clipealo funciona con español de toda Latinoamérica. La IA ha sido entrenada con contenido de:\n\n- **Perú:** Reconoce jerga peruana, referencias culturales locales y el acento característico\n- **México:** Entiende expresiones mexicanas, modismos y el ritmo del contenido mexicano\n- **Argentina:** Procesa el voseo, las expresiones rioplatenses y el acento argentino\n- **Colombia:** Detecta expresiones colombianas y el estilo de contenido local\n- **Chile, Ecuador, Venezuela, República Dominicana** y otros países de la región\n\nTambién funciona con contenido en inglés, pero su ventaja competitiva está en el español latino — donde las herramientas globales fallan.\n\nEl procesamiento toma 5 minutos independientemente del acento o país, generando hasta 10 clips por video.'
      },
      {
        heading: 'Por qué esto importa para agencias y cliperos que trabajan con marcas locales',
        content: 'Las agencias y cliperos que trabajan con marcas y creadores locales en LATAM necesitan una herramienta que entienda el contexto del mercado:\n\n**Precisión de subtítulos:** Los subtítulos con errores de transcripción se ven poco profesionales. Clipealo transcribe correctamente el español latino, incluyendo nombres propios, marcas locales y expresiones regionales.\n\n**Detección relevante:** Un momento que es viral para una audiencia peruana puede no serlo para una audiencia estadounidense, y viceversa. Clipealo detecta los momentos que funcionan para audiencias LATAM.\n\n**Títulos y descripciones naturales:** Los títulos generados por IA suenan como los escribiría un nativo, no como traducciones de inglés.\n\n**Precio accesible:** En soles peruanos, sin tipo de cambio. Desde S/.48/mes, accesible para agencias y cliperos independientes en la región.\n\nPara el mercado LATAM, Clipealo es la herramienta nativa. Las alternativas globales son herramientas de otro mercado adaptadas — no diseñadas — para la región.'
      },
    ],
    faqs: [
      { question: '¿Funciona con acento peruano, mexicano, argentino y colombiano?', answer: 'Sí. La IA está entrenada con contenido de todos los países de LATAM y reconoce los acentos y modismos de cada región.' },
      { question: '¿La IA entiende modismos y jerga local?', answer: 'Sí. Reconoce expresiones como "causa", "pata", "qué roche", "no manches" y cientos de modismos latinoamericanos.' },
      { question: '¿Funciona también con contenido en inglés?', answer: 'Sí. Clipealo procesa contenido en inglés y español. Pero su ventaja competitiva está en el español latino.' },
      { question: '¿Es mejor que Opus Clip para contenido en español?', answer: 'Sí. Clipealo está entrenada específicamente en español latino, lo que se traduce en mejor transcripción, mejor detección de momentos y subtítulos más precisos.' },
      { question: '¿Cuánto cuesta?', answer: 'Desde S/.48/mes. Precios en soles peruanos, sin tipo de cambio. Planes para cliperos, agencias y equipos.' },
    ],
    internalLinks: [
      { label: 'Ver precios de Clipealo', href: '/precios' },
      { label: 'Clips automáticos con IA', href: '/funciones/clips-automaticos-con-ia' },
    ],
    isoDate: TODAY_ISO,
    displayDate: TODAY_DISPLAY,
  },
];
