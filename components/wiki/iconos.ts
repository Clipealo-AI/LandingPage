import {
  BarChart3,
  BookOpen,
  CalendarClock,
  CreditCard,
  FolderOpen,
  GraduationCap,
  KeyRound,
  LifeBuoy,
  Megaphone,
  Scissors,
  Send,
  ShieldCheck,
  Sparkles,
  UserCog,
  Wallet,
  type LucideIcon,
} from "lucide-react"

import type { Area } from "@/lib/wiki/tipos"

/** El icono de cada área: los mismos que usa la barra lateral de la app donde coinciden. */
export const ICONO_AREA: Record<Area, LucideIcon> = {
  acceso: KeyRound,
  onboarding: Sparkles,
  proyectos: FolderOpen,
  operaciones: Scissors,
  publicar: Send,
  calendario: CalendarClock,
  analiticas: BarChart3,
  campanas: Megaphone,
  agencias: BookOpen,
  wallet: Wallet,
  planes: CreditCard,
  formacion: GraduationCap,
  cuenta: UserCog,
  ayuda: LifeBuoy,
  backoffice: ShieldCheck,
}
