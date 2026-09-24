"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { parseAsString, useQueryState } from "nuqs"
import { KeyRound } from "lucide-react"

import { hrefDinamico, useRouter } from "@/i18n/navigation"
import { toast } from "@/lib/toast"
import { playSound } from "@/lib/sound"
import { shake } from "@/lib/effects"
import { buscarPorCodigo, normalizarCodigo } from "@/lib/campanas"
import { consultaExpres, necesitaExpres } from "@/lib/invitacion"
import { useCampanas } from "@/hooks/use-campanas"
import { useCuenta } from "@/hooks/use-cuenta"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

/**
 * Entrar a una campaña privada con su código. El código se escribe como se
 * quiera (minúsculas, sin guion, con espacios) y se normaliza al validar.
 *
 * Quien llega invitado y aún no ha terminado la bienvenida pasa antes por el
 * modo exprés (§2.7): dos tomas —redes, y país con idiomas— y vuelta a la
 * campaña. Sin esto, `lib/invitacion.ts` estaba escrito entero y no lo
 * importaba nadie: el invitado caía en una campaña que no podía valorar
 * porque de él no se sabía ni en qué red publica.
 *
 * El código también llega por la URL (`/campanas?codigo=ABCD-2345`), que es
 * como se comparte una campaña privada: entonces el diálogo se abre solo con
 * el código puesto y el campo enfocado, y la consulta se limpia.
 */
export function AccessCodeDialog() {
  const t = useTranslations("campaigns.accessCode")
  const router = useRouter()
  const { campanas, desbloquear } = useCampanas()
  const { cuenta } = useCuenta()
  const [codigoUrl, setCodigoUrl] = useQueryState("codigo", parseAsString)
  const [abierto, setAbierto] = React.useState(false)
  const [codigo, setCodigo] = React.useState("")
  const [error, setError] = React.useState(false)
  const campo = React.useRef<HTMLDivElement>(null)

  // Ajuste durante el render, no un efecto: el diálogo nace abierto y con el
  // código dentro, sin un primer fotograma vacío
  const [visto, setVisto] = React.useState<string | null>(null)
  if (codigoUrl && codigoUrl !== visto) {
    setVisto(codigoUrl)
    setCodigo(normalizarCodigo(codigoUrl))
    setAbierto(true)
  }
  // Limpiar la consulta sí es un efecto: escribe en la URL, y eso no se hace
  // mientras se pinta. El código ya está en el campo, así que no se pierde
  React.useEffect(() => {
    if (codigoUrl) void setCodigoUrl(null)
  }, [codigoUrl, setCodigoUrl])

  const entrar = (e: React.FormEvent) => {
    e.preventDefault()
    const campana = buscarPorCodigo(campanas, codigo)
    if (!campana) {
      setError(true)
      playSound("error")
      shake(campo.current)
      return
    }
    desbloquear(campana.id)
    setAbierto(false)
    setCodigo("")
    setError(false)
    toast.celebrate(t("unlocked"), { description: campana.titulo })
    if (necesitaExpres(cuenta)) {
      router.push({ pathname: "/bienvenida", query: consultaExpres(campana.id) })
      return
    }
    router.push(hrefDinamico("/campanas/[id]", { id: campana.id }))
  }

  return (
    <Dialog
      open={abierto}
      onOpenChange={(v) => {
        setAbierto(v)
        if (!v) setError(false)
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="lg">
          <KeyRound /> {t("trigger")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={entrar} className="space-y-5">
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>
          <div ref={campo}>
            <Field data-invalid={error ? true : undefined}>
              <FieldLabel htmlFor="codigo-acceso">{t("label")}</FieldLabel>
              <Input
                id="codigo-acceso"
                value={codigo}
                autoComplete="off"
                spellCheck={false}
                placeholder="ABCD-2345"
                aria-invalid={error ? true : undefined}
                className="h-11 font-mono text-base tracking-[0.2em] uppercase"
                onChange={(e) => {
                  setCodigo(e.target.value)
                  setError(false)
                }}
                onBlur={() => codigo && setCodigo(normalizarCodigo(codigo))}
              />
              {error ? (
                <FieldError>{t("notFound")}</FieldError>
              ) : (
                <FieldDescription>{t("hint")}</FieldDescription>
              )}
            </Field>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={codigo.trim().length < 4}>
              {t("submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
