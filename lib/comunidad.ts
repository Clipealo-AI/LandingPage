import type { SocialId } from "@/lib/social"

export type CreatorNetwork = SocialId | "kick"

/** Cita de demostración que acompaña el formulario de inicio de sesión. */
export const AUTH_DEMO_TESTIMONIAL = {
  name: "Camila Quispe",
  network: "youtube",
  followers: 3_400_000,
} as const

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
  {
    name: "Turno",
    networks: ["youtube", "instagram", "tiktok", "x"],
    metric: "124 mil suscriptores en YouTube",
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
