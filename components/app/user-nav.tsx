"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { ChevronsUpDown } from "lucide-react"

import { inicialesDe, useCuenta } from "@/hooks/use-cuenta"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"

/**
 * El contenido del menú se carga al abrirlo.
 *
 * Dentro hay media demo —campañas, planes, catálogo de planes, sonido, idioma
 * y el diálogo de comentarios—, y todo eso viajaba en la carcasa de CADA ruta
 * de la app y del backoffice aunque nadie desplegara el menú. Aquí solo queda
 * el botón: quién eres, que ya lo sabe la cuenta.
 */
const UserNavMenu = dynamic(
  () => import("@/components/app/user-nav-menu").then((m) => m.UserNavMenu),
  { ssr: false }
)

/** Se pide al acercar el puntero o al enfocar: para cuando se pulsa, ya está. */
const precargar = () => void import("@/components/app/user-nav-menu")

/** Quién es sale de la cuenta (`use-cuenta`): la demo «Ana Ruiz» o quien se acaba de registrar. */
export function UserNav() {
  const { cuenta } = useCuenta()
  // Una vez abierto se queda montado: desmontarlo al cerrar se llevaría por
  // delante el fundido de salida, que con «reducir movimiento» sigue viéndose
  const [abiertoAlgunaVez, setAbiertoAlgunaVez] = React.useState(false)
  const user = {
    name: cuenta.nombre,
    email: cuenta.correo,
    initials: inicialesDe(cuenta.nombre),
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu onOpenChange={(v) => v && setAbiertoAlgunaVez(true)}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent"
              onPointerEnter={precargar}
              onFocus={precargar}
            >
              <Avatar className="size-7 rounded-md">
                <AvatarFallback className="rounded-md bg-primary text-xs font-semibold text-primary-foreground">
                  {user.initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate text-sm font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          {abiertoAlgunaVez && <UserNavMenu nombre={user.name} correo={user.email} />}
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
