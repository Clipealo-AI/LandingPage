"use client"

import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"

/**
 * Acciones de un formulario de Ajustes: «Guardar cambios» solo se activa si hay
 * algo que guardar, y «Descartar» solo aparece entonces. Van debajo de la
 * tarjeta, alineadas a la derecha, como en la subida.
 */
export function SettingsSaveBar({
  dirty,
  invalid = false,
  onSave,
  onDiscard,
}: {
  dirty: boolean
  invalid?: boolean
  onSave: () => void
  onDiscard: () => void
}) {
  const t = useTranslations("settings.saveBar")
  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
      {dirty && (
        <Button variant="ghost" size="lg" onClick={onDiscard}>
          {t("discard")}
        </Button>
      )}
      <Button variant="brand" size="lg" disabled={!dirty || invalid} onClick={onSave}>
        {t("save")}
      </Button>
    </div>
  )
}
