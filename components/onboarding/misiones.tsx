"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { ArrowRight, Check, Circle } from "lucide-react"
import { useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"
import { jobKeys, listJobs } from "@/lib/api/jobs"
import { cuentasDelPerfil } from "@/lib/onboarding"
import { misionesDe, type MisionId } from "@/lib/micro-preguntas"
import { redesDe } from "@/lib/planes"
import { puedeParticipar } from "@/lib/pricing"
import { SOCIAL_IDS, SOCIAL_NETWORKS, cuentaActiva, type SocialId } from "@/lib/social"
import { esId } from "@/lib/taxonomia"
import { cn } from "@/lib/utils"
import { useCampanas } from "@/hooks/use-campanas"
import { useCuenta } from "@/hooks/use-cuenta"
import { useCuentasSociales } from "@/hooks/use-cuentas-sociales"
import { useFormat } from "@/hooks/use-format"
import { usePlan } from "@/hooks/use-plan"

/**
 * La primera misión del clipero, con su estado y su enlace.
 *
 * `misionesDe` (§6.1) decidía las misiones desde antes de esto y no la llamaba
 * nadie: el render del onboarding pintaba tres frases fijas, todas con el
 * círculo vacío, sin enlace y sin la del primer proyecto.
 *
 * Cada misión lleva adónde se cumple de verdad, y lo hecho se dice con la
 * palabra «Hecho» además del icono: el estado nunca va solo en el color.
 *
 * Todo pasa antes por el plan: las de campañas no salen si el plan no deja
 * participar, y la de conectar nombra una red que el plan pueda conectar —con
 * Prueba, TikTok— en vez de la que la persona declaró y no podría usar.
 */

/** Dónde se cumple cada misión. */
const DESTINO = {
  proyecto: "/subir",
  unirse: { pathname: "/campanas", query: { orden: "para-ti" } },
  conectar: { pathname: "/ajustes", query: { seccion: "cuentas" } },
  enviar: { pathname: "/campanas", query: { vista: "participando" } },
} as const satisfies Record<MisionId, unknown>

export interface Mision {
  id: MisionId
  hecha: boolean
  texto: string
  href: (typeof DESTINO)[MisionId]
}

/**
 * Las misiones de esta cuenta con datos vivos: envíos y campañas privadas
 * desbloqueadas, proyectos de la frontera de datos y las redes ya conectadas.
 *
 * Los proyectos se piden sin `initialData` a propósito: esto se pinta también
 * en la bienvenida, que es estática, y una misión de más mientras carga es
 * mejor que exigirle a cada página que los traiga del servidor.
 */
export function useMisiones(): Mision[] {
  const t = useTranslations("common.misiones")
  const { cuenta } = useCuenta()
  const { plan } = usePlan()
  const { envios, desbloqueadas } = useCampanas()
  const { cuentas } = useCuentasSociales()
  const { data: proyectos } = useQuery({ queryKey: jobKeys.list(), queryFn: listJobs })

  const conectadas = cuentasDelPerfil(cuentas.filter(cuentaActiva))
  const delPlan = redesDe(plan)
  // La red que se nombra tiene que ser una que el plan pueda conectar: pedirle
  // a un Prueba que conecte su Instagram es mandarle a un candado
  const declarada = (cuenta.clipero.redes ?? []).find(
    (r): r is SocialId => esId(SOCIAL_IDS, r) && delPlan.includes(r)
  )
  const red = declarada ?? delPlan[0]

  return misionesDe(
    cuenta,
    {
      envios: envios.length,
      desbloqueadas: desbloqueadas.length,
      proyectos: proyectos?.length ?? 0,
    },
    conectadas,
    { participaEnCampanas: puedeParticipar(plan) }
  ).map((m) => ({
    ...m,
    href: DESTINO[m.id],
    texto:
      m.id === "conectar"
        ? red
          ? t("conectar", { red: SOCIAL_NETWORKS[red].name })
          : t("conectarRed")
        : t(m.id),
  }))
}

/** La lista numerada: cada misión es un enlace a donde se cumple. */
export function ListaMisiones({
  misiones,
  className,
}: {
  misiones: readonly Mision[]
  className?: string
}) {
  const t = useTranslations("common.misiones")
  const f = useFormat()

  return (
    <ol className={cn("space-y-3", className)}>
      {misiones.map((m, i) => (
        <li key={m.id}>
          <Link
            href={m.href}
            className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {m.hecha ? (
              <Check className="size-5 shrink-0 text-success" aria-hidden />
            ) : (
              <Circle className="size-5 shrink-0 text-muted-foreground" aria-hidden />
            )}
            <span className="tabular text-sm text-muted-foreground">
              {f.number(i + 1)}
            </span>
            <span className={cn("min-w-0 flex-1 font-medium", m.hecha && "line-through")}>
              {m.texto}
            </span>
            {/* El estado, escrito: nunca solo en el color ni solo en el icono */}
            <span className="shrink-0 text-sm text-muted-foreground">
              {m.hecha ? t("hecha") : t("pendiente")}
            </span>
          </Link>
        </li>
      ))}
    </ol>
  )
}

/**
 * Las misiones fuera del onboarding, dentro de la campana de avisos.
 *
 * Vivían en una tarjeta del panel que ocupaba media pantalla para recordar
 * tres cosas; aquí están donde se mira lo que queda por hacer, y solo se
 * enseña lo pendiente: lo ya hecho no es un aviso. Se va sola en cuanto no
 * queda ninguna.
 */
export function MisionesAviso() {
  const t = useTranslations("common.misiones")
  const f = useFormat()
  const misiones = useMisiones()
  const pendientes = misiones.filter((m) => !m.hecha)

  if (pendientes.length === 0) return null

  return (
    <div className="border-b">
      <p className="flex items-baseline justify-between gap-2 px-3 pt-2.5 pb-1 text-sm font-semibold">
        {t("titulo")}
        <span className="text-xs font-normal text-muted-foreground tabular-nums">
          {t("progreso", {
            hechas: f.number(misiones.length - pendientes.length),
            total: f.number(misiones.length),
          })}
        </span>
      </p>
      <ul className="pb-1">
        {pendientes.map((m) => (
          <li key={m.id}>
            <Link
              href={m.href}
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
            >
              <Circle className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="min-w-0 flex-1 truncate">{m.texto}</span>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Cuántas quedan: lo que enciende el punto de la campana. */
export function useMisionesPendientes() {
  return useMisiones().filter((m) => !m.hecha).length
}
