"use client"

import * as React from "react"
import {
  BadgeCheck,
  BookOpen,
  Building2,
  CreditCard,
  Languages,
  LogOut,
  MessageSquarePlus,
  RotateCcw,
  Settings,
  ShieldCheck,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react"
import { useTranslations } from "next-intl"

import { Link, useRouter } from "@/i18n/navigation"
import { LOCALE_NAME, LOCALE_TAG, routing, type Locale } from "@/i18n/routing"
import { playSound } from "@/lib/sound"
import { toast } from "@/lib/toast"
import { planesAsignables } from "@/lib/planes"
import { useSoundPreference } from "@/hooks/use-sound-preference"
import { useCampanas } from "@/hooks/use-campanas"
import { useCatalogoPlanes } from "@/hooks/use-catalogo-planes"
import { usePlan } from "@/hooks/use-plan"
import {
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"
import { useNombrePlan } from "@/components/planes/nombre-plan"
import { useCambiarIdioma } from "@/components/shared/locale-switcher"
import { FeedbackDialog } from "@/components/app/feedback-dialog"

/**
 * Lo que hay dentro del menú de usuario, en su propio trozo.
 *
 * Se carga al abrirlo (`user-nav.tsx`), porque de aquí cuelgan las campañas,
 * los planes, el catálogo de planes y el diálogo de comentarios: media demo
 * viajando en la carcasa de todas las rutas para un menú que casi nadie
 * despliega.
 */
export function UserNavMenu({ nombre, correo }: { nombre: string; correo: string }) {
  const t = useTranslations("app")
  const tLocale = useTranslations("common.locale")
  const tFeedback = useTranslations("feedback")
  const idioma = useCambiarIdioma()
  const router = useRouter()
  const [sonidos, setSonidos] = useSoundPreference()
  const [comentando, setComentando] = React.useState(false)
  const { perfil, cambiarPerfil, reiniciar } = useCampanas()
  const { plan, cambiarPlan } = usePlan()
  const nombrePlan = useNombrePlan()
  // También los ocultos: un plan hecho a medida en el backoffice se prueba desde aquí
  const planes = planesAsignables(useCatalogoPlanes())

  return (
    <>
      <DropdownMenuContent side="top" align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-medium">{nombre}</p>
          <p className="text-xs text-muted-foreground">{correo}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/#precios">
              <Sparkles /> {t("userNav.upgrade")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/ajustes?seccion=facturacion">
              <CreditCard /> {t("userNav.billing")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/ajustes">
              <Settings /> {t("nav.settings")}
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {/* A mano, sin ir a Ajustes: quien los encuentra molestos tiene que poder
            apagarlos en el momento */}
        <DropdownMenuCheckboxItem
          checked={sonidos}
          onCheckedChange={(on) => {
            // Apagar suena antes de apagar; encender, después de encender
            if (!on) playSound("toggle-off")
            setSonidos(on)
            if (on) playSound("toggle-on")
          }}
          onSelect={(e) => e.preventDefault()}
        >
          {sonidos ? <Volume2 /> : <VolumeX />} {t("userNav.sounds")}
        </DropdownMenuCheckboxItem>
        {/* Junto a los sonidos: preferencias de la interfaz a mano, sin ir a Ajustes */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger aria-busy={idioma.pendiente || undefined}>
            <Languages /> {tLocale("label")}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="min-w-44">
            <DropdownMenuRadioGroup
              value={idioma.locale}
              onValueChange={(value) => idioma.cambiar(value as Locale)}
            >
              {routing.locales.map((l) => (
                // Cada idioma en su propio idioma, con su `lang` para lectores de pantalla
                <DropdownMenuRadioItem key={l} value={l} lang={LOCALE_TAG[l]}>
                  {LOCALE_NAME[l]}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        {/* Demostración: en producción el perfil lo concede el admin (/admin/campanas) */}
        <DropdownMenuLabel className="flex items-center gap-1.5 text-xs font-normal text-muted-foreground">
          <Building2 className="size-3.5" aria-hidden /> {t("userNav.profile")}
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={perfil}
          onValueChange={(v) => cambiarPerfil(v as typeof perfil)}
        >
          <DropdownMenuRadioItem value="usuario" onSelect={(e) => e.preventDefault()}>
            {t("userNav.profiles.usuario")}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="agencia" onSelect={(e) => e.preventDefault()}>
            {t("userNav.profiles.agencia")}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        {/* Demostración: en producción el plan lo pone la pasarela de pago.
            Va aquí, junto al perfil, porque son los dos ejes que deciden qué
            se puede hacer, y porque desde aquí se juzga la vista que hay
            detrás sin salir de ella. `BadgeCheck` y no `Sparkles`: ese ya es
            el de «Mejorar plan», dos ítems más arriba. */}
        <DropdownMenuLabel className="flex items-center gap-1.5 text-xs font-normal text-muted-foreground">
          <BadgeCheck className="size-3.5" aria-hidden /> {t("userNav.plan")}
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup value={plan.id} onValueChange={cambiarPlan}>
          {planes.map((p) => (
            <DropdownMenuRadioItem
              key={p.id}
              value={p.id}
              onSelect={(e) => e.preventDefault()}
            >
              {nombrePlan(p)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        {/* Solo para operadores; en producción se muestra según el rol de la sesión */}
        <DropdownMenuItem asChild>
          <Link href="/admin">
            <ShieldCheck /> {t("userNav.backoffice")}
          </Link>
        </DropdownMenuItem>
        {/* La wiki del producto: acciones, API y marca, para el equipo */}
        <DropdownMenuItem asChild>
          <Link href="/docs">
            <BookOpen /> {t("userNav.wiki")}
          </Link>
        </DropdownMenuItem>
        {/* Escribirle al equipo, a mano desde cualquier pantalla: el
            mensaje guarda de dónde venía, que es la mitad de su valor */}
        <DropdownMenuItem onSelect={() => setComentando(true)}>
          <MessageSquarePlus /> {tFeedback("abrir")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {/* Demostración: devuelve este navegador al estado de fábrica.
            `reiniciar` existía y no lo llamaba ningún botón */}
        <DropdownMenuItem
          onSelect={async () => {
            await reiniciar()
            toast.success(t("userNav.resetDone"), {
              description: t("userNav.resetDoneHint"),
            })
          }}
        >
          <RotateCcw /> {t("userNav.reset")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {/* Sin sesión que destruir todavía: lo que sí se puede hacer es
            llevar a la pantalla de acceso, que es lo que se espera al
            pulsarlo. El aviso dice que la sesión aún no es de verdad */}
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => {
            toast(t("userNav.logoutDone"), {
              description: t("userNav.logoutHint"),
            })
            router.push("/login")
          }}
        >
          <LogOut /> {t("userNav.logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>

      <FeedbackDialog open={comentando} onOpenChange={setComentando} />
    </>
  )
}
