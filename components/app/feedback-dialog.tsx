"use client"

import * as React from "react"
import { MessageSquarePlus } from "lucide-react"
import { useTranslations } from "next-intl"

import { usePathname } from "@/i18n/navigation"
import { AHORA_DEMO } from "@/lib/fechas"
import { toast } from "@/lib/toast"
import { CUENTA_DEMO } from "@/lib/campanas"
import {
  FEEDBACK_NUEVO,
  TIPOS_FEEDBACK,
  feedbackDeBorrador,
  nuevoIdFeedback,
  validarFeedback,
  type BorradorFeedback,
  type TipoFeedback,
} from "@/lib/feedback"
import { useCampanas } from "@/hooks/use-campanas"
import { useFeedback } from "@/hooks/use-feedback"
import { useNombreCuenta } from "@/hooks/use-cuenta"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

/**
 * Escribirle al equipo.
 *
 * Se abre desde el menú de usuario y desde Ayuda, y guarda de qué pantalla
 * venía: «no entiendo esto» dicho en /wallet y dicho en /campanas son dos
 * problemas distintos, y esa es la mitad del valor de un comentario.
 *
 * Quién escribe NO se elige: sale del perfil de la cuenta. Una agencia que
 * pudiera escribir como clipero falsearía la cola del casillero.
 */
export function FeedbackDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {/* `key` al abrir: el formulario nace limpio cada vez, sin efectos */}
        {open && <Formulario onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}

function Formulario({ onDone }: { onDone: () => void }) {
  const t = useTranslations("feedback")
  const ruta = usePathname()
  const nombre = useNombreCuenta()
  const { perfil } = useCampanas()
  const { enviar } = useFeedback()
  const [b, setB] = React.useState<BorradorFeedback>(FEEDBACK_NUEVO)
  const [intento, setIntento] = React.useState(false)

  const aviso = validarFeedback(b)
  const malo = Boolean(intento && aviso?.bloquea) || undefined

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIntento(true)
    if (aviso?.bloquea) return
    enviar(
      feedbackDeBorrador(
        b,
        {
          // El id sale del texto y del instante, no de `Math.random()`: los
          // datos de la demo son deterministas a propósito
          id: nuevoIdFeedback(`${Date.now().toString(36)}${b.texto.length}`),
          autor: nombre,
          userId: CUENTA_DEMO.userId,
          de: perfil === "agencia" ? "agencia" : "clipero",
          ruta,
        },
        // El «ahora» de la demo, como el resto: la cola del casillero ordena
        // por fecha y con el reloj real este mensaje saldría del futuro
        AHORA_DEMO
      )
    )
    toast.success(t("enviado.title"), { description: t("enviado.description") })
    onDone()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <DialogHeader>
        <DialogTitle>{t("dialogo.title")}</DialogTitle>
        <DialogDescription>{t("dialogo.description")}</DialogDescription>
      </DialogHeader>

      <FieldSet>
        <FieldLegend variant="label">{t("dialogo.tipo")}</FieldLegend>
        <ToggleGroup
          type="single"
          variant="outline"
          spacing={2}
          value={b.tipo}
          onValueChange={(v) => v && setB((x) => ({ ...x, tipo: v as TipoFeedback }))}
          className="flex-wrap"
        >
          {TIPOS_FEEDBACK.map((id) => (
            <ToggleGroupItem
              key={id}
              value={id}
              data-sound="tap"
              className="transition-colors data-[state=on]:border-primary data-[state=on]:bg-accent"
            >
              {t(`tipos.${id}`)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </FieldSet>

      <Field data-invalid={malo}>
        <FieldLabel htmlFor="feedback-texto">{t("dialogo.texto")}</FieldLabel>
        <Textarea
          id="feedback-texto"
          rows={5}
          value={b.texto}
          aria-invalid={malo}
          placeholder={t("dialogo.textoPlaceholder")}
          onChange={(e) => setB((x) => ({ ...x, texto: e.target.value }))}
        />
        {/* La pantalla desde la que se manda, dicha: nada viaja a escondidas */}
        <FieldDescription>
          {ruta ? t("dialogo.desde", { ruta }) : t("dialogo.sinRuta")}
        </FieldDescription>
        {intento && aviso && (
          <FieldError>
            {t(`dialogo.errors.${aviso.code}`, {
              min: aviso.values?.min ?? 0,
              max: aviso.values?.max ?? 0,
            })}
          </FieldError>
        )}
      </Field>

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="ghost">
            {t("dialogo.cancel")}
          </Button>
        </DialogClose>
        <Button type="submit" variant="brand">
          <MessageSquarePlus /> {t("dialogo.send")}
        </Button>
      </DialogFooter>
    </form>
  )
}
