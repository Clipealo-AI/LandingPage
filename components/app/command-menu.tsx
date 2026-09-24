"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useTheme } from "next-themes"
import {
  BarChart3,
  Clapperboard,
  FolderOpen,
  LayoutDashboard,
  Megaphone,
  Moon,
  Search,
  Settings,
  Sun,
  Upload,
  Wallet,
} from "lucide-react"

import { hrefDinamico, useRouter } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import { formatTimecode } from "@/lib/format"
import { clips, sourceVideos } from "@/lib/mock-data"
import { Button } from "@/components/ui/button"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"

/** `id` es la clave de `app.nav`, la misma que usa la barra lateral. */
const PAGES = [
  { href: "/dashboard", id: "dashboard", icon: LayoutDashboard },
  { href: "/proyectos", id: "projects", icon: FolderOpen },
  { href: "/analiticas", id: "analytics", icon: BarChart3 },
  { href: "/campanas", id: "campaigns", icon: Megaphone },
  { href: "/wallet", id: "wallet", icon: Wallet },
  { href: "/ajustes", id: "settings", icon: Settings },
] as const

/**
 * Paleta de comandos (⌘K).
 *
 * En una herramienta de edicion el teclado es el camino rapido: navegar entre
 * proyectos y saltar a un clip concreto sin soltar las manos.
 */
export function CommandMenu({ className }: { className?: string }) {
  const t = useTranslations("app")
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  const { setTheme } = useTheme()

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen((v) => !v)
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  const run = React.useCallback((action: () => void) => {
    setOpen(false)
    action()
  }, [])

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className={cn(
          "w-full justify-start gap-2 font-normal text-muted-foreground sm:w-64",
          className
        )}
      >
        <Search className="size-4" />
        <span className="truncate">{t("command.trigger")}</span>
        <KbdGroup className="ml-auto max-sm:hidden">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title={t("command.title")}
        description={t("command.description")}
      >
        <CommandInput placeholder={t("command.placeholder")} />
        <CommandList>
          <CommandEmpty>{t("command.empty")}</CommandEmpty>

          <CommandGroup heading={t("command.groups.actions")}>
            <CommandItem onSelect={() => run(() => router.push("/subir"))}>
              <Upload /> {t("nav.upload")}
            </CommandItem>
          </CommandGroup>

          <CommandGroup heading={t("command.groups.goTo")}>
            {PAGES.map(({ href, id, icon: Icon }) => (
              <CommandItem key={href} onSelect={() => run(() => router.push(href))}>
                <Icon /> {t(`nav.${id}`)}
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading={t("command.groups.projects")}>
            {sourceVideos.map((video) => (
              <CommandItem
                key={video.id}
                value={video.title}
                onSelect={() =>
                  run(() =>
                    router.push(hrefDinamico("/proyectos/[id]", { id: video.id }))
                  )
                }
              >
                <FolderOpen />
                <span className="truncate">{video.title}</span>
                <span
                  data-slot="timecode"
                  className="ml-auto text-xs text-muted-foreground tabular-nums"
                >
                  {formatTimecode(video.duration)}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandGroup heading={t("command.groups.clips")}>
            {clips.slice(0, 5).map((clip) => (
              <CommandItem
                key={clip.id}
                value={clip.title}
                onSelect={() =>
                  run(() =>
                    router.push(
                      hrefDinamico("/proyectos/[id]/clips/[clipId]", {
                        id: clip.sourceId,
                        clipId: clip.id,
                      })
                    )
                  )
                }
              >
                <Clapperboard />
                <span className="truncate">{clip.title}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {clip.aspect}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading={t("command.groups.theme")}>
            <CommandItem onSelect={() => run(() => setTheme("light"))}>
              <Sun /> {t("command.theme.light")}
            </CommandItem>
            <CommandItem onSelect={() => run(() => setTheme("dark"))}>
              <Moon /> {t("command.theme.dark")}
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
