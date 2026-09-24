"use client"

import * as React from "react"
import { MessageSquarePlus } from "lucide-react"
import { useTranslations } from "next-intl"

import { CUENTA_DEMO } from "@/lib/campanas"
import { misFeedbacks, type Feedback } from "@/lib/feedback"
import { useFeedback } from "@/hooks/use-feedback"
import { useFormat } from "@/hooks/use-format"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FeedbackDialog } from "@/components/app/feedback-dialog"

/**
 * Ayuda › Tus mensajes: lo que le has escrito al equipo y lo que te ha
 * contestado.
 *
 * Es la otra mitad del casillero. Sin esto, responder desde el backoffice no
 * serviría de nada y la promesa de «lo lee el equipo, y se responde» sería una
 * frase suelta.
 *
 * Al abrirse deja de estar «sin leer», que es lo que apaga el aviso de la
 * campana: se marca en un manejador y no en un efecto, para que nadie pierda la
 * marca por un render de más.
 */
export function MisMensajes() {
  const t = useTranslations("feedback")
  const { mensajes, visto } = useFeedback()
  const [comentando, setComentando] = React.useState(false)

  const mios = misFeedbacks(mensajes, CUENTA_DEMO.userId)

  return (
    <section aria-labelledby="mis-mensajes" className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h2 id="mis-mensajes" className="text-lg font-bold tracking-tight">
            {t("mios.title")}
          </h2>
          <p className="text-sm text-pretty text-muted-foreground">
            {t("mios.description")}
          </p>
        </div>
        <Button variant="outline" onClick={() => setComentando(true)}>
          <MessageSquarePlus /> {t("abrir")}
        </Button>
      </div>

      {mios.length === 0 ? (
        <p className="text-sm text-pretty text-muted-foreground">{t("mios.empty")}</p>
      ) : (
        <ul className="grid gap-3">
          {mios.map((m) => (
            <Mensaje key={m.id} mensaje={m} onVisto={() => visto(m)} />
          ))}
        </ul>
      )}

      <FeedbackDialog open={comentando} onOpenChange={setComentando} />
    </section>
  )
}

function Mensaje({ mensaje, onVisto }: { mensaje: Feedback; onVisto: () => void }) {
  const t = useTranslations("feedback")
  const f = useFormat()

  return (
    <li className="space-y-3 rounded-xl bg-card p-4 ring-1 ring-border">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        <Badge variant="outline">{t(`tipos.${mensaje.tipo}`)}</Badge>
        <Badge variant={mensaje.estado === "respondido" ? "success" : "secondary"}>
          {t(`estados.${mensaje.estado}`)}
        </Badge>
        {mensaje.sinLeer && <Badge variant="warning">{t("mios.sinLeer")}</Badge>}
        <span className="text-muted-foreground tabular-nums">
          {t("mios.enviado", { fecha: f.date(mensaje.creadoEn) })}
        </span>
        {mensaje.ruta && (
          <span className="text-muted-foreground">
            {t("mios.desde", { ruta: mensaje.ruta })}
          </span>
        )}
      </div>

      {/* Lo que escribió, tal cual: ni se traduce ni se reescribe */}
      <p className="text-sm whitespace-pre-line">{mensaje.texto}</p>

      {mensaje.respuesta ? (
        <div className="space-y-1 rounded-lg bg-muted p-3">
          <p className="text-xs font-semibold">{t("mios.respuesta")}</p>
          <p className="text-sm whitespace-pre-line">{mensaje.respuesta}</p>
          {mensaje.respondidoEn && (
            <p className="text-xs text-muted-foreground tabular-nums">
              {t("mios.respondido", { fecha: f.date(mensaje.respondidoEn) })}
            </p>
          )}
          {/* Marcar leído es del lector, no del reloj: se pulsa */}
          {mensaje.sinLeer && (
            <Button variant="ghost" size="sm" className="mt-1" onClick={onVisto}>
              {t("mios.marcarLeida")}
            </Button>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{t("mios.sinRespuesta")}</p>
      )}
    </li>
  )
}
