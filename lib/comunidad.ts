import type { SocialId } from "@/lib/social"

type CreatorNetwork = SocialId | "kick"

export type ClientNetwork = CreatorNetwork | "twitch"

/** Cuentas y canales reales que aparecen en la landing de Clipealo. */
export interface ClientChannel {
  name: string
  networks: ClientNetwork[]
  /** Prueba social mostrada en producción junto al canal. */
  metric: string
  photo: string
}

export const CLIENT_CHANNELS: ClientChannel[] = [
  // Perfil oficial @turnoenvivo, YouTube y redes enlazadas desde turno.live.
  {
    name: "Turno",
    networks: ["youtube", "instagram", "tiktok", "x"],
    metric: "124 mil suscriptores",
    photo: "/clients/turno.webp",
  },
  {
    name: "EL CHUPAPI L4D",
    networks: ["kick", "tiktok"],
    metric: "200 seguidores",
    photo: "/clients/chupapi.jpeg",
  },
  {
    name: "Gatimixx",
    networks: ["twitch"],
    metric: "150 seguidores",
    photo: "/clients/gatimixx.png",
  },
  {
    name: "Skilpe",
    networks: ["tiktok"],
    metric: "+100K vistas",
    photo: "/clients/skilpe.jpeg",
  },
  {
    name: "RinNakaVT",
    networks: ["twitch"],
    metric: "400 seguidores",
    photo: "/clients/rinnakavt.png",
  },
  {
    name: "Evolutive Playbook",
    networks: ["linkedin", "youtube"],
    metric: "Canal de gestión",
    photo: "/clients/evolutive-playbook.jpg",
  },
  {
    name: "Jarod Blade",
    networks: ["tiktok"],
    metric: "850 seguidores",
    photo: "/clients/jarod-blade.jpeg",
  },
  {
    name: "SirGhostv",
    networks: ["youtube"],
    metric: "1.85K seguidores",
    photo: "/clients/sirghostv.jpg",
  },
]

export interface BrandProof {
  name: string
  icon:
    | "podcast"
    | "radio"
    | "newspaper"
    | "store"
    | "graduation"
    | "headphones"
    | "tv"
    | "landmark"
    | "mic"
    | "users"
  style: "heavy" | "caps"
}

/** Franja de equipos y marcas que acompaña a los canales de la comunidad. */
export const BRANDS: BrandProof[] = [
  { name: "Podcast Lima", icon: "podcast", style: "heavy" },
  { name: "Radio Andina", icon: "radio", style: "caps" },
  { name: "Kunan Media", icon: "newspaper", style: "heavy" },
  { name: "Tambo Digital", icon: "store", style: "caps" },
  { name: "Academia Nómada", icon: "graduation", style: "heavy" },
  { name: "Pulso FM", icon: "headphones", style: "caps" },
  { name: "Canal Sur", icon: "tv", style: "heavy" },
  { name: "Banco del Valle", icon: "landmark", style: "caps" },
  { name: "Ola Studio", icon: "mic", style: "heavy" },
  { name: "Creadores Perú", icon: "users", style: "caps" },
]
