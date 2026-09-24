"use client"

import * as React from "react"
import { useTranslations } from "next-intl"

import { PROVEEDOR_LABEL, PROVEEDORES, type Proveedor } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  AppleIcon,
  GoogleIcon,
  TikTokIcon,
  type SocialIconProps,
} from "@/components/brand/social-icons"

const ICONO: Record<Proveedor, React.ComponentType<SocialIconProps>> = {
  google: GoogleIcon,
  apple: AppleIcon,
  tiktok: TikTokIcon,
}

/**
 * «Continuar con…». Google a todo el ancho porque es el que más se usa; Apple
 * y TikTok debajo, a medias. Mientras uno está en marcha, los demás esperan.
 */
export function OAuthButtons({
  onContinuar,
  cargando,
  disabled,
}: {
  onContinuar: (p: Proveedor) => void
  cargando: Proveedor | null
  disabled?: boolean
}) {
  const t = useTranslations("auth.oauth")
  return (
    <div className="grid grid-cols-2 gap-3">
      {PROVEEDORES.map((p) => {
        const Icono = ICONO[p]
        return (
          <Button
            key={p}
            type="button"
            variant="outline"
            size="lg"
            className={p === "google" ? "col-span-2 h-11" : "h-11"}
            disabled={disabled || cargando !== null}
            onClick={() => onContinuar(p)}
          >
            {cargando === p ? (
              <Spinner />
            ) : (
              <Icono tone="official" className="size-5" aria-hidden />
            )}
            {t("continueWith", { provider: PROVEEDOR_LABEL[p] })}
          </Button>
        )
      })}
    </div>
  )
}
