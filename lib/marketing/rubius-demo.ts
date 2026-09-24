import records from "./rubius-demo.json";

const MEDIA_BASE =
  "https://storage.googleapis.com/clipealo-gpt-amigos-prod-v1/demos/landing/rubius/v6";

/** Tramo continuo del video de origen; los tiempos de los clips vienen de la BD. */
export const RUBIUS_SOURCE = {
  url: "https://www.youtube.com/watch?v=PlVQZbF1ijo",
  start: 355,
  end: 490,
  video: `${MEDIA_BASE}/overview.mp4`,
  poster: `${MEDIA_BASE}/overview.webp`,
} as const;

export const CLIPEALO_APP_URL = "https://app.clipealo-ai.com";

const clipPresentation = {
  "7eb2ce28-e16c-4e96-989a-133411c87d0a": {
    slug: "teclado",
    displayTitle: "El teclado de patos",
  },
  "9aef052e-2ec6-4bb1-8639-00ce3f628500": {
    slug: "indiana-jones",
    displayTitle: "El código de Indiana Jones",
  },
  "63278474-fe9d-4e34-9196-0a143c1c79c0": {
    slug: "premios",
    displayTitle: "250 millones de horas vistas",
  },
  "0cf08e11-e774-4482-a127-9c4e9a5547e7": {
    slug: "patos",
    displayTitle: "Teclas de pato",
  },
  "1ac312f5-243d-476e-8f34-3d96d1408f89": {
    slug: "puzle",
    displayTitle: "El puzle de Indiana Jones",
  },
  "79655d24-72d4-43de-a93e-8cb0eb7013ba": {
    slug: "pokemon",
    displayTitle: "Cartas Pokémon nivel pro",
  },
} as const;

export const RUBIUS_CLIPS = records.map((clip) => {
  const presentation =
    clipPresentation[clip.id as keyof typeof clipPresentation];
  if (!presentation) throw new Error(`Clip del demo desconocido: ${clip.id}`);

  return {
    ...clip,
    ...presentation,
    video: `${MEDIA_BASE}/${presentation.slug}.mp4`,
    poster: `${MEDIA_BASE}/${presentation.slug}.webp`,
  };
});

export const RUBIUS_PREVIEW_CLIPS = RUBIUS_CLIPS.filter(
  (clip) => clip.start >= RUBIUS_SOURCE.start && clip.end <= RUBIUS_SOURCE.end,
);

export type RubiusClip = (typeof RUBIUS_CLIPS)[number];
