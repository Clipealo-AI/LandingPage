"use client"

import { Check, Plus, Unplug } from "lucide-react"
import { useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import { formatDuration } from "@/lib/format"
import { toast } from "@/lib/toast"
import { useFormat } from "@/hooks/use-format"
import { useCuentasSociales } from "@/hooks/use-cuentas-sociales"
import {
  cuentasDeRed,
  duenoCuenta,
  socialAccounts,
  SOCIAL_NETWORKS,
  socialList,
  type SocialId,
} from "@/lib/social"
import { PLAN_MINIMO } from "@/lib/pricing"
import { hayBloqueoConexion, validarConexion } from "@/lib/planes"
import { useCampanas } from "@/hooks/use-campanas"
import { usePlan } from "@/hooks/use-plan"
import { AvisoPlan } from "@/components/planes/aviso-plan"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SocialBadge } from "@/components/brand/social"
import { useNombrePlan } from "@/components/planes/nombre-plan"

/**
 * Cuentas conectadas.
 *
 * Cada tarjeta es un objetivo grande y pulsable: conectar una red es una acción
 * poco frecuente pero decisiva, así que se prioriza la claridad del estado sobre
 * la densidad. El borde discontinuo marca lo que falta por conectar — el mismo
 * lenguaje que la zona de subida.
 *
 * Las conexiones NO son estado de esta pantalla: viven en `useCuentasSociales()`,
 * que las guarda en el navegador. Antes eran un `useState` que se perdía al
 * recargar y del que nadie más se enteraba; ahora conectar o desconectar una red
 * se ve al momento en el Calendario, donde una entrada cuya cuenta ya no está se
 * lee «Sin cuenta».
 *
 * El plan manda (`validarConexion`): Prueba conecta una cuenta y solo de
 * TikTok; Creador seis y Empresa veinte, sumando todas las redes. Una red que
 * no entra se ve igual, con su tarjeta apagada y el motivo escrito debajo;
 * desconectar siempre se puede.
 */
export function SocialAccounts() {
  const t = useTranslations("settings.accounts")
  const tSocial = useTranslations("common.social")
  const f = useFormat()
  const nombrePlan = useNombrePlan()
  const { cuentas, activas, conectar, desconectar } = useCuentasSociales()
  const { plan } = usePlan()
  const { perfil } = useCampanas()
  // El cupo se cuenta sobre las cuentas de quien mira: las de la agencia no
  // gastan las del clipero, aunque en la demo vivan en el mismo navegador
  const mias = activas.filter(
    (c) => duenoCuenta(c) === (perfil === "agencia" ? "agencia" : "clipero")
  )

  /** Las cuentas vivas de esa red. La demo trae dos de TikTok. */
  const conectadasDe = (id: SocialId) => cuentasDeRed(id, cuentas)

  const alternar = (id: SocialId) => {
    const red = SOCIAL_NETWORKS[id]
    const activas = conectadasDe(id)
    if (activas.length > 0) {
      // El interruptor es de la RED: si una red tiene dos cuentas, no puede
      // quedarse a medias desconectada
      activas.forEach((c) => desconectar(c.id))
      toast(t("disconnected.title", { network: red.name }), {
        description: t("disconnected.description"),
        sound: "toggle-off",
      })
      return
    }
    // Reconectar devuelve las cuentas que había, no una inventada. El id que
    // se usaba —`cta_tiktok_1`— no existe en ninguna semilla, así que el hook
    // no la reconocía, dejaba las de verdad desconectadas para siempre y
    // añadía una cuenta nueva con «@clipealo» y cero seguidores encima.
    const suyas = cuentasDeRed(id, socialAccounts)
    if (suyas.length > 0) suyas.forEach((c) => conectar(c))
    else
      conectar({
        // La cuenta se identifica por sí misma, no por su red: el plan Creador
        // vende seis y «TikTok» no basta para saber dónde se publica
        id: `cta_${id}_1`,
        network: id,
        handle: "@clipealo",
        followers: 0,
        // Fecha fija: el «hoy» de la demo es anterior al real y «Desde el…» no
        // puede quedar en el futuro
        connectedAt: "2026-09-09T00:00:00.000Z",
        estado: "conectada",
        dueno: "clipero",
      })
    const superficie = tSocial(`surface.${id}`)
    toast.celebrate(t("connectedToast.title", { network: red.name }), {
      description: t("connectedToast.description", {
        // En mitad de la frase va en minúscula; en inglés, «Reels» y «For You» son nombres propios
        surface: f.locale === "en" ? superficie : superficie.toLowerCase(),
      }),
    })
  }

  // Se cuentan REDES, no cuentas: el total es el de la lista de redes
  const total = socialList.filter((red) => conectadasDe(red.id).length > 0).length

  return (
    <section aria-labelledby="redes" className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="redes" className="text-lg font-bold tracking-tight">
          {t("title")}
        </h2>
        <p className="text-sm text-muted-foreground tabular-nums">
          {t("count", { connected: total, total: socialList.length })} ·{" "}
          {t("cupo", { max: plan.cuentas, plan: nombrePlan(plan) })}
        </p>
      </div>

      <ul className="grid items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {socialList.map((red) => {
          const cuenta = conectadasDe(red.id)[0]
          const activa = Boolean(cuenta)
          // Conectar pasa por el plan; desconectar, nunca
          const avisos = activa ? [] : validarConexion(plan, red.id, mias)
          const bloqueada = hayBloqueoConexion(avisos)
          const idAviso = `red-${red.id}-aviso`

          return (
            <li key={red.id} className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => alternar(red.id)}
                aria-pressed={activa}
                disabled={bloqueada}
                aria-describedby={bloqueada ? idAviso : undefined}
                className={cn(
                  "group/red relative flex h-full w-full flex-col items-center gap-3 rounded-2xl border-2 p-6 text-center focus-visible:outline-ring",
                  "transition-[border-color,background-color,box-shadow,transform] duration-200 ease-[var(--ease-brand)]",
                  "hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:shadow-sm",
                  "focus-visible:outline-2 focus-visible:outline-offset-2",
                  activa
                    ? "border-success/40 bg-success/5"
                    : "border-dashed border-border bg-card hover:border-primary/40",
                  bloqueada && "hover:translate-y-0 hover:shadow-none"
                )}
              >
                <SocialBadge network={red.id} size="lg" tone="marca" />

                <span className="space-y-1">
                  <span className="block font-semibold">{red.name}</span>
                  {activa ? (
                    <Badge variant="success" className="gap-1">
                      <Check aria-hidden /> {t("connected")}
                    </Badge>
                  ) : (
                    <span className="block text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      {t("notConnected")}
                    </span>
                  )}
                </span>

                <span className="text-xs text-balance text-muted-foreground">
                  {activa && cuenta ? (
                    <>
                      {cuenta.handle}
                      {cuenta.followers
                        ? ` · ${t("followers", { n: cuenta.followers, count: f.compact(cuenta.followers) })}`
                        : ""}
                      {cuenta.connectedAt ? (
                        <span className="mt-0.5 block opacity-70">
                          {t("since", { date: f.date(cuenta.connectedAt) })}
                        </span>
                      ) : null}
                    </>
                  ) : (
                    <>
                      {t("limits", {
                        surface: tSocial(`surface.${red.id}`),
                        aspect: red.aspects[0],
                        duration: formatDuration(red.maxSeconds),
                      })}
                    </>
                  )}
                </span>

                {/* El icono de acción aparece al enfocar o pasar por encima */}
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-3 right-3 text-muted-foreground opacity-0 transition-opacity duration-200",
                    "group-hover/red:opacity-100 group-focus-visible/red:opacity-100"
                  )}
                >
                  {activa ? (
                    <Unplug className="size-4" />
                  ) : (
                    <Plus className="size-4 text-primary" />
                  )}
                </span>
              </button>
              {bloqueada && (
                <AvisoPlan
                  id={idAviso}
                  motivo={
                    avisos[0].code === "redFueraDelPlan"
                      ? t("fueraDelPlan", { network: red.name, plan: nombrePlan(plan) })
                      : t("sinCupo", { plan: nombrePlan(plan), max: plan.cuentas })
                  }
                />
              )}
            </li>
          )
        })}
      </ul>

      {/* El plan sale de `PLAN_MINIMO`, no de la cadena "creator": si mañana
          programar pasa a otro plan, esta nota se entera sola. Y el enlace va a
          /precios, como el resto de las puertas de plan */}
      <p className="text-xs text-muted-foreground">
        {t("planNote", { plan: nombrePlan(PLAN_MINIMO.programar) })}{" "}
        <Button variant="link" size="sm" className="h-auto p-0 text-xs" asChild>
          <Link href="/precios">{t("seePlans")}</Link>
        </Button>
      </p>
    </section>
  )
}
