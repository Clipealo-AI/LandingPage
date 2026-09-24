"use client"

import * as React from "react"
import { Globe } from "lucide-react"
import { useTranslations } from "next-intl"

import { COUNTRY_CODES } from "@/lib/countries"
import {
  LIMITES_ONBOARDING,
  dominioCoincide,
  type PaisResidencia,
} from "@/lib/onboarding"
import { ROLES, type Rol } from "@/lib/taxonomia"
import { leerCuenta } from "@/hooks/use-cuenta"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CountryFlag, useCountryName } from "@/components/shared/country-flag"
import { useFlujo } from "@/components/onboarding/contexto"
import { CampoToma, Toma } from "@/components/onboarding/toma"

/**
 * Toma 2 de la agencia (§2.8): nombre, web, papel (opcional) y país de la
 * organización. Es una toma de texto: el foco va al nombre (`data-toma-foco`).
 *
 * El país se precarga con el de la cuenta (como `inferido`; al continuar pasa a
 * declarado) y, si el dominio del correo coincide con la web, la reacción lo
 * dice: esa solicitud se revisa antes.
 */
export function TomaOrg() {
  const ctx = useFlujo()
  const t = useTranslations("onboarding.agencia.org")
  const tr = useTranslations("taxonomy.roles")
  const nombrePais = useCountryName()
  const { cuenta, responder } = ctx
  const a = cuenta.agencia

  // El país de quien se registra suele ser el de la organización
  React.useEffect(() => {
    const c = leerCuenta()
    if (!c.agencia.pais && c.pais) responder("agencia.pais", c.pais, "inferido")
  }, [responder])

  return (
    <Toma
      pregunta={t("question")}
      paraQue={t("why")}
      datos="agencias"
      reaccion={a.dominioCoincide ? t("reaction") : null}
    >
      <CampoToma
        campo="organizacion"
        etiqueta={t("fields.nombre")}
        ayuda={t("fields.nombreHelp", {
          min: LIMITES_ONBOARDING.orgMin,
          max: LIMITES_ONBOARDING.orgMax,
        })}
        htmlFor="toma-organizacion"
      >
        {(x) => (
          <Input
            id="toma-organizacion"
            data-toma-foco=""
            className="h-11"
            autoComplete="organization"
            enterKeyHint="next"
            maxLength={LIMITES_ONBOARDING.orgMax + 20}
            value={a.organizacion ?? ""}
            aria-invalid={x.invalid || undefined}
            aria-describedby={x.describedBy}
            onChange={(e) =>
              responder("agencia.organizacion", e.target.value || undefined)
            }
          />
        )}
      </CampoToma>

      <CampoToma
        campo="web"
        etiqueta={t("fields.web")}
        ayuda={t("fields.webHelp")}
        htmlFor="toma-web"
      >
        {(x) => (
          <Input
            id="toma-web"
            className="h-11"
            type="url"
            inputMode="url"
            autoComplete="url"
            autoCapitalize="off"
            spellCheck={false}
            enterKeyHint="next"
            placeholder={t("fields.webPlaceholder")}
            value={a.web ?? ""}
            aria-invalid={x.invalid || undefined}
            aria-describedby={x.describedBy}
            onChange={(e) => {
              responder("agencia.web", e.target.value || undefined)
              responder(
                "agencia.dominioCoincide",
                dominioCoincide(cuenta.correo, e.target.value)
              )
            }}
          />
        )}
      </CampoToma>

      <CampoToma campo="rol" etiqueta={t("fields.rol")} htmlFor="toma-rol">
        {(x) => (
          <Select
            value={a.rol ?? ""}
            onValueChange={(v) => responder("agencia.rol", v as Rol)}
          >
            <SelectTrigger
              id="toma-rol"
              aria-describedby={x.describedBy}
              className="h-11 w-full @md/bienvenida:max-w-sm"
            >
              <SelectValue placeholder={t("fields.rolPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((rol) => (
                <SelectItem key={rol} value={rol}>
                  {tr(rol)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </CampoToma>

      <CampoToma campo="pais" etiqueta={t("fields.pais")} htmlFor="toma-pais-org">
        {(x) => (
          <Select
            value={a.pais ?? ""}
            onValueChange={(v) => responder("agencia.pais", v as PaisResidencia)}
          >
            <SelectTrigger
              id="toma-pais-org"
              aria-invalid={x.invalid || undefined}
              aria-describedby={x.describedBy}
              className="h-11 w-full @md/bienvenida:max-w-sm"
            >
              <SelectValue placeholder={t("fields.paisPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {COUNTRY_CODES.map((code) => (
                <SelectItem key={code} value={code}>
                  <CountryFlag code={code} className="h-3.5 w-[1.125rem]" />
                  {nombrePais(code)}
                </SelectItem>
              ))}
              <SelectItem value="otro">
                <Globe className="size-4" aria-hidden />
                {t("fields.paisOtro")}
              </SelectItem>
            </SelectContent>
          </Select>
        )}
      </CampoToma>
    </Toma>
  )
}
