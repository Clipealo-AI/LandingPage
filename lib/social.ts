/** Destinos de publicación soportados por Clipealo. */
const SOCIAL_IDS = ["tiktok", "instagram", "youtube", "x", "linkedin", "facebook"] as const

export type SocialId = (typeof SOCIAL_IDS)[number]

type SocialNetwork = {
  id: SocialId
  name: string
  surface: string
  maxSeconds: number
  sweetSpot: [number, number]
}

const SOCIAL_NETWORKS: Record<SocialId, SocialNetwork> = {
  tiktok: {
    id: "tiktok",
    name: "TikTok",
    surface: "Para ti",
    maxSeconds: 600,
    sweetSpot: [21, 60],
  },
  instagram: {
    id: "instagram",
    name: "Instagram",
    surface: "Reels",
    maxSeconds: 180,
    sweetSpot: [15, 45],
  },
  youtube: {
    id: "youtube",
    name: "YouTube",
    surface: "Shorts",
    maxSeconds: 60,
    sweetSpot: [25, 55],
  },
  x: {
    id: "x",
    name: "X",
    surface: "Cronología",
    maxSeconds: 140,
    sweetSpot: [20, 60],
  },
  linkedin: {
    id: "linkedin",
    name: "LinkedIn",
    surface: "Feed profesional",
    maxSeconds: 600,
    sweetSpot: [30, 90],
  },
  facebook: {
    id: "facebook",
    name: "Facebook",
    surface: "Reels y feed",
    maxSeconds: 90,
    sweetSpot: [15, 45],
  },
}

export const socialList = SOCIAL_IDS.map((id) => SOCIAL_NETWORKS[id])
