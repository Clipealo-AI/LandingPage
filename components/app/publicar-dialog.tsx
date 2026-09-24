"use client"

import * as React from "react"
import { CalendarClock, Send } from "lucide-react"
import { useTranslations } from "next-intl"

import { Link, useRouter } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import { toast } from "@/lib/toast"
import {
  AHORA_AGENDA,
  entradasDeClip,
  estadoVistoAgenda,
  repartirEnDestinos,
  validarEntrada,
  type AvisoAgenda,
  type ClipDeAgenda,
  type DestinoPublicacion,
  type EstadoVistoAgenda,
} from "@/lib/agenda"
import {
  copiaConTexto,
  copiaEfectiva,
  hayBloqueoPublicacion,
  textoParaEnviar,
  validarCopia,
  type CopiaPublicacion,
} from "@/lib/publicacion"
import { cuentasPublicables } from "@/lib/planes"
import { PLAN_MINIMO, puedeProgramar } from "@/lib/pricing"
import {
  SOCIAL_NETWORKS,
  cuentaActiva,
  duenoCuenta,
  type SocialAccount,
} from "@/lib/social"
import { useAgenda } from "@/hooks/use-agenda"
import { usePlan } from "@/hooks/use-plan"
import { usePublicacion } from "@/hooks/use-publicacion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { SocialGlyph } from "@/components/brand/social"
import { AvisoPlan } from "@/components/planes/aviso-plan"
import { useNombrePlan } from "@/components/planes/nombre-plan"

/**
 * Publicar un clip en las cuentas conectadas que la persona elija.
 *
 * Dos acciones con puertas distintas y las dos escritas: **ahora** sale en
 * cuanto se confirma y está en todos los planes, también en Prueba con su
 * única cuenta de TikTok; **programar** elige día y hora y es del plan que diga
 * `PLAN_MINIMO.programar`.
 *
 * Nada se esconde. Una cuenta que el plan no cubre sale apagada con el motivo
 * debajo, igual que en Redes conectadas; un clip que no encaja en la red —un
 * 4:5 en TikTok, un minuto y medio en un Short— también, porque elegirla y que
 * falle después es peor que no poder elegirla.
 */
export function PublicarDialog({
  clip,
  children,
  abierto,
  onAbiertoChange,
}: {
  clip: ClipDeAgenda
  /** El disparador. Sin él, el diálogo se controla desde fuera. */
  children?: React.ReactNode
  abierto?: boolean
  onAbiertoChange?: (v: boolean) => void
}) {
  const t = useTranslations("app.publicar")
  const tc = useTranslations("calendario.compositor.errores")
  const tPlanes = useTranslations("pricing")
  const tFalloRaw = useTranslations("calendario.fallo")
  const tFallo = (code: string) => tFalloRaw(code as never)
  const router = useRouter()
  const { plan } = usePlan()
  const nombrePlan = useNombrePlan()
  const { guardado } = usePublicacion()
  const { entradas, cuentas, publicarAhora } = useAgenda()
  const [propio, setPropio] = React.useState(false)
  const abiertoReal = abierto ?? propio
  const cambiarAbierto = onAbiertoChange ?? setPropio

  const [elegidas, setElegidas] = React.useState<string[]>([])
  const [enviando, setEnviando] = React.useState(false)

  // Las cuentas de quien mira: las de la agencia no se le ofrecen al clipero
  const mias = React.useMemo(
    () => cuentas.filter((c) => cuentaActiva(c) && duenoCuenta(c) === "clipero"),
    [cuentas]
  )
  const publicables = React.useMemo(
    () => new Set(cuentasPublicables(plan, mias).map((c) => c.id)),
    [plan, mias]
  )

  /** Lo que impide publicar en esa cuenta, ya escrito. `null` es adelante. */
  const motivoDe = React.useCallback(
    (cuenta: SocialAccount): string | null => {
      if (!publicables.has(cuenta.id))
        return t("fueraDelCupo", {
          plan: nombrePlan(plan),
          max: plan.cuentas,
          red: SOCIAL_NETWORKS[cuenta.network].name,
        })
      const avisos: AvisoAgenda[] = validarEntrada(
        {
          clipId: clip.id,
          red: cuenta.network,
          cuentaId: cuenta.id,
          programadaPara: AHORA_AGENDA,
          modo: "ahora",
        },
        { clip, cuentas, entradas, instante: AHORA_AGENDA }
      )
      const duro = avisos.find((a) => a.bloquea)
      if (!duro) return null
      return tc(`${duro.code}`, {
        red: SOCIAL_NETWORKS[cuenta.network].name,
        aspecto: duro.values?.aspecto ?? "",
        segundos: duro.values?.segundos ?? 0,
        max: duro.values?.max ?? 0,
        min: duro.values?.min ?? 0,
        minutos: duro.values?.minutos ?? 0,
        n: 1,
      })
    },
    [publicables, plan, nombrePlan, t, tc, clip, cuentas, entradas]
  )

  const copiaPara = React.useCallback(
    (red: SocialAccount["network"]): CopiaPublicacion =>
      copiaEfectiva(guardado, { id: clip.id, sourceId: clip.sourceId }, red),
    [guardado, clip.id, clip.sourceId]
  )

  /**
   * Redes elegidas cuyo texto la red no aceptaría: se dice antes de mandar.
   *
   * Sin nada escrito no hay nada roto: sale el gancho del clip, que es lo que
   * propone la IA. Bloquear por «vacía» obligaría a escribir un texto por red
   * antes de poder publicar nada, que es justo lo que el producto evita.
   */
  const textosRotos = React.useMemo(() => {
    const redes = new Set(
      elegidas
        .map((id) => mias.find((c) => c.id === id)?.network)
        .filter(Boolean as unknown as (v: unknown) => v is SocialAccount["network"])
    )
    return [...redes].filter((red) => {
      const copia = copiaPara(red)
      return copiaConTexto(copia) && hayBloqueoPublicacion(validarCopia(copia, red))
    })
  }, [elegidas, mias, copiaPara])

  /**
   * Dos listas y no una con huecos: primero dónde SÍ se puede publicar, y
   * debajo, en gris, lo que el plan o el formato dejan fuera con su motivo.
   * Mezcladas, un plan Prueba veía tres casillas de las que solo una servía.
   */
  const conMotivo = React.useMemo(
    () => mias.map((cuenta) => ({ cuenta, motivo: motivoDe(cuenta) })),
    [mias, motivoDe]
  )
  const disponibles = conMotivo.filter((x) => !x.motivo)
  const bloqueadas = conMotivo.filter((x) => x.motivo)

  const puedeSalir = elegidas.length > 0 && textosRotos.length === 0 && !enviando

  const alPublicar = async () => {
    const destinos: DestinoPublicacion[] = elegidas
      .map((id) => mias.find((c) => c.id === id))
      .filter(Boolean as unknown as (v: unknown) => v is SocialAccount)
      .map((c) => ({ red: c.network, cuentaId: c.id }))
    if (destinos.length === 0) return

    setEnviando(true)
    // `cada: 0`: «ahora» es ahora también cuando son dos cuentas de la misma red
    const nuevas = repartirEnDestinos([clip], destinos, AHORA_AGENDA, 0, {
      // Sin copia propia la entrada se queda con su `texto`, que es el gancho
      copia: (_c, red) => (copiaConTexto(copiaPara(red)) ? copiaPara(red) : undefined),
      texto: (c, red) => textoParaEnviar(copiaPara(red), red) || c.hook,
    })
    const hechos = await publicarAhora(nuevas)
    setEnviando(false)
    cambiarAbierto(false)
    setElegidas([])

    const bien = hechos.filter((h) => h.hecho)
    const mal = hechos.filter((h) => !h.hecho)
    if (bien.length)
      toast.celebrate(t("publicadas", { n: bien.length }), {
        description: t("publicadasAyuda"),
      })
    for (const fallo of mal)
      toast.error(t("noSalio", { red: SOCIAL_NETWORKS[fallo.entrada.red].name }), {
        description: fallo.fallo ? tFallo(fallo.fallo) : undefined,
      })
  }

  const programable = puedeProgramar(plan)

  return (
    <Dialog open={abiertoReal} onOpenChange={cambiarAbierto}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("titulo")}</DialogTitle>
          <DialogDescription>{t("descripcion")}</DialogDescription>
        </DialogHeader>

        {mias.length === 0 ? (
          <div className="space-y-3 rounded-lg bg-muted/40 p-4">
            <p className="text-sm text-pretty">{t("sinCuentas")}</p>
            <Button variant="outline" asChild>
              <Link href={{ pathname: "/ajustes", query: { seccion: "social" } }}>
                {t("conectar")}
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {disponibles.length > 0 ? (
              <fieldset className="space-y-2">
                <legend className="mb-2 text-sm font-medium">{t("cuentas")}</legend>
                {disponibles.map(({ cuenta }) => {
                  const id = `publicar-${cuenta.id}`
                  const marcada = elegidas.includes(cuenta.id)
                  return (
                    <label
                      key={cuenta.id}
                      htmlFor={id}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-lg p-3 ring-1 transition-colors",
                        marcada
                          ? "bg-primary/5 ring-primary/40"
                          : "ring-border hover:bg-muted/40"
                      )}
                    >
                      <Checkbox
                        id={id}
                        checked={marcada}
                        onCheckedChange={() =>
                          setElegidas((s) =>
                            s.includes(cuenta.id)
                              ? s.filter((x) => x !== cuenta.id)
                              : [...s, cuenta.id]
                          )
                        }
                        className="mt-0.5"
                      />
                      <span className="min-w-0 flex-1 space-y-1">
                        <span className="flex items-center gap-2 text-sm font-medium">
                          <SocialGlyph
                            network={cuenta.network}
                            tone="official"
                            className="size-4"
                            aria-hidden
                          />
                          {SOCIAL_NETWORKS[cuenta.network].name}
                          <span className="truncate font-normal text-muted-foreground">
                            {cuenta.handle}
                          </span>
                        </span>
                        {/* Lo que va a salir, en cuanto se marca: publicar a
                            ciegas es lo que hace que nadie escriba el texto */}
                        {marcada && (
                          <span className="line-clamp-2 block text-xs text-muted-foreground">
                            {textoParaEnviar(copiaPara(cuenta.network), cuenta.network) ||
                              clip.hook}
                          </span>
                        )}
                      </span>
                    </label>
                  )
                })}
              </fieldset>
            ) : (
              <p className="rounded-lg bg-muted/40 p-3 text-sm text-pretty">
                {t("ningunaDisponible")}
              </p>
            )}

            {/* Lo que no se puede usar va aparte y en gris, no mezclado entre
                las casillas: tres filas apagadas con el mismo motivo repetido
                se leen como un error, no como un límite */}
            {bloqueadas.length > 0 && (
              <div className="space-y-2 rounded-lg bg-muted/40 p-3">
                <p className="text-sm font-medium text-muted-foreground">
                  {t("fuera", { n: bloqueadas.length })}
                </p>
                <ul className="space-y-1.5">
                  {bloqueadas.map(({ cuenta, motivo }) => (
                    <li
                      key={cuenta.id}
                      className="flex flex-wrap items-baseline gap-x-2 text-sm"
                    >
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <SocialGlyph
                          network={cuenta.network}
                          tone="current"
                          className="size-3.5"
                          aria-hidden
                        />
                        {SOCIAL_NETWORKS[cuenta.network].name} {cuenta.handle}
                      </span>
                      <span className="text-xs text-muted-foreground">{motivo}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/precios"
                  className="inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  {tPlanes("gate.cta")}
                </Link>
              </div>
            )}
          </div>
        )}

        {textosRotos.length > 0 && (
          <ul className="space-y-1 text-sm text-destructive" role="status">
            {textosRotos.map((red) => (
              <li key={red}>{t("textoNoCabe", { red: SOCIAL_NETWORKS[red].name })}</li>
            ))}
          </ul>
        )}

        {/* Las dos acciones en una fila y el motivo debajo, a lo ancho: con el
            aviso metido entre los botones, «Publicar ahora» quedaba bailando a
            media altura y el motivo parecía suyo y no de «Programar» */}
        <DialogFooter className="flex-col items-stretch gap-2 sm:flex-col">
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="outline"
              disabled={!programable}
              aria-describedby={programable ? undefined : "publicar-plan"}
              onClick={() => {
                cambiarAbierto(false)
                router.push({
                  pathname: "/calendario",
                  query: { crear: "1", clips: clip.id },
                })
              }}
            >
              <CalendarClock /> {t("programar")}
            </Button>
            <Button variant="brand" disabled={!puedeSalir} onClick={alPublicar}>
              {enviando ? <Spinner /> : <Send />}
              {elegidas.length > 1
                ? t("publicarEnVarias", { n: elegidas.length })
                : t("publicarAhora")}
            </Button>
          </div>
          {!programable && (
            <AvisoPlan
              id="publicar-plan"
              alinear="end"
              motivo={t("programarBloqueado", {
                plan: nombrePlan(PLAN_MINIMO.programar),
              })}
            />
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Cómo se pinta cada estado. El estado va escrito: el color solo acompaña. */
const VARIANTE_ESTADO: Record<
  EstadoVistoAgenda,
  React.ComponentProps<typeof Badge>["variant"]
> = {
  planificada: "outline",
  "toca-publicar": "default",
  publicando: "default",
  publicada: "success",
  fallida: "destructive",
  cancelada: "secondary",
  "sin-cuenta": "destructive",
}

/**
 * Lo publicado y lo programado de un clip, con su estado escrito y el enlace
 * que devolvió la red. Es lo que cierra el ciclo dentro de la ficha: antes
 * había que irse al calendario a ver si algo había salido.
 */
export function DondeHaSalido({ clipId }: { clipId: string }) {
  const t = useTranslations("app.publicar")
  const te = useTranslations("calendario.estado")
  const { entradas, cuentas } = useAgenda()
  const suyas = entradasDeClip(entradas, clipId)
  if (suyas.length === 0)
    return <p className="text-sm text-muted-foreground">{t("todaviaNada")}</p>
  return (
    <ul className="space-y-1.5">
      {suyas.map((e) => {
        const estado = estadoVistoAgenda(e, cuentas, AHORA_AGENDA)
        return (
          <li key={e.id} className="flex items-center gap-2 text-sm">
            <SocialGlyph
              network={e.red}
              tone="current"
              className="size-3.5 shrink-0"
              aria-hidden
            />
            <span className="min-w-0 truncate">{SOCIAL_NETWORKS[e.red].name}</span>
            <Badge variant={VARIANTE_ESTADO[estado]}>{te(estado)}</Badge>
            {e.url && (
              <a
                href={e.url}
                target="_blank"
                rel="noreferrer"
                className="ml-auto shrink-0 text-primary underline-offset-4 hover:underline"
              >
                {t("abrir")}
              </a>
            )}
          </li>
        )
      })}
    </ul>
  )
}
