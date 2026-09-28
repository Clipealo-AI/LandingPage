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
    photo: "/clients/turno.avif",
  },
  {
    name: "EL CHUPAPI L4D",
    networks: ["kick", "tiktok"],
    metric: "200 seguidores",
    photo: "/clients/chupapi.avif",
  },
  {
    name: "Gatimixx",
    networks: ["twitch"],
    metric: "150 seguidores",
    photo: "/clients/gatimixx.avif",
  },
  {
    name: "Skilpe",
    networks: ["tiktok"],
    metric: "+100K vistas",
    photo: "/clients/skilpe.avif",
  },
  {
    name: "RinNakaVT",
    networks: ["twitch"],
    metric: "400 seguidores",
    photo: "/clients/rinnakavt.avif",
  },
  {
    name: "Evolutive Playbook",
    networks: ["linkedin", "youtube"],
    metric: "Canal de gestión",
    photo: "/clients/evolutive-playbook.avif",
  },
  {
    name: "Jarod Blade",
    networks: ["tiktok"],
    metric: "850 seguidores",
    photo: "/clients/jarod-blade.avif",
  },
  {
    name: "SirGhostv",
    networks: ["youtube"],
    metric: "1.85K seguidores",
    photo: "/clients/sirghostv.avif",
  },
]
