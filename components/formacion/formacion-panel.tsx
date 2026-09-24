"use client"

import * as React from "react"
import { useTranslations } from "next-intl"

import { toast } from "@/lib/toast"
import { prefiereMenosMovimiento } from "@/lib/motion"
import {
  alAlcance,
  leccionPorId,
  leccionesDe,
  minutosPublicados,
  perfilDesdeClipero,
  publicadas,
  razonRecomendacion,
  recomendadas,
  rutaOculta,
  rutaPorId,
  rutaRecomendada,
  siguienteLeccion,
  vistaDe,
  type Leccion,
} from "@/lib/formacion"
import { useCampanas } from "@/hooks/use-campanas"
import { useCuenta } from "@/hooks/use-cuenta"
import { usePlan } from "@/hooks/use-plan"
import { useCatalogo } from "@/hooks/use-catalogo-formacion"
import { LeccionCard } from "@/components/formacion/leccion-card"
import { ReproductorLeccion } from "@/components/formacion/reproductor-leccion"
import { RutaPanel } from "@/components/formacion/ruta-panel"
import { useProgresoFormacion } from "@/components/formacion/use-progreso"
import { useTextoClase, useTextoRuta } from "@/components/formacion/texto-clase"

/**
 * Formación del clipero: la ruta que le toca arriba, la clase abierta debajo y
 * el catálogo entero ordenado por lo que clipea.
 *
 * Lo que se recomienda sale de sus respuestas del onboarding (temas, redes y
 * cuánto ha editado) y lo que lleva visto, del navegador. Nada inventado: sin
 * respuestas, el orden es el de publicación y la ruta, la primera.
 */
export function FormacionPanel() {
  const t = useTranslations("formacion")
  const texto = useTextoClase()
  const textoRuta = useTextoRuta()
  const { cuenta } = useCuenta()
  const { envios, cuenta: cuentaCampanas } = useCampanas()
  const { progreso, ver, completar, reiniciar, ocultarRuta } = useProgresoFormacion()

  const { plan } = usePlan()
  const catalogo = useCatalogo()

  const perfil = React.useMemo(() => perfilDesdeClipero(cuenta.clipero), [cuenta.clipero])
  // El orden no depende de lo visto a propósito: marcar una clase no puede
  // reordenar la rejilla bajo el cursor de quien acaba de pulsar
  const orden = React.useMemo(
    () => recomendadas(perfil, { catalogo, plan }),
    [perfil, catalogo, plan]
  )
  const conPerfil = (perfil.temas?.length ?? 0) > 0 || perfil.experiencia !== undefined

  // `rutaRecomendada` salta a la siguiente en cuanto la actual se termina: al
  // marcar la última clase, la ruta recién terminada desaparecía de la tarjeta y
  // en su sitio aparecía otra sin empezar. Se fija la que se está enseñando y se
  // cambia con el botón, nunca bajo el dedo de quien acaba de pulsar.
  // Lo medido en vez de lo que nadie ha preguntado: haber enviado un clip es
  // la diferencia entre «Tu primera semana» y «Sube tus vistas»
  const yaPublica = envios.some((e) => e.userId === cuentaCampanas.userId)
  const recomendada = rutaRecomendada(perfil, progreso, catalogo, { yaPublica })
  const [fijadaId, setFijadaId] = React.useState<string | null>(null)
  // Sin ninguna ruta con clases publicadas no hay tarjeta de ruta: el admin las
  // despublicó todas y fingir una sería inventar
  const ruta = (fijadaId ? rutaPorId(fijadaId, catalogo) : undefined) ?? recomendada
  const otraRuta = ruta && recomendada && ruta.id !== recomendada.id ? recomendada : null
  const oculta = ruta ? rutaOculta(progreso, ruta.id) : false

  const [abiertaId, setAbiertaId] = React.useState<string | null>(null)
  const abiertaCruda = abiertaId ? (leccionPorId(abiertaId, catalogo) ?? null) : null
  // Si el admin la despublica mientras alguien la tiene abierta, se cierra: el
  // catálogo manda, y seguir reproduciendo algo que ya no existe sería mentir
  const abierta = abiertaCruda?.estado === "publicada" ? abiertaCruda : null

  const clases = publicadas(catalogo)
  const vistas = clases.filter((l) => vistaDe(progreso, l.id).completada).length
  const zonaLeccion = React.useRef<HTMLDivElement>(null)
  const avisadoSinGuardar = React.useRef(false)

  // Al abrir una clase, el foco y la vista van a ella: si no, el reproductor
  // aparece fuera de pantalla y con el teclado no hay forma de llegar
  React.useEffect(() => {
    if (!abiertaId) return
    const zona = zonaLeccion.current
    if (!zona) return
    zona.focus({ preventScroll: true })
    zona.scrollIntoView({
      block: "start",
      behavior: prefiereMenosMovimiento() ? "auto" : "smooth",
    })
  }, [abiertaId])

  /** Avisa una sola vez si el navegador no guarda nada (incógnito, permisos). */
  const comprobarGuardado = React.useCallback(
    (guardado: boolean) => {
      if (guardado || avisadoSinGuardar.current) return
      avisadoSinGuardar.current = true
      toast.warning(t("avisos.sinGuardar"))
    },
    [t]
  )

  const abrir = React.useCallback((leccion: Leccion) => setAbiertaId(leccion.id), [])

  /**
   * Sin `useCallback`: resolver el título traducido dentro obliga a depender de
   * los dos resolutores, y con esas dependencias las reglas de `react-hooks`
   * avisaban en cada render sin que memorizarlo comprara nada.
   */
  const marcar = (leccion: Leccion) => {
    // ¿Era la última que quedaba de la ruta? Terminarla sí es un hito
    const pendientes = ruta
      ? leccionesDe(ruta, catalogo).filter((l) => !vistaDe(progreso, l.id).completada)
      : []
    const terminaRuta = pendientes.length === 1 && pendientes[0].id === leccion.id
    comprobarGuardado(completar(leccion))
    if (terminaRuta && ruta) {
      // La deja fijada: el premio es verla terminada, no que la sustituya la
      // siguiente ruta en el mismo píxel
      setFijadaId(ruta.id)
      toast.celebrate(t("avisos.rutaTerminada", { titulo: textoRuta(ruta, "titulo") }))
    } else {
      toast.success(t("avisos.completada", { titulo: texto(leccion, "titulo") }))
    }
  }

  const empezarDeNuevo = React.useCallback(
    (leccion: Leccion) => {
      reiniciar(leccion)
      // Deshacer no es un logro: informa y no suena
      toast(t("avisos.reiniciada"))
    },
    [reiniciar, t]
  )

  return (
    <div className="@container/formacion space-y-6">
      {/* El título y la entradilla los pone la página (PageHeader): aquí solo
          el recuento, que sí depende de lo que este navegador lleva visto */}
      <header>
        <p className="text-xs text-muted-foreground tabular-nums">
          {t("resumen.clases", { n: clases.length })} ·{" "}
          {t("resumen.minutos", { min: minutosPublicados(catalogo) })} ·{" "}
          {t("resumen.vistas", { hechas: vistas, total: clases.length })}
        </p>
      </header>

      {ruta && !oculta && (
        <RutaPanel
          ruta={ruta}
          otra={otraRuta}
          catalogo={catalogo}
          plan={plan}
          progreso={progreso}
          leccionActiva={abiertaId}
          onAbrir={abrir}
          onOtra={() => setFijadaId(null)}
          onOcultar={() => {
            ocultarRuta(ruta.id, true)
            // Ni logro ni fallo: se informa y se ofrece deshacer en el sitio
            toast(t("avisos.rutaOculta"), {
              action: {
                label: t("avisos.rutaVuelve"),
                onClick: () => ocultarRuta(ruta.id, false),
              },
            })
          }}
        />
      )}

      {/* Apartada, queda una línea: esconderla del todo la haría irrecuperable */}
      {ruta && oculta && (
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
          {t("ruta.apartada", { titulo: textoRuta(ruta, "titulo") })}
          <button
            type="button"
            className="font-medium text-primary underline-offset-4 hover:underline"
            onClick={() => ocultarRuta(ruta.id, false)}
          >
            {t("ruta.volverAEnsenar")}
          </button>
        </p>
      )}

      {abierta && (
        <div ref={zonaLeccion} tabIndex={-1} className="scroll-mt-20 outline-none">
          <ReproductorLeccion
            leccion={abierta}
            progreso={progreso}
            siguiente={ruta ? siguienteLeccion(ruta, progreso, { catalogo, plan }) : null}
            bloqueada={!alAlcance(abierta, plan)}
            onVer={ver}
            onCompletar={marcar}
            onReiniciar={empezarDeNuevo}
            onAbrir={abrir}
            onCerrar={() => setAbiertaId(null)}
          />
        </div>
      )}

      <section aria-labelledby="catalogo-titulo" className="space-y-3">
        <div className="space-y-1">
          <h2 id="catalogo-titulo" className="text-lg font-bold">
            {t("catalogo.titulo")}
          </h2>
          <p className="text-xs text-muted-foreground">
            {conPerfil ? t("catalogo.orden") : t("catalogo.ordenSinPerfil")}
          </p>
        </div>

        <ul className="grid gap-4 @2xl/formacion:grid-cols-2 @5xl/formacion:grid-cols-3 @7xl/formacion:grid-cols-4">
          {orden.map((leccion) => (
            <li key={leccion.id} className="flex">
              <div className="flex w-full flex-col">
                <LeccionCard
                  leccion={leccion}
                  progreso={progreso}
                  razon={razonRecomendacion(leccion, perfil)}
                  bloqueada={!alAlcance(leccion, plan)}
                  activa={leccion.id === abiertaId}
                  onAbrir={() => abrir(leccion)}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
