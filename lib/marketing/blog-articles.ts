/** Editorial catalogue. All visible text lives in messages/<locale>/articles.json. */
export type BlogCategory = "Buenas Prácticas" | "Por Qué Importa" | "Guía de Inicio"

export interface BlogArticle {
  id: string
  category: BlogCategory
  cover: string
  isoDate: string
  modifiedDate: string
  author: { name: string }
}

const updated = "2026-09-25T00:00:00-05:00"
const author = { name: "Equipo Clipealo" }
const article = (
  id: string,
  category: BlogCategory,
  cover: number,
  isoDate: string
): BlogArticle => ({
  id,
  category,
  cover: `/marketing/blog/cover-${cover}.svg`,
  isoDate,
  modifiedDate: updated,
  author,
})

export const blogArticles: BlogArticle[] = [
  article("regla-3-segundos", "Buenas Prácticas", 1, "2025-02-15T00:00:00-05:00"),
  article(
    "convertir-4h-stream-clips",
    "Buenas Prácticas",
    2,
    "2025-02-12T00:00:00-05:00"
  ),
  article("83-streamers-abandona", "Por Qué Importa", 3, "2025-02-10T00:00:00-05:00"),
  article("7-momentos-virales", "Buenas Prácticas", 4, "2025-02-08T00:00:00-05:00"),
  article("de-2-a-10-clientes", "Guía de Inicio", 5, "2025-02-05T00:00:00-05:00"),
  article("clip-economy-latam", "Por Qué Importa", 6, "2025-02-03T00:00:00-05:00"),
  article("kick-vs-twitch", "Por Qué Importa", 7, "2025-02-01T00:00:00-05:00"),
  article("titulos-10x-clicks", "Buenas Prácticas", 8, "2025-01-28T00:00:00-05:00"),
  article("flujo-perfecto-clipero", "Buenas Prácticas", 9, "2025-01-25T00:00:00-05:00"),
  article(
    "streamers-clips-crecen-5x",
    "Por Qué Importa",
    10,
    "2025-01-22T00:00:00-05:00"
  ),
  article(
    "subtitulos-animados-retienen",
    "Guía de Inicio",
    11,
    "2025-01-20T00:00:00-05:00"
  ),
  article("latam-lidera-crecimiento", "Por Qué Importa", 12, "2025-01-18T00:00:00-05:00"),
  article(
    "como-convertir-entrevistas-en-clips-el-mismo-dia",
    "Guía de Inicio",
    13,
    "2026-05-03T00:00:00-05:00"
  ),
  article(
    "como-reducir-tiempo-edicion-clips-equipo",
    "Guía de Inicio",
    14,
    "2026-05-03T00:00:00-05:00"
  ),
  article(
    "como-reutilizar-webinars-linkedin-tiktok",
    "Guía de Inicio",
    15,
    "2026-05-03T00:00:00-05:00"
  ),
  article(
    "herramienta-clips-automaticos-para-agencias",
    "Guía de Inicio",
    16,
    "2026-05-03T00:00:00-05:00"
  ),
]
