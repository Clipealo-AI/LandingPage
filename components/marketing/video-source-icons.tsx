"use client"

import Image from "next/image"
import { Upload } from "lucide-react"
import { useTranslations } from "next-intl"

import {
  FacebookIcon,
  KickIcon,
  TwitchIcon,
  YouTubeIcon,
} from "@/components/brand/social-icons"
import type { VideoSourceId } from "@/lib/pricing"

const ICONS = {
  youtube: YouTubeIcon,
  kick: KickIcon,
  twitch: TwitchIcon,
  facebook: FacebookIcon,
} as const

const NAMES: Record<VideoSourceId, string> = {
  youtube: "YouTube",
  kick: "Kick",
  twitch: "Twitch",
  facebook: "Facebook",
  drive: "Google Drive",
  zoom: "Zoom",
}

/** La carga local es común a todos los planes; cada logo conserva su nombre accesible. */
export function VideoSourceIcons({ sources }: { sources: readonly VideoSourceId[] }) {
  const t = useTranslations("pricing.values")

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {sources.map((source) => {
        const Icon = source in ICONS ? ICONS[source as keyof typeof ICONS] : null
        return (
          <span
            key={source}
            title={NAMES[source]}
            className="grid size-8 shrink-0 place-items-center rounded-lg bg-white text-black ring-1 ring-border"
          >
            {Icon ? (
              <Icon tone="official" className="size-5" />
            ) : (
              <Image
                src={`/icons/${source === "drive" ? "drive.webp" : "zoom.svg"}`}
                alt={NAMES[source]}
                width={20}
                height={20}
                className="size-5 object-contain"
              />
            )}
          </span>
        )
      })}
      <span
        title={t("localUpload")}
        className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-foreground ring-1 ring-border"
      >
        <Upload className="size-4" role="img" aria-label={t("localUpload")} />
      </span>
    </div>
  )
}
