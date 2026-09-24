"use client"

import * as React from "react"
import { parseAsStringLiteral, useQueryState } from "nuqs"
import {
  Bell,
  CreditCard,
  Share2,
  ShieldCheck,
  User,
  Users,
  type LucideIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"

import { SECCIONES_AJUSTES, type SeccionAjustes } from "@/lib/ajustes"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AudienceSettings } from "@/components/app/audience-settings"
import { BillingSettings } from "@/components/app/billing-settings"
import { NotificationSettings } from "@/components/app/notification-settings"
import { PrivacySettings } from "@/components/app/privacy-settings"
import { ProfileSettings } from "@/components/app/profile-settings"
import { SocialAccounts } from "@/components/app/social-accounts"

const ICONO: Record<SeccionAjustes, LucideIcon> = {
  perfil: User,
  publico: Users,
  cuentas: Share2,
  notificaciones: Bell,
  datos: ShieldCheck,
  facturacion: CreditCard,
}

const CONTENIDO: Record<SeccionAjustes, React.ReactNode> = {
  perfil: <ProfileSettings />,
  publico: <AudienceSettings />,
  cuentas: <SocialAccounts />,
  notificaciones: <NotificationSettings />,
  datos: <PrivacySettings />,
  facturacion: <BillingSettings />,
}

/**
 * Las cinco secciones de Ajustes como pestañas. La elegida vive en la URL
 * (`?seccion=facturacion`), así que se puede enlazar y el botón atrás vuelve a
 * la anterior. En móvil la barra se desplaza en horizontal en vez de partirse;
 * con sitio, ocupa todo el ancho.
 *
 * `@container/ajustes`: las secciones reparten columnas según el ancho de esta
 * zona y no el de la ventana, porque la barra lateral plegada o abierta cambia
 * el sitio disponible sin cambiar la ventana.
 */
export function SettingsTabs() {
  const t = useTranslations("settings.tabs")
  const [seccion, setSeccion] = useQueryState(
    "seccion",
    parseAsStringLiteral(SECCIONES_AJUSTES)
      .withDefault("perfil")
      .withOptions({ history: "push" })
  )
  const carril = React.useRef<HTMLDivElement>(null)

  // En movil la tira no cabe: al entrar por `?seccion=datos` la pestana activa
  // quedaba fuera de pantalla y nada decia en que seccion estabas. Se centra
  // moviendo solo el carril (nunca la pagina) y sin desplazamiento animado.
  React.useEffect(() => {
    const tira = carril.current
    const activa = tira?.querySelector<HTMLElement>('[data-state="active"]')
    if (!tira || !activa) return
    const caja = tira.getBoundingClientRect()
    const pestana = activa.getBoundingClientRect()
    tira.scrollLeft += pestana.left - caja.left - (caja.width - pestana.width) / 2
  }, [seccion])

  return (
    <Tabs
      value={seccion}
      onValueChange={(v) => void setSeccion(v as SeccionAjustes)}
      className="@container/ajustes gap-6"
    >
      <div
        ref={carril}
        className="-mx-(--gutter-app) overflow-x-auto px-(--gutter-app) pb-1 sm:mx-0 sm:px-0"
      >
        <TabsList className="w-max p-1 group-data-horizontal/tabs:h-11 @3xl/ajustes:w-full">
          {SECCIONES_AJUSTES.map((id) => {
            const Icono = ICONO[id]
            return (
              <TabsTrigger
                key={id}
                value={id}
                className="gap-2 px-3.5 text-sm @3xl/ajustes:flex-1"
              >
                <Icono aria-hidden />
                {t(id)}
              </TabsTrigger>
            )
          })}
        </TabsList>
      </div>

      {SECCIONES_AJUSTES.map((id) => (
        <TabsContent key={id} value={id}>
          {CONTENIDO[id]}
        </TabsContent>
      ))}
    </Tabs>
  )
}
