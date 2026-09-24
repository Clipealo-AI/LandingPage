"use client"

import type { ReactNode } from "react"
import { Megaphone, Scissors } from "lucide-react"
import { useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"
import { TIPOS_CUENTA, type TipoCuenta } from "@/lib/auth"
import { primerNombre } from "@/hooks/use-cuenta"
import { vigente } from "@/lib/privacidad"
import { Checkbox } from "@/components/ui/checkbox"
import { ChoiceCards } from "@/components/onboarding/choice-cards"
import { useFlujo } from "@/components/onboarding/contexto"
import { CampoToma, Toma } from "@/components/onboarding/toma"

const ICONO: Record<TipoCuenta, ReactNode> = {
  clipero: <Scissors />,
  agencia: <Megaphone />,
}

/** Clave exacta de cada texto que se consiente en esta toma (registro de consentimientos). */
const TEXTO = {
  adulto: "onboarding.cuenta.adult",
  terminos: "onboarding.cuenta.terms",
  aviso: "onboarding.cuenta.privacyNote",
} as const

/**
 * Toma `cuenta` (§2.1): qué viene a hacer, y la mayoría de edad y los términos
 * si aún no se han aceptado.
 *
 * El tipo decide el recorrido entero —clipero o agencia—, así que se pregunta
 * aquí y no en el alta: el formulario de acceso solo pide lo que hace falta
 * para tener cuenta. Las dos casillas salen únicamente cuando faltan (un OAuth
 * nuevo); quien viene del alta ya las aceptó y volver a enseñárselas sería
 * pedirle dos veces lo mismo. La de 18+ va separada de los términos y no se
 * puede saltar. Cada casilla registra su consentimiento.
 */
export function TomaCuenta() {
  const ctx = useFlujo()
  const t = useTranslations("onboarding.cuenta")
  const { cuenta, responder, consentir } = ctx
  const terminos = vigente(cuenta.consentimientos, "terminos")
  // Quien viene del alta acaba de escribir su nombre: la primera toma lo usa
  const nombre = primerNombre(cuenta.nombre)
  const faltaEdad = !cuenta.mayorDeEdad
  const faltanTerminos = !terminos

  const aceptarTerminos = (valor: boolean) => {
    consentir("terminos", valor, "onboarding", TEXTO.terminos)
    consentir("privacidad", valor, "onboarding", TEXTO.terminos)
    // Aceptar es también leer el aviso de las estadísticas agregadas (N2)
    if (valor) consentir("estadisticas", true, "onboarding", TEXTO.aviso)
  }

  const enlace = (href: "/legal/terminos" | "/legal/privacidad") =>
    function EnlaceLegal(chunks: ReactNode) {
      return (
        <Link href={href} target="_blank" className="underline underline-offset-4">
          {chunks}
        </Link>
      )
    }

  return (
    <Toma
      saludo={
        ctx.numero === 1
          ? nombre
            ? t("greeting", { nombre, total: ctx.total })
            : t("greetingSinNombre", { total: ctx.total })
          : null
      }
      pregunta={t("question")}
      paraQue={t("why")}
      datos="equipo"
      reaccion={cuenta.tipo ? t(`reaction.${cuenta.tipo}`) : null}
    >
      <CampoToma campo="tipo">
        {(a) => (
          <ChoiceCards
            atajos
            value={cuenta.tipo}
            onValueChange={(v) => responder("tipo", v)}
            aria-labelledby={a.etiquetaId}
            aria-describedby={a.describedBy}
            invalid={a.invalid}
            options={TIPOS_CUENTA.map((id) => ({
              value: id,
              title: t(`options.${id}.title`),
              description: t(`options.${id}.description`),
              icon: ICONO[id],
            }))}
          />
        )}
      </CampoToma>

      <div className="space-y-5 empty:hidden">
        {faltaEdad && (
          <CampoToma campo="mayorDeEdad">
            {(a) => (
              <div className="flex items-start gap-3">
                <Checkbox
                  id="toma-mayor-edad"
                  className="mt-0.5"
                  checked={cuenta.mayorDeEdad}
                  aria-invalid={a.invalid || undefined}
                  aria-describedby={["toma-mayor-edad-ayuda", a.describedBy]
                    .filter(Boolean)
                    .join(" ")}
                  onCheckedChange={(v) => {
                    const valor = v === true
                    responder("mayorDeEdad", valor)
                    consentir("mayor-edad", valor, "onboarding", TEXTO.adulto)
                  }}
                />
                <div className="space-y-1">
                  <label htmlFor="toma-mayor-edad" className="font-medium">
                    {t("adult")}
                  </label>
                  <p id="toma-mayor-edad-ayuda" className="text-sm text-muted-foreground">
                    {t("adultHelp")}
                  </p>
                </div>
              </div>
            )}
          </CampoToma>
        )}

        {faltanTerminos && (
          <CampoToma campo="terminos">
            {(a) => (
              <div className="flex items-start gap-3">
                <Checkbox
                  id="toma-terminos"
                  className="mt-0.5"
                  checked={terminos}
                  aria-invalid={a.invalid || undefined}
                  aria-describedby={["toma-aviso-datos", a.describedBy]
                    .filter(Boolean)
                    .join(" ")}
                  onCheckedChange={(v) => aceptarTerminos(v === true)}
                />
                <div className="space-y-1">
                  <label htmlFor="toma-terminos">
                    {t.rich("terms", {
                      terms: enlace("/legal/terminos"),
                      privacy: enlace("/legal/privacidad"),
                    })}
                  </label>
                  <p
                    id="toma-aviso-datos"
                    className="text-sm text-pretty text-muted-foreground"
                  >
                    {t("privacyNote")}
                  </p>
                </div>
              </div>
            )}
          </CampoToma>
        )}
      </div>
    </Toma>
  )
}
