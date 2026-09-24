"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { ArrowDownToLine } from "lucide-react"

import { toast } from "@/lib/toast"
import { nuevoId, redondear } from "@/lib/campanas"
import {
  METODOS_RETIRO,
  RETIRO_MINIMO,
  validarDestino,
  validarRetiro,
  type ErrorRetiro,
  type MetodoRetiro,
} from "@/lib/wallet"
import { useCampanas } from "@/hooks/use-campanas"
import { useFormat } from "@/hooks/use-format"
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
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

/**
 * Retirar del wallet. Importe (con «Todo» a un clic), método y destino. El
 * destino se valida según el método; el retiro queda «en curso» hasta que el
 * equipo lo paga desde el backoffice, y mientras tanto ya no cuenta como
 * disponible, así que no se puede pedir dos veces el mismo dinero.
 */
export function WithdrawDialog({ disponible }: { disponible: number }) {
  const t = useTranslations("campaigns.withdraw")
  const tMetodo = useTranslations("campaigns.withdrawal.method")
  const f = useFormat()
  const { solicitarRetiro, cuenta } = useCampanas()
  const [abierto, setAbierto] = React.useState(false)
  const [importe, setImporte] = React.useState("")
  const [metodo, setMetodo] = React.useState<MetodoRetiro>("paypal")
  const [destino, setDestino] = React.useState("")
  const [intento, setIntento] = React.useState(false)

  // En inglés la coma separa miles; en español y portugués, decimales
  const valor =
    importe.trim() === ""
      ? Number.NaN
      : Number(f.locale === "en" ? importe.replace(/,/g, "") : importe.replace(",", "."))
  const mensaje = (e: ErrorRetiro) =>
    e.code === "belowMinimum"
      ? t(`errors.${e.code}`, { min: f.money(e.values.min) })
      : t(`errors.${e.code}`)
  const errorImporte = validarRetiro(valor, disponible)
  const errorDestino = validarDestino(metodo, destino)
  const puede = disponible >= RETIRO_MINIMO

  const reiniciar = () => {
    setImporte("")
    setDestino("")
    setIntento(false)
  }

  const enviar = (e: React.FormEvent) => {
    e.preventDefault()
    setIntento(true)
    if (errorImporte || errorDestino) return
    const cantidad = redondear(valor)
    solicitarRetiro({
      id: nuevoId("ret"),
      userId: cuenta.userId,
      nombre: cuenta.nombre,
      importe: cantidad,
      metodo,
      destino: destino.trim(),
      estado: "solicitado",
      solicitadoEn: new Date().toISOString(),
    })
    toast.success(t("requested"), {
      description: t("requestedDescription", {
        amount: f.money(cantidad, { decimals: 2 }),
        method: tMetodo(`${metodo}.name`),
        eta: tMetodo(`${metodo}.eta`),
      }),
    })
    setAbierto(false)
    reiniciar()
  }

  return (
    <Dialog
      open={abierto}
      onOpenChange={(v) => {
        setAbierto(v)
        if (!v) reiniciar()
      }}
    >
      <DialogTrigger asChild>
        <Button variant="brand" size="lg" disabled={!puede}>
          <ArrowDownToLine /> {t("trigger")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={enviar} noValidate className="space-y-5">
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>
              {t("description", {
                available: f.money(disponible, { decimals: 2 }),
                min: f.money(RETIRO_MINIMO),
              })}
            </DialogDescription>
          </DialogHeader>

          <Field data-invalid={intento && errorImporte ? true : undefined}>
            <FieldLabel htmlFor="importe-retiro">{t("amount")}</FieldLabel>
            <InputGroup className="h-11">
              <InputGroupAddon>
                <InputGroupText>US$</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                id="importe-retiro"
                inputMode="decimal"
                value={importe}
                placeholder={t("amountPlaceholder")}
                className="text-base"
                aria-invalid={intento && errorImporte ? true : undefined}
                onChange={(e) => setImporte(e.target.value)}
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  size="xs"
                  onClick={() =>
                    setImporte(
                      f.locale === "en"
                        ? disponible.toFixed(2)
                        : disponible.toFixed(2).replace(".", ",")
                    )
                  }
                >
                  {t("all")}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
            {intento && errorImporte && <FieldError>{mensaje(errorImporte)}</FieldError>}
          </Field>

          <FieldSet>
            <FieldLegend variant="label">{t("method")}</FieldLegend>
            <RadioGroup
              value={metodo}
              onValueChange={(v) => {
                setMetodo(v as MetodoRetiro)
                setDestino("")
              }}
              className="grid gap-2 sm:grid-cols-3"
            >
              {METODOS_RETIRO.map((m) => (
                <FieldLabel key={m} htmlFor={`metodo-${m}`}>
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldTitle>{tMetodo(`${m}.name`)}</FieldTitle>
                      <FieldDescription className="text-xs">
                        {tMetodo(`${m}.eta`)}
                      </FieldDescription>
                    </FieldContent>
                    <RadioGroupItem value={m} id={`metodo-${m}`} />
                  </Field>
                </FieldLabel>
              ))}
            </RadioGroup>
          </FieldSet>

          <Field data-invalid={intento && errorDestino ? true : undefined}>
            <FieldLabel htmlFor="destino-retiro">
              {tMetodo(`${metodo}.destination`)}
            </FieldLabel>
            <Input
              id="destino-retiro"
              value={destino}
              inputMode={metodo === "paypal" ? "email" : "numeric"}
              autoComplete={metodo === "paypal" ? "email" : "off"}
              aria-invalid={intento && errorDestino ? true : undefined}
              onChange={(e) => setDestino(e.target.value)}
            />
            {intento && errorDestino ? (
              <FieldError>{mensaje(errorDestino)}</FieldError>
            ) : (
              <FieldDescription>{tMetodo(`${metodo}.help`)}</FieldDescription>
            )}
          </Field>

          <DialogFooter>
            <Button type="submit">{t("submit")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
