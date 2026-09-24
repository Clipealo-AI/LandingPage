"use client"

import * as React from "react"
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs"
import { ArrowLeft, Check, Circle, MailCheck } from "lucide-react"
import { useTranslations } from "next-intl"

import { Link, useRouter } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import { toast } from "@/lib/toast"
import { playSound } from "@/lib/sound"
import { shake } from "@/lib/effects"
import {
  MODOS_ACCESO,
  PASSWORD_MIN,
  PROVEEDOR_LABEL,
  continuarCon,
  crearCuenta,
  destinoSeguro,
  enviarEnlaceRecuperacion,
  fuerzaPassword,
  iniciarSesion,
  reglasPassword,
  validarCorreo,
  validarMayorDeEdad,
  validarNombre,
  validarPasswordNueva,
  type ErrorAcceso,
  type ErrorCampo,
  type Proveedor,
  type ReglaPasswordId,
} from "@/lib/auth"
import { leerCuenta, useCuenta } from "@/hooks/use-cuenta"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OAuthButtons } from "@/components/auth/oauth-buttons"
import { PasswordInput } from "@/components/auth/password-input"

/** Espera para reenviar el enlace: evita que se pida diez veces seguidas. */
const ESPERA_REENVIO_S = 30

type TextosAcceso = ReturnType<typeof useTranslations<"auth">>

function textoRegla(t: TextosAcceso, id: ReglaPasswordId) {
  return t(`password.rules.${id}`, { min: PASSWORD_MIN })
}

/**
 * Frase de un error de campo. Las reglas que faltan a la contraseña se listan
 * en minúscula, tal como se leen sueltas en la lista de reglas.
 */
function useErrorCampo() {
  const t = useTranslations("auth")
  return (error: ErrorCampo | null) => {
    if (!error) return null
    switch (error.code) {
      case "nombreLargo":
        return t("errors.nombreLargo", error.values)
      case "passwordFalta":
        return t("errors.passwordFalta", {
          rules: error.values.faltan
            .map((id) => textoRegla(t, id).toLocaleLowerCase())
            .join(", "),
        })
      default:
        return t(`errors.${error.code}`)
    }
  }
}

/** Consulta de `/bienvenida`: el `next` pedido viaja tal cual y el onboarding lo valida. */
const consultaBienvenida = (next: string | null, extra: Record<string, string> = {}) =>
  next ? { ...extra, next } : extra

/**
 * Acceso a Clipealo: entrar, crear cuenta y recuperar la contraseña en una
 * sola página. El modo vive en la URL (`?modo=registro`) para que cada modo
 * tenga su propio enlace, y `?next=` devuelve a donde se quería ir (solo rutas
 * internas). Los errores se dicen junto al campo y el primero recibe el foco.
 *
 * Una cuenta nueva (registro u OAuth nuevo) pasa antes por la bienvenida
 * «Tu primer corte» (`/bienvenida`), que es quien le da la bienvenida.
 */
export function LoginPanel() {
  const t = useTranslations("auth")
  const router = useRouter()
  const { registrar } = useCuenta()
  const [modo, setModo] = useQueryState(
    "modo",
    parseAsStringLiteral(MODOS_ACCESO).withDefault("entrar")
  )
  const [next] = useQueryState("next", parseAsString)
  const [oauth, setOauth] = React.useState<Proveedor | null>(null)
  // El correo pasa de un modo a otro: quien se equivoca de pestaña no lo escribe dos veces
  const [correo, setCorreo] = React.useState("")

  const destino = destinoSeguro(next)

  const entrarCon = async (p: Proveedor) => {
    setOauth(p)
    const r = await continuarCon(p)
    setOauth(null)
    if (!r.ok) {
      toast.error(t("oauth.failed", { provider: PROVEEDOR_LABEL[p] }), {
        description: t(`errors.${r.error}`),
      })
      return
    }
    toast.success(t("oauth.success", { provider: PROVEEDOR_LABEL[p] }))
    if (r.nueva) {
      // El proveedor no dice el tipo ni la edad: la toma «cuenta» los pide
      registrar({
        nombre: "",
        correo: "",
        tipo: null,
        mayorDeEdad: false,
        origen: "oauth",
      })
      router.push({
        pathname: "/bienvenida",
        query: consultaBienvenida(next, { origen: "oauth" }),
      })
      return
    }
    const { estado } = leerCuenta().onboarding
    if (estado === "completado" || estado === "pospuesto") router.push(destino)
    else router.push({ pathname: "/bienvenida", query: consultaBienvenida(next) })
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">
          {t(`modes.${modo}.title`)}
        </h1>
        <p className="text-pretty text-muted-foreground">{t(`modes.${modo}.text`)}</p>
      </div>

      {modo === "recuperar" ? (
        <Recuperar
          correo={correo}
          setCorreo={setCorreo}
          onVolver={() => void setModo(null)}
        />
      ) : (
        <>
          <Tabs
            value={modo}
            onValueChange={(v) =>
              void setModo(v === "entrar" ? null : (v as typeof modo))
            }
          >
            <TabsList className="grid h-10 w-full grid-cols-2 p-1 group-data-horizontal/tabs:h-10">
              <TabsTrigger value="entrar">{t("tabs.entrar")}</TabsTrigger>
              <TabsTrigger value="registro">{t("tabs.registro")}</TabsTrigger>
            </TabsList>
          </Tabs>

          <OAuthButtons onContinuar={entrarCon} cargando={oauth} />

          <FieldSeparator className="*:data-[slot=field-separator-content]:bg-background">
            {t("withEmail")}
          </FieldSeparator>

          {modo === "entrar" ? (
            <Entrar
              correo={correo}
              setCorreo={setCorreo}
              destino={destino}
              bloqueado={oauth !== null}
              onOlvido={() => void setModo("recuperar")}
            />
          ) : (
            <Registro
              correo={correo}
              setCorreo={setCorreo}
              next={next}
              bloqueado={oauth !== null}
            />
          )}
        </>
      )}
    </div>
  )
}

/* ---------------------------------------------------------------------------
   Entrar
   --------------------------------------------------------------------------- */

function Entrar({
  correo,
  setCorreo,
  destino,
  bloqueado,
  onOlvido,
}: {
  correo: string
  setCorreo: (v: string) => void
  destino: string
  bloqueado: boolean
  onOlvido: () => void
}) {
  const t = useTranslations("auth")
  const errorCampo = useErrorCampo()
  const router = useRouter()
  const [password, setPassword] = React.useState("")
  const [recordar, setRecordar] = React.useState(true)
  const [intento, setIntento] = React.useState(false)
  const [enviando, setEnviando] = React.useState(false)
  const [errorServidor, setErrorServidor] = React.useState<ErrorAcceso | null>(null)
  const formulario = React.useRef<HTMLFormElement>(null)

  const errorCorreo = errorCampo(validarCorreo(correo))
  const errorPassword = password ? null : t("errors.passwordVacia")

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    setIntento(true)
    setErrorServidor(null)
    if (errorCorreo || errorPassword) {
      playSound("error")
      shake(formulario.current)
      requestAnimationFrame(() =>
        formulario.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus()
      )
      return
    }
    setEnviando(true)
    const r = await iniciarSesion(correo, password)
    setEnviando(false)
    if (!r.ok) {
      setErrorServidor(r.error)
      toast.error(t("login.failed"), { description: t(`errors.${r.error}`) })
      return
    }
    toast.success(t("login.success"), {
      description: recordar ? t("login.remembered") : undefined,
    })
    router.push(destino)
  }

  return (
    <form
      ref={formulario}
      onSubmit={enviar}
      noValidate
      className="space-y-5"
      aria-label={t("login.formLabel")}
    >
      {errorServidor && (
        <Alert variant="destructive">
          <AlertDescription>{t(`errors.${errorServidor}`)}</AlertDescription>
        </Alert>
      )}

      <Field data-invalid={intento && errorCorreo ? true : undefined}>
        <FieldLabel htmlFor="login-correo">{t("fields.email")}</FieldLabel>
        <Input
          id="login-correo"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          placeholder={t("fields.emailPlaceholder")}
          className="h-11"
          value={correo}
          aria-invalid={intento && errorCorreo ? true : undefined}
          aria-describedby={intento && errorCorreo ? "login-correo-error" : undefined}
          onChange={(e) => setCorreo(e.target.value)}
        />
        {intento && errorCorreo && (
          <FieldError id="login-correo-error">{errorCorreo}</FieldError>
        )}
      </Field>

      <Field data-invalid={intento && errorPassword ? true : undefined}>
        <div className="flex items-baseline justify-between gap-3">
          <FieldLabel htmlFor="login-password">{t("fields.password")}</FieldLabel>
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto p-0"
            onClick={onOlvido}
          >
            {t("login.forgot")}
          </Button>
        </div>
        <PasswordInput
          id="login-password"
          autoComplete="current-password"
          value={password}
          aria-invalid={intento && errorPassword ? true : undefined}
          aria-describedby={intento && errorPassword ? "login-password-error" : undefined}
          onChange={(e) => setPassword(e.target.value)}
        />
        {intento && errorPassword && (
          <FieldError id="login-password-error">{errorPassword}</FieldError>
        )}
      </Field>

      <Field orientation="horizontal">
        <Checkbox
          id="login-recordar"
          checked={recordar}
          onCheckedChange={(v) => setRecordar(v === true)}
        />
        <FieldLabel htmlFor="login-recordar" className="font-normal">
          {t("login.remember")}
        </FieldLabel>
      </Field>

      <Button
        type="submit"
        variant="brand"
        size="lg"
        className="h-11 w-full"
        disabled={enviando || bloqueado}
      >
        {enviando ? (
          <>
            <Spinner /> {t("login.submitting")}
          </>
        ) : (
          t("login.submit")
        )}
      </Button>
    </form>
  )
}

/* ---------------------------------------------------------------------------
   Crear cuenta
   --------------------------------------------------------------------------- */

const COLOR_FUERZA = [
  "bg-muted",
  "bg-destructive",
  "bg-warning",
  "bg-success",
  "bg-success",
] as const

function Registro({
  correo,
  setCorreo,
  next,
  bloqueado,
}: {
  correo: string
  setCorreo: (v: string) => void
  next: string | null
  bloqueado: boolean
}) {
  const t = useTranslations("auth")
  const errorCampo = useErrorCampo()
  const router = useRouter()
  const { registrar } = useCuenta()
  const [nombre, setNombre] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [mayorDeEdad, setMayorDeEdad] = React.useState(false)
  const [acepta, setAcepta] = React.useState(false)
  const [intento, setIntento] = React.useState(false)
  const [enviando, setEnviando] = React.useState(false)
  const formulario = React.useRef<HTMLFormElement>(null)

  const errores = {
    nombre: errorCampo(validarNombre(nombre)),
    correo: errorCampo(validarCorreo(correo)),
    password: errorCampo(validarPasswordNueva(password)),
    mayorDeEdad: errorCampo(validarMayorDeEdad(mayorDeEdad)),
    acepta: acepta ? null : t("errors.aceptaTerminos"),
  }
  const invalido = (k: keyof typeof errores) => (intento && errores[k] ? true : undefined)
  const fuerza = fuerzaPassword(password)
  const reglas = reglasPassword(password)

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    setIntento(true)
    if (Object.values(errores).some(Boolean)) {
      playSound("error")
      shake(formulario.current)
      requestAnimationFrame(() =>
        formulario.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus()
      )
      return
    }
    setEnviando(true)
    const r = await crearCuenta({ nombre, correo, password, mayorDeEdad })
    setEnviando(false)
    if (!r.ok) {
      toast.error(t("signup.failed"), { description: t(`errors.${r.error}`) })
      return
    }
    // Cada consentimiento con la clave exacta del texto que se enseñó (§3.5)
    registrar({
      nombre,
      correo,
      // Qué viene a hacer se pregunta en la primera toma de la bienvenida: es
      // lo que decide el resto del recorrido, y el alta solo pide lo que hace
      // falta para tener cuenta
      tipo: null,
      mayorDeEdad: true,
      consentimientos: [
        { finalidad: "terminos", valor: true, textoId: "auth.signup.accept" },
        { finalidad: "privacidad", valor: true, textoId: "auth.signup.accept" },
        { finalidad: "mayor-edad", valor: true, textoId: "auth.signup.adult.label" },
        { finalidad: "estadisticas", valor: true, textoId: "auth.signup.privacyNote" },
      ],
    })
    // Sin celebración: la bienvenida la da la primera toma
    router.push({ pathname: "/bienvenida", query: consultaBienvenida(next) })
  }

  return (
    <form
      ref={formulario}
      onSubmit={enviar}
      noValidate
      className="space-y-5"
      aria-label={t("signup.formLabel")}
    >
      <Field data-invalid={invalido("nombre")}>
        <FieldLabel htmlFor="registro-nombre">{t("fields.name")}</FieldLabel>
        <Input
          id="registro-nombre"
          autoComplete="name"
          className="h-11"
          value={nombre}
          aria-invalid={invalido("nombre")}
          onChange={(e) => setNombre(e.target.value)}
        />
        {intento && errores.nombre && <FieldError>{errores.nombre}</FieldError>}
      </Field>

      <Field data-invalid={invalido("correo")}>
        <FieldLabel htmlFor="registro-correo">{t("fields.email")}</FieldLabel>
        <Input
          id="registro-correo"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          placeholder={t("fields.emailPlaceholder")}
          className="h-11"
          value={correo}
          aria-invalid={invalido("correo")}
          onChange={(e) => setCorreo(e.target.value)}
        />
        {intento && errores.correo && <FieldError>{errores.correo}</FieldError>}
      </Field>

      <Field data-invalid={invalido("password")}>
        <FieldLabel htmlFor="registro-password">{t("fields.password")}</FieldLabel>
        <PasswordInput
          id="registro-password"
          autoComplete="new-password"
          value={password}
          minLength={PASSWORD_MIN}
          aria-invalid={invalido("password")}
          aria-describedby="registro-password-reglas"
          onChange={(e) => setPassword(e.target.value)}
        />
        {/* Medidor: cuatro tramos y la palabra, nunca solo el color */}
        <div className="flex items-center gap-3" aria-live="polite">
          <div className="grid flex-1 grid-cols-4 gap-1" aria-hidden>
            {[1, 2, 3, 4].map((n) => (
              <span
                key={n}
                className={cn(
                  "h-1.5 rounded-full transition-colors",
                  n <= fuerza ? COLOR_FUERZA[fuerza] : "bg-muted"
                )}
              />
            ))}
          </div>
          <span className="w-20 text-right text-xs text-muted-foreground">
            {t(`password.strength.${fuerza}`)}
          </span>
        </div>
        <ul id="registro-password-reglas" className="grid gap-1 text-xs sm:grid-cols-2">
          {reglas.map((r) => (
            <li
              key={r.id}
              className={cn(
                "flex items-center gap-1.5",
                r.cumple ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {r.cumple ? (
                <Check className="size-3.5 shrink-0 text-success" aria-hidden />
              ) : (
                <Circle className="size-3.5 shrink-0" aria-hidden />
              )}
              {textoRegla(t, r.id)}
              <span className="sr-only">
                {r.cumple ? t("password.ruleMet") : t("password.ruleMissing")}
              </span>
            </li>
          ))}
        </ul>
        {intento && errores.password && <FieldError>{errores.password}</FieldError>}
      </Field>

      {/* 18+ antes que los términos y separada de ellos: no se puede aceptar de paso */}
      <Field orientation="horizontal" data-invalid={invalido("mayorDeEdad")}>
        <Checkbox
          id="registro-mayor-edad"
          checked={mayorDeEdad}
          aria-invalid={invalido("mayorDeEdad")}
          aria-describedby="registro-mayor-edad-ayuda"
          onCheckedChange={(v) => setMayorDeEdad(v === true)}
        />
        {/* `FieldContent` y no un `div`: `Field` solo alinea arriba la casilla
            cuando su compañero es el contenido del campo. Con un `div` suelto
            la centraba respecto a las dos líneas y quedaba a media altura */}
        <FieldContent>
          <FieldLabel htmlFor="registro-mayor-edad" className="font-normal">
            {t("signup.adult.label")}
          </FieldLabel>
          <FieldDescription id="registro-mayor-edad-ayuda">
            {t("signup.adult.help")}
          </FieldDescription>
          {intento && errores.mayorDeEdad && (
            <FieldError>{errores.mayorDeEdad}</FieldError>
          )}
        </FieldContent>
      </Field>

      <Field orientation="horizontal" data-invalid={invalido("acepta")}>
        <Checkbox
          id="registro-acepta"
          checked={acepta}
          aria-invalid={invalido("acepta")}
          aria-describedby="registro-aviso-datos"
          onCheckedChange={(v) => setAcepta(v === true)}
        />
        <FieldContent>
          <FieldLabel htmlFor="registro-acepta" className="inline font-normal">
            {t.rich("signup.accept", {
              terms: (chunks) => (
                <Link
                  href="/legal/terminos"
                  className="underline underline-offset-4"
                  target="_blank"
                >
                  {chunks}
                </Link>
              ),
              privacy: (chunks) => (
                <Link
                  href="/legal/privacidad"
                  className="underline underline-offset-4"
                  target="_blank"
                >
                  {chunks}
                </Link>
              ),
            })}
          </FieldLabel>
          {intento && errores.acepta && <FieldError>{errores.acepta}</FieldError>}
          {/* Autorización informada de las estadísticas agregadas (N2, §3.5) */}
          <FieldDescription id="registro-aviso-datos" className="text-xs">
            {t.rich("signup.privacyNote", {
              privacy: (chunks) => (
                <Link
                  href="/legal/privacidad"
                  className="underline underline-offset-4"
                  target="_blank"
                >
                  {chunks}
                </Link>
              ),
            })}
          </FieldDescription>
        </FieldContent>
      </Field>

      <Button
        type="submit"
        variant="brand"
        size="lg"
        className="h-11 w-full"
        disabled={enviando || bloqueado}
      >
        {enviando ? (
          <>
            <Spinner /> {t("signup.submitting")}
          </>
        ) : (
          t("signup.submit")
        )}
      </Button>
    </form>
  )
}

/* ---------------------------------------------------------------------------
   Recuperar
   --------------------------------------------------------------------------- */

function Recuperar({
  correo,
  setCorreo,
  onVolver,
}: {
  correo: string
  setCorreo: (v: string) => void
  onVolver: () => void
}) {
  const t = useTranslations("auth")
  const errorCampo = useErrorCampo()
  const [intento, setIntento] = React.useState(false)
  const [enviando, setEnviando] = React.useState(false)
  const [enviadoA, setEnviadoA] = React.useState<string | null>(null)
  const [espera, setEspera] = React.useState(0)
  const error = errorCampo(validarCorreo(correo))

  React.useEffect(() => {
    if (espera <= 0) return
    const temporizador = setTimeout(() => setEspera((s) => s - 1), 1000)
    return () => clearTimeout(temporizador)
  }, [espera])

  const enviar = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setIntento(true)
    if (error) {
      playSound("error")
      return
    }
    setEnviando(true)
    const r = await enviarEnlaceRecuperacion(correo)
    setEnviando(false)
    if (!r.ok) {
      toast.error(t("recover.failed"), { description: t(`errors.${r.error}`) })
      return
    }
    setEnviadoA(correo.trim())
    setEspera(ESPERA_REENVIO_S)
    toast.success(t("recover.success"), { description: t("recover.checkSpam") })
  }

  const volver = (
    <Button type="button" variant="ghost" className="-ml-3" onClick={onVolver}>
      <ArrowLeft /> {t("recover.back")}
    </Button>
  )

  if (enviadoA) {
    return (
      <div className="space-y-6" role="status">
        <div className="flex gap-4 rounded-xl bg-muted/60 p-5">
          <MailCheck className="size-6 shrink-0 text-success" aria-hidden />
          <div className="space-y-1 text-sm">
            <p className="font-semibold">{t("recover.sentTitle")}</p>
            <p className="text-pretty text-muted-foreground">
              {t.rich("recover.sentText", {
                email: enviadoA,
                b: (chunks) => <strong className="text-foreground">{chunks}</strong>,
              })}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          {volver}
          <Button
            type="button"
            variant="outline"
            disabled={espera > 0 || enviando}
            onClick={() => void enviar()}
          >
            {espera > 0
              ? t("recover.resendIn", { seconds: espera })
              : t("recover.resend")}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form
      onSubmit={enviar}
      noValidate
      className="space-y-5"
      aria-label={t("recover.formLabel")}
    >
      <Field data-invalid={intento && error ? true : undefined}>
        <FieldLabel htmlFor="recuperar-correo">{t("recover.email")}</FieldLabel>
        <Input
          id="recuperar-correo"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          placeholder={t("fields.emailPlaceholder")}
          className="h-11"
          value={correo}
          aria-invalid={intento && error ? true : undefined}
          onChange={(e) => setCorreo(e.target.value)}
        />
        {intento && error ? (
          <FieldError>{error}</FieldError>
        ) : (
          <FieldDescription>{t("recover.emailHint")}</FieldDescription>
        )}
      </Field>
      <Button
        type="submit"
        variant="brand"
        size="lg"
        className="h-11 w-full"
        disabled={enviando}
      >
        {enviando ? (
          <>
            <Spinner /> {t("recover.submitting")}
          </>
        ) : (
          t("recover.submit")
        )}
      </Button>
      {volver}
    </form>
  )
}
