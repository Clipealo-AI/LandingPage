"use client"

import { MicroLugar } from "@/components/onboarding/micro-question"

/**
 * La micropregunta que toque en el panel, si toca alguna (§6.5-§6.6): como
 * mucho una por sesión y una cada 3 días, nunca en mitad de una tarea y
 * siempre con «Ahora no» y «No volver a preguntar».
 *
 * Isla de cliente: el panel sigue siendo una página de servidor.
 */
export function MicroPanel({ className }: { className?: string }) {
  return <MicroLugar lugar="panel" className={className} />
}
