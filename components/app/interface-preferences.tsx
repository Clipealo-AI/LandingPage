"use client"

import * as React from "react"
import { Volume2 } from "lucide-react"
import { useTranslations } from "next-intl"

import { burst } from "@/lib/effects"
import { playSound } from "@/lib/sound"
import { useSoundPreference } from "@/hooks/use-sound-preference"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

/**
 * Preferencias del dispositivo: por ahora, los sonidos. El idioma de la
 * interfaz vive en Perfil, junto al país.
 *
 * El interruptor suena al apagarse (el listener general lo oye antes de que se
 * apaguen) y al encenderse (aquí, después de encender). «Probar» deja oír el
 * sonido de un hito sin tener que publicar nada.
 */
export function InterfacePreferences() {
  const t = useTranslations("settings.interface")
  const [sonidos, setSonidos] = useSoundPreference()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <Label htmlFor="pref-sonidos" className="font-semibold">
              {t("sounds.label")}
            </Label>
            <p className="max-w-md text-sm text-pretty text-muted-foreground">
              {t("sounds.description")}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              disabled={!sonidos}
              onClick={(e) => {
                playSound("celebrate")
                burst(e.currentTarget)
              }}
            >
              <Volume2 /> {t("sounds.test")}
            </Button>
            <Switch
              id="pref-sonidos"
              checked={sonidos}
              onCheckedChange={(on) => {
                setSonidos(on)
                // Al encender, el listener general llegó antes y aún estaban apagados
                if (on) playSound("toggle-on")
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
