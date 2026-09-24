"use client"

import * as React from "react"
import { Trash2 } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"
import { LOCALE_TAG } from "@/i18n/routing"
import { cn } from "@/lib/utils"
import { PLATAFORMA_LABEL, type PlataformaDirecto } from "@/lib/ajustes"
import { COUNTRY_CODES } from "@/lib/countries"
import { creadorPorId } from "@/lib/creadores"
import { esRender, pasosDe, type Cuenta, type PasoId } from "@/lib/onboarding"
import {
  DATOS_CONSERVADOS,
  historial,
  NUNCA_SE_PREGUNTA,
  type Finalidad,
} from "@/lib/privacidad"
import { SOCIAL_IDS, SOCIAL_NETWORKS } from "@/lib/social"
import {
  AUN_NO_SE,
  JUEGO_NOMBRE,
  NO_TRANSMITO,
  esId,
  tieneNombreJuego,
} from "@/lib/taxonomia"
import { toast } from "@/lib/toast"
import { useCuenta } from "@/hooks/use-cuenta"
import { useFormat } from "@/hooks/use-format"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useCountryName } from "@/components/shared/country-flag"
import { Permisos } from "@/components/onboarding/permisos"

/** Cuántas entradas del historial se ven sin desplegar. */
const HISTORIAL_VISIBLE = 5

/**
 * Ajustes › Tus datos (§6.8 del onboarding).
 *
 * Es la contrapartida de todo lo que pregunta la bienvenida: qué se guarda,
 * para qué, cuánto tiempo, qué no se pregunta nunca y cómo retirarlo. Los
 * interruptores escriben en el registro de consentimientos (solo añade
 * entradas, nunca reescribe), así que el historial es la prueba de qué se
 * aceptó, cuándo, en qué idioma y con qué versión del aviso.
 *
 * Las estadísticas de plataforma (N2) son lo único activo por defecto: aquí se
 * desactivan (derecho de oposición), y quien se opone deja de contar en
 * cualquier agregado.
 */
export function PrivacySettings() {
  const t = useTranslations("settings.datos")
  const tt = useTranslations("taxonomy")
  const f = useFormat()
  const { cuenta, completitud, precision, borrarRespuestas, verBienvenidaOtraVez } =
    useCuenta()
  const [todo, setTodo] = React.useState(false)

  const entradas = historial(cuenta.consentimientos)
  const visibles = todo ? entradas : entradas.slice(0, HISTORIAL_VISIBLE)
  const esAgencia = cuenta.tipo === "agencia"

  type ClavePermiso =
    | "estadisticas"
    | "informesSector"
    | "novedades"
    | "alertas"
    | "novedadesMarcas"
    | "contactoComercial"

  const permiso = (finalidad: Finalidad, clave: ClavePermiso) => ({
    finalidad,
    label: t(`permisos.${clave}.label`),
    description: t(`permisos.${clave}.description`),
    textoId: `settings.datos.permisos.${clave}.label`,
  })

  return (
    <div className="@container/datos space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 @3xl/datos:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] @3xl/datos:gap-10">
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-sm font-semibold">
                {t("completitud", { pct: f.percent(completitud) })}
              </p>
              <Progress
                value={completitud}
                aria-label={t("completitud", { pct: f.percent(completitud) })}
              />
              <p className="text-sm text-muted-foreground">
                {t("precision", { nivel: precision })}
              </p>
            </div>
            <div className="space-y-3">
              <Button variant="outline" asChild>
                <Link href="/bienvenida" onClick={() => verBienvenidaOtraVez()}>
                  {t("bienvenida.action")}
                </Link>
              </Button>
              <p className="text-sm text-pretty text-muted-foreground">
                {t("bienvenida.description")}
              </p>
            </div>
          </div>
          {/* La columna ancha era justo el hueco donde faltaba lo que promete el
              título de la tarjeta: las respuestas (§6.8) */}
          <Resumen cuenta={cuenta} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("permisos.title")}</CardTitle>
          <CardDescription>{t("permisos.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-pretty text-muted-foreground">
            {t("permisos.servicio")}
          </p>
          <Permisos
            origen="ajustes"
            className="divide-y border-t"
            items={[
              permiso("estadisticas", "estadisticas"),
              permiso("informes-sector", "informesSector"),
              permiso("novedades-correo", "novedades"),
              permiso("alertas-correo", "alertas"),
              ...(esAgencia
                ? [
                    permiso("novedades-marcas", "novedadesMarcas"),
                    permiso("contacto-comercial", "contactoComercial"),
                  ]
                : []),
            ]}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 @4xl/datos:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("conservacion.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y text-sm">
              {DATOS_CONSERVADOS.map((dato) => (
                <div key={dato} className="grid gap-1 py-3 first:pt-0 last:pb-0">
                  <dt className="font-medium">{t(`conservacion.items.${dato}`)}</dt>
                  <dd className="text-muted-foreground">{tt(`conservacion.${dato}`)}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("nunca.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {NUNCA_SE_PREGUNTA.map((dato) => (
                <li key={dato} className="flex items-start gap-2">
                  <span
                    aria-hidden
                    className="mt-2 size-1.5 shrink-0 rounded-full bg-border"
                  />
                  {t(`nunca.items.${dato}`)}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("historial.title")}</CardTitle>
          <CardDescription>{t("historial.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {entradas.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("historial.empty")}</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("historial.columns.date")}</TableHead>
                      <TableHead>{t("historial.columns.purpose")}</TableHead>
                      <TableHead>{t("historial.columns.value")}</TableHead>
                      <TableHead>{t("historial.columns.origin")}</TableHead>
                      <TableHead>{t("historial.columns.version")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibles.map((entrada, i) => (
                      <TableRow key={`${entrada.finalidad}-${entrada.en}-${i}`}>
                        {/* Con hora: dos cambios de la misma finalidad el mismo
                            día se distinguen. La zona horaria es la de quien
                            mira, así que el servidor puede pintar otra */}
                        <TableCell className="tabular" suppressHydrationWarning>
                          {f.dateTime(entrada.en)}
                        </TableCell>
                        <TableCell>{tt(`finalidades.${entrada.finalidad}`)}</TableCell>
                        <TableCell>
                          {t(`historial.value.${entrada.valor ? "si" : "no"}`)}
                        </TableCell>
                        <TableCell>{t(`historial.origen.${entrada.origen}`)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {entrada.version}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {entradas.length > HISTORIAL_VISIBLE && (
                <Button variant="ghost" size="sm" onClick={() => setTodo((v) => !v)}>
                  {todo
                    ? t("historial.showLess")
                    : t("historial.showAll", { n: entradas.length })}
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("borrar.title")}</CardTitle>
          <CardDescription className="text-pretty">
            {t("borrar.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">
                <Trash2 /> {t("borrar.action")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("borrar.confirmTitle")}</AlertDialogTitle>
                <AlertDialogDescription className="text-pretty">
                  {t("borrar.confirmDescription")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("borrar.cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={() => {
                    borrarRespuestas()
                    toast.success(t("borrar.done.title"), {
                      description: t("borrar.done.description"),
                    })
                  }}
                >
                  {t("borrar.confirm")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * «Lo que nos contaste»: cada toma con su respuesta y «Editar» (§6.8).
 *
 * Es el mismo resumen que cierra la bienvenida, pero leyendo la cuenta guardada:
 * aquí no hay contexto de flujo, así que las tomas salen de `pasosDe` y «Editar»
 * abre la bienvenida en esa toma con `?paso=`.
 */
function Resumen({ cuenta }: { cuenta: Cuenta }) {
  const t = useTranslations("settings.datos.resumen")
  const to = useTranslations("onboarding")
  const tt = useTranslations("taxonomy")
  const f = useFormat()
  const locale = useLocale()
  const nombrePais = useCountryName()
  const nombreIdioma = React.useMemo(() => {
    const nombres = new Intl.DisplayNames([LOCALE_TAG[locale]], { type: "language" })
    return (codigo: string) => nombres.of(codigo) ?? codigo
  }, [locale])

  const saltados = cuenta.onboarding.pasosSaltados
  const pasos = pasosDe(
    cuenta.onboarding.flujo,
    cuenta.clipero.objetivo,
    cuenta.onboarding.modo,
    cuenta
  ).filter((p) => !esRender(p))

  const respuesta = (p: PasoId): string | null => {
    const cl = cuenta.clipero
    const cr = cuenta.creador
    const ag = cuenta.agencia
    switch (p) {
      case "cuenta":
        return cuenta.tipo ? to(`cuenta.options.${cuenta.tipo}.title`) : null
      case "objetivo":
        return cl.objetivo ? tt(`objetivosUso.${cl.objetivo}`) : null
      case "nichos": {
        if (cl.verticales === AUN_NO_SE) return tt("aunNoSe")
        const partes = [
          ...(cl.verticales ?? []).map((v) => tt(`verticales.${v}`)),
          ...(cl.juegos ?? []).map((j) =>
            tieneNombreJuego(j) ? JUEGO_NOMBRE[j] : tt(`juegos.${j}`)
          ),
        ]
        return partes.length ? f.list(partes) : null
      }
      case "fandom": {
        const nombres = (cl.creadoresFan ?? []).map((x) =>
          typeof x === "string" ? (creadorPorId(x)?.nombre ?? x) : x.texto
        )
        return nombres.length ? f.list(nombres) : null
      }
      case "redes":
        return cl.redes?.length
          ? f.list(
              cl.redes.map((r) =>
                esId(SOCIAL_IDS, r)
                  ? SOCIAL_NETWORKS[r].name
                  : tt(`redesPublicacion.${r}`)
              )
            )
          : null
      case "basicos": {
        const partes = [
          cuenta.pais && esId(COUNTRY_CODES, cuenta.pais)
            ? nombrePais(cuenta.pais)
            : null,
          cuenta.idiomas.length
            ? f.list(cuenta.idiomas.map((i) => nombreIdioma(i)))
            : null,
        ].filter((x): x is string => !!x)
        return partes.length ? partes.join(" · ") : null
      }
      case "directo": {
        const seleccion = cr.plataformasDirecto ?? []
        const partes = [
          ...seleccion
            .filter((x): x is PlataformaDirecto => x !== NO_TRANSMITO)
            .map((x) => PLATAFORMA_LABEL[x]),
          ...(seleccion.includes(NO_TRANSMITO)
            ? [tt("plataformasDirecto.no-transmito")]
            : []),
        ]
        if (!partes.length) return null
        return [
          f.list(partes),
          cr.frecuencia ? tt(`frecuenciasDirecto.${cr.frecuencia}`) : null,
        ]
          .filter((x): x is string => !!x)
          .join(" · ")
      }
      case "canal": {
        const partes = [
          cr.verticalesCanal?.length
            ? f.list(cr.verticalesCanal.map((v) => tt(`verticales.${v}`)))
            : null,
          cr.enlaceCanal ? t("enlace", { handle: cr.enlaceCanal.handle }) : null,
        ].filter((x): x is string => !!x)
        return partes.length ? partes.join(" · ") : null
      }
      case "tipo-org":
        return ag.tipoOrganizacion ? tt(`tiposOrganizacion.${ag.tipoOrganizacion}`) : null
      case "org":
        return ag.organizacion?.trim() || null
      case "promocion": {
        const partes = [
          ag.sector ? tt(`sectores.${ag.sector}`) : null,
          ag.verticalesMaterial?.length
            ? f.list(ag.verticalesMaterial.map((v) => tt(`verticales.${v}`)))
            : null,
        ].filter((x): x is string => !!x)
        return partes.length ? partes.join(" · ") : null
      }
      case "alcance": {
        const partes = [
          ag.redesObjetivo?.length
            ? f.list(ag.redesObjetivo.map((r) => SOCIAL_NETWORKS[r].name))
            : null,
          ag.paisesObjetivo?.length
            ? f.list(ag.paisesObjetivo.map((c) => nombrePais(c)))
            : null,
          ag.idiomasObjetivo?.length
            ? f.list(ag.idiomasObjetivo.map((i) => nombreIdioma(i)))
            : null,
        ].filter((x): x is string => !!x)
        return partes.length ? partes.join(" · ") : null
      }
      default:
        return null
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">{t("title")}</p>
      <p className="text-sm text-pretty text-muted-foreground">{t("description")}</p>
      <dl className="divide-y border-t text-sm">
        {pasos.map((p) => {
          const campo = to(`chrome.pasos.${p}`)
          const valor = respuesta(p)
          return (
            <div key={p} className="flex items-start gap-3 py-2.5">
              <div className="min-w-0 flex-1 space-y-0.5">
                <dt className="text-muted-foreground">{campo}</dt>
                <dd className={cn("text-pretty", !valor && "text-muted-foreground")}>
                  {valor ?? (saltados.includes(p) ? t("saltada") : t("sinRespuesta"))}
                </dd>
              </div>
              <Button variant="ghost" size="sm" asChild className="shrink-0">
                <Link
                  href={{ pathname: "/bienvenida", query: { paso: p } }}
                  aria-label={t("editarLabel", { campo })}
                >
                  {t("editar")}
                </Link>
              </Button>
            </div>
          )
        })}
      </dl>
    </div>
  )
}
