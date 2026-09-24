import Image from "next/image"

import { cn } from "@/lib/utils"

export type PlatformId =
  | "youtube"
  | "twitch"
  | "kick"
  | "facebook"
  | "drive"
  | "zoom"
  | "tiktok"
  | "instagram"
  | "linkedin"
  | "x"

const ARCHIVOS: Record<PlatformId, string> = {
  youtube: "youtube.webp",
  twitch: "twitch.webp",
  kick: "kick.webp",
  facebook: "facebook.webp",
  drive: "drive.webp",
  zoom: "zoom.svg",
  tiktok: "tiktok.webp",
  instagram: "instagram.webp",
  linkedin: "linkedin.webp",
  x: "x.webp",
}

export const PLATFORM_LABELS: Record<PlatformId, string> = {
  youtube: "YouTube",
  twitch: "Twitch",
  kick: "Kick",
  facebook: "Facebook",
  drive: "Google Drive",
  zoom: "Zoom",
  tiktok: "TikTok",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  x: "X",
}

interface PlatformIconProps {
  platform: PlatformId
  size?: number
  alt?: string
  className?: string
}

/** Logos de redes en `public/platforms`, compartidos por la landing y las insignias. */
export function PlatformIcon({
  platform,
  size = 20,
  alt = "",
  className,
}: PlatformIconProps) {
  return (
    <Image
      src={`/platforms/${ARCHIVOS[platform]}`}
      alt={alt}
      aria-hidden={alt ? undefined : true}
      width={size}
      height={size}
      sizes={`${size}px`}
      className={cn("shrink-0 object-contain", className)}
    />
  )
}
