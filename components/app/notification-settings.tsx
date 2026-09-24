"use client"

import * as React from "react"
import { useTranslations } from "next-intl"

import { CANALES_AVISO, TIPOS_AVISO } from "@/lib/ajustes"
import { useAvisos } from "@/hooks/use-avisos"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { InterfacePreferences } from "@/components/app/interface-preferences"

/**
 * Qué avisos llegan y por dónde. Sin botón de guardar: cada interruptor se
 * aplica al momento y ya suena al cambiar, así que no hace falta otro aviso.
 * Al lado (debajo en pantallas estrechas), las preferencias de la interfaz: sus
 * sonidos, que también son una forma de avisar, y su idioma.
 *
 * La elección se guarda (`useAvisos`). Era un `useState`: apagar «Novedades»
 * duraba hasta cambiar de pestaña y nadie avisaba de que no se guardaba nada.
 */
export function NotificationSettings() {
  const t = useTranslations("settings.notifications")
  const { avisos, cambiar } = useAvisos()

  return (
    <div className="grid items-start gap-4 @5xl/ajustes:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div role="table" aria-label={t("tableLabel")} className="divide-y">
            <div
              role="row"
              className="hidden pb-2 text-xs font-medium text-muted-foreground sm:grid sm:grid-cols-[1fr_6rem_6rem]"
            >
              <span role="columnheader">{t("column")}</span>
              {CANALES_AVISO.map((c) => (
                <span key={c} role="columnheader" className="text-center">
                  {t(`channels.${c}`)}
                </span>
              ))}
            </div>

            {TIPOS_AVISO.map((tipo) => (
              <div
                key={tipo.id}
                role="row"
                className="grid gap-3 py-3.5 sm:grid-cols-[1fr_6rem_6rem] sm:items-center"
              >
                <div role="rowheader" className="min-w-0 space-y-0.5">
                  <p className="text-sm font-medium">{t(`types.${tipo.id}.title`)}</p>
                  <p className="text-sm text-muted-foreground">
                    {t(`types.${tipo.id}.description`)}
                  </p>
                </div>
                {CANALES_AVISO.map((canal) => {
                  const id = `aviso-${tipo.id}-${canal}`
                  return (
                    <div
                      role="cell"
                      key={canal}
                      className="flex items-center gap-2 sm:justify-center"
                    >
                      <Switch
                        id={id}
                        checked={avisos[tipo.id][canal]}
                        aria-label={t(`switchLabel.${canal}`, {
                          type: t(`types.${tipo.id}.title`),
                        })}
                        onCheckedChange={(on) => cambiar(tipo.id, canal, on)}
                      />
                      {/* En móvil no hay cabecera de columnas: la etiqueta va al lado */}
                      <Label
                        htmlFor={id}
                        className="text-xs font-normal text-muted-foreground sm:sr-only"
                      >
                        {t(`channels.${canal}`)}
                      </Label>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <InterfacePreferences />
    </div>
  )
}
