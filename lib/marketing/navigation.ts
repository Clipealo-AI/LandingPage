import {
  BookOpenText,
  Building2,
  Captions,
  CircleHelp,
  Download,
  FolderKanban,
  Gamepad2,
  GraduationCap,
  MessageCircle,
  Palette,
  Scissors,
  Smartphone,
  Sparkles,
  Store,
  Trophy,
  Video,
} from "lucide-react"
import { WhatsAppIcon } from "@/components/brand/whatsapp-icon"
import { WHATSAPP_URL } from "@/lib/contact"

/** The public feature routes, kept in the same order as the deployed menu. */
export const featureNavigation = [
  { id: "automaticClips", slug: "clips-automaticos-con-ia", icon: Scissors },
  { id: "subtitleEditor", slug: "editor-subtitulos-estilos", icon: Captions },
  { id: "verticalExport", slug: "exporta-dos-formatos", icon: Smartphone },
  { id: "brandTemplates", slug: "plantillas-de-marca", icon: Palette },
  { id: "latamAi", slug: "ia-entrenada-contenido-latam", icon: Sparkles },
  { id: "batchExport", slug: "exportacion-en-masa", icon: Download },
  { id: "projectManagement", slug: "gestion-proyectos-carpetas", icon: FolderKanban },
] as const

/** Audience landing pages linked from the deployed use-case menu. */
export const useCaseNavigation = [
  { id: "cliperos", slug: "cliperos", icon: Scissors },
  { id: "streamers", slug: "streamers", icon: Gamepad2 },
  { id: "podcasters", slug: "podcasters", icon: MessageCircle },
  { id: "coaches", slug: "coaches", icon: GraduationCap },
  { id: "creators", slug: "creadores", icon: Video },
  { id: "communities", slug: "comunidades", icon: Trophy },
  { id: "agencies", slug: "agencias", icon: Building2 },
  { id: "brands", slug: "marcas", icon: Store },
] as const

/** Discord stays in the header shortcut; it is intentionally absent here. */
export const resourceNavigation = [
  { id: "blog", href: "/blog", icon: BookOpenText },
  { id: "faq", href: "/#faq", icon: CircleHelp },
  { id: "contact", href: WHATSAPP_URL, icon: WhatsAppIcon, external: true },
] as const
