"use client"

import * as React from "react"
import { Bell, CalendarClock, MessageSquare } from "lucide-react"
import { useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"
import { necesitanAtencion } from "@/lib/agenda"
import { CUENTA_DEMO } from "@/lib/campanas"
import { respuestasSinLeer } from "@/lib/feedback"
import { diaDe, ZONA_POR_DEFECTO } from "@/lib/fechas"
import { useAgenda } from "@/hooks/use-agenda"
import { useCuenta } from "@/hooks/use-cuenta"
import { useFormat } from "@/hooks/use-format"
import { useFeedback } from "@/hooks/use-feedback"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { MisionesAviso, useMisionesPendientes } from "@/components/onboarding/misiones"

/**
 * La campana de la topbar.
 *
 * Era un botón inerte con un punto naranja fijo de «tienes avisos sin leer»:
 * decía que había algo cuando no había nada y no se podía abrir. Ahora enseña
 * lo que de verdad pide una mano —una publicación que no salió, una cuenta que
 * se cayó— y cuando no hay nada lo dice en vez de fingir.
 *
 * El punto se pinta solo si hay algo. Ya no depende del plan: un envío fallido
 * hay que contarlo tenga el plan que tenga, porque publicar es de todos.
 *
 * Aquí viven también las primeras misiones, que antes eran una tarjeta en el
 * panel: ocupaba media pantalla para recordar tres cosas. Solo se enseñan las
 * que quedan —lo hecho no es un aviso— y las que el plan permite.
 */
export function AvisosBoton() {
  const t = useTranslations("app.topbar")
  const tFeedback = useTranslations("feedback")
  const f = useFormat()
  const { entradas, cuentas } = useAgenda()
  const { mensajes } = useFeedback()
  const { cuenta } = useCuenta()
  // El día civil de la cuenta, no el de UTC: es el mismo día que pinta el
  // calendario, y cortar el ISO mandaba la noche del sábado al domingo
  const zona = cuenta.perfilCanal?.zona ?? ZONA_POR_DEFECTO

  const pendientes = necesitanAtencion(entradas, cuentas)
  // Las primeras misiones también cuentan: son lo siguiente que hacer para
  // quien acaba de entrar, y se apagan solas al cumplirlas
  const misiones = useMisionesPendientes()
  // Y las respuestas del equipo sin abrir: es el otro aviso que el producto
  // sabe dar de verdad, y el que cierra el círculo de escribirle a alguien
  const respuestas = respuestasSinLeer(mensajes, CUENTA_DEMO.userId)
  const total = pendientes.length + respuestas.length + misiones

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t("notifications")}
          className="relative"
        >
          <Bell />
          {total > 0 && (
            <span className="absolute top-1 right-1 size-1.5 rounded-full bg-brand">
              <span className="sr-only">{t("unread", { n: total })}</span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <p className="border-b px-3 py-2 text-sm font-semibold">{t("notifications")}</p>
        <MisionesAviso />
        {respuestas.length > 0 && (
          <div className="border-b p-2">
            <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
              <Link href="/ayuda">
                <MessageSquare className="text-brand" aria-hidden />
                <span className="min-w-0 truncate">
                  {tFeedback("aviso.titulo", { n: respuestas.length })}
                </span>
              </Link>
            </Button>
          </div>
        )}
        {pendientes.length === 0 ? (
          respuestas.length === 0 && misiones === 0 ? (
            <p className="px-3 py-4 text-sm text-pretty text-muted-foreground">
              {t("empty")}
            </p>
          ) : null
        ) : (
          <ul className="max-h-80 divide-y overflow-y-auto">
            {pendientes.map((e) => (
              <li key={e.id}>
                <Link
                  href={{
                    pathname: "/calendario",
                    query: { dia: diaDe(e.programadaPara, zona) },
                  }}
                  className="flex gap-2 px-3 py-2.5 hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
                >
                  <CalendarClock
                    className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{e.titulo}</span>
                    <span className="block text-xs text-muted-foreground tabular-nums">
                      {f.dateTime(e.programadaPara)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <div className="border-t p-2">
          <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
            <Link href="/ajustes?seccion=notificaciones">{t("manage")}</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
