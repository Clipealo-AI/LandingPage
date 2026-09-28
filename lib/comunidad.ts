import type { SocialId } from "@/lib/social"

type CreatorNetwork = SocialId | "kick"

export type ClientNetwork = CreatorNetwork | "twitch"

/** Cuentas y canales reales que aparecen en la landing de Clipealo. */
export interface ClientChannel {
  name: string
  networks: ClientNetwork[]
  photo: string
}

export const CLIENT_CHANNELS: ClientChannel[] = [
  // Perfil oficial @turnoenvivo, YouTube y redes enlazadas desde turno.live.
  {
    name: "Turno",
    networks: ["youtube", "instagram", "tiktok", "x"],
    photo: "/clients/turno.avif",
  },
  {
    name: "EL CHUPAPI L4D",
    networks: ["kick", "tiktok"],
    photo: "/clients/chupapi.avif",
  },
  {
    name: "Gatimixx",
    networks: ["twitch"],
    photo: "/clients/gatimixx.avif",
  },
  {
    name: "Skilpe",
    networks: ["tiktok"],
    photo: "/clients/skilpe.avif",
  },
  {
    name: "RinNakaVT",
    networks: ["twitch"],
    photo: "/clients/rinnakavt.avif",
  },
  {
    name: "Evolutive Playbook",
    networks: ["linkedin", "youtube"],
    photo: "/clients/evolutive-playbook.avif",
  },
  {
    name: "Jarod Blade",
    networks: ["tiktok"],
    photo: "/clients/jarod-blade.avif",
  },
  {
    name: "SirGhostv",
    networks: ["youtube"],
    photo: "/clients/sirghostv.avif",
  },
]
