"use client"

import * as React from "react"
import { flushSync } from "react-dom"
import { useTranslations } from "next-intl"
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs"

import { useRouter } from "@/i18n/navigation"
import { TIPOS_CUENTA, destinoSeguro } from "@/lib/auth"
import {
  MODOS_ONBOARDING,
  PASOS,
  destinoDeRama,
  esPasoOpcional,
  esRender,
  numeroToma,
  pasoAnterior,
  pasoPermitido,
  pasosDe,
  siguientePaso,
  totalTomas,
  validarToma,
  type Cuenta,
  type ErrorToma,
  type PasoId,
  type TextosToma,
} from "@/lib/onboarding"
import { itemsRecomendables, recomendarCampanas } from "@/lib/recomendacion"
import { toast } from "@/lib/toast"
import { redesDe } from "@/lib/planes"
import { useCampanas } from "@/hooks/use-campanas"
import { usePlan } from "@/hooks/use-plan"
import {
  almacenamientoDisponible,
  leerCuenta,
  useCuenta,
  useCuentaLista,
} from "@/hooks/use-cuenta"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/brand/logo"
import { LocaleSwitcher } from "@/components/shared/locale-switcher"
import {
  EVENTO_TOMA,
  FlujoContext,
  ORIGENES_ONBOARDING,
  type DestinoOnboarding,
  type DetalleEventoToma,
  type FlujoContexto,
  type ItemCampana,
  type OrigenOnboarding,
} from "@/components/onboarding/contexto"
import { BarraBienvenida, MarcoBienvenida } from "@/components/onboarding/marco"
import { Monitor } from "@/components/onboarding/monitor"
import { TarjetaMini } from "@/components/onboarding/profile-card"
import { useAnunciar } from "@/components/onboarding/region-viva"
import { TimelineTomas } from "@/components/onboarding/timeline-tomas"
import { EscenaToma } from "@/components/onboarding/toma"
import { TomaSkeleton } from "@/components/onboarding/toma-skeleton"
import { RENDERS, TOMAS, esPasoToma } from "@/components/onboarding/tomas/registro"
import { ramaDe } from "@/lib/onboarding"

const MODIFICADORAS = new Set([
  "Shift",
  "Control",
  "Alt",
  "AltGraph",
  "Meta",
  "CapsLock",
  "Tab",
  "Dead",
  "Unidentified",
])

/** Solo una vez por sesión de página: el aviso de que no se puede guardar. */
let avisoGuardadoMostrado = false

/** Cuántas opciones eligió en una toma (evento `paso_respondido.n_opciones`). */
export function opcionesElegidas(paso: PasoId, c: Cuenta): number {
  const n = (v: unknown) => (Array.isArray(v) ? v.length : v ? 1 : 0)
  switch (paso) {
    case "cuenta":
      return n(c.tipo)
    case "objetivo":
      return n(c.clipero.objetivo)
    case "nichos":
      return n(c.clipero.verticales) + n(c.clipero.juegos)
    case "fandom":
      return n(c.clipero.creadoresFan)
    case "redes":
      return n(c.clipero.redes)
    case "basicos":
      return n(c.pais) + n(c.idiomas)
    case "directo":
      return (
        n(c.creador.plataformasDirecto) + n(c.creador.frecuencia) + n(c.creador.duracion)
      )
    case "canal":
      return n(c.creador.verticalesCanal)
    case "tipo-org":
      return n(c.agencia.tipoOrganizacion)
    case "org":
      return n(c.agencia.organizacion) + n(c.agencia.web) + n(c.agencia.pais)
    case "promocion":
      return n(c.agencia.sector) + n(c.agencia.verticalesMaterial)
    case "alcance":
      return (
        n(c.agencia.redesObjetivo) +
        n(c.agencia.paisesObjetivo) +
        n(c.agencia.idiomasObjetivo)
      )
    default:
      return 0
  }
}

/**
 * Paso con el que se abre la bienvenida (§8.3): `?paso=` si se puede abrir; si
 * no, el `pasoActual` guardado (salvo con el onboarding completado); si no, el
 * primero del flujo.
 */
export function pasoInicial(
  pasos: readonly PasoId[],
  cuenta: Cuenta,
  pasoUrl: PasoId | null
): PasoId {
  if (pasoUrl && pasoPermitido(pasoUrl, pasos, cuenta)) return pasoUrl
  const o = cuenta.onboarding
  if (
    o.estado !== "completado" &&
    o.pasoActual &&
    pasoPermitido(o.pasoActual, pasos, cuenta)
  )
    return o.pasoActual
  return pasos[0]
}

/** `?next=` seguro para terminar: nunca `/login`, la bienvenida ni `/dashboard` (manda la rama). */
export function nextSeguro(next: string | null | undefined): string | null {
  const ruta = next ? destinoSeguro(next, "") : ""
  return ruta && ruta !== "/dashboard" ? ruta : null
}

const esPaso = (v: string | null): v is PasoId =>
  !!v && (PASOS as readonly string[]).includes(v)

/**
 * «Tu primer corte» (`/bienvenida`): el flujo de tomas. Pinta el esqueleto
 * hasta que la cuenta del navegador está lista y solo entonces decide el paso.
 */
export function OnboardingFlow() {
  const lista = useCuentaLista()
  if (!lista) return <TomaSkeleton />
  return <FlujoListo />
}

function FlujoListo() {
  const t = useTranslations("onboarding")
  const router = useRouter()
  const anunciar = useAnunciar()
  const cuentaHook = useCuenta()
  const { cuenta } = cuentaHook
  const { plan } = usePlan()
  const {
    iniciar,
    verPaso,
    responder,
    responderPaso,
    saltarPaso,
    sumarTiempo,
    acelerarTexto,
    marcarAnimacionVista,
    completar,
    celebrar,
  } = cuentaHook
  const { campanas, envios, desbloqueadas } = useCampanas()

  const [pasoUrl, setPasoUrl] = useQueryState(
    "paso",
    parseAsStringLiteral(PASOS).withOptions({ history: "push", scroll: false })
  )
  const [tipoUrl] = useQueryState("tipo", parseAsStringLiteral(TIPOS_CUENTA))
  const [nextUrl] = useQueryState("next", parseAsString)
  const [modoUrl] = useQueryState("modo", parseAsStringLiteral(MODOS_ONBOARDING))
  const [origenUrl] = useQueryState("origen", parseAsStringLiteral(ORIGENES_ONBOARDING))

  const flujo = tipoUrl ?? cuenta.tipo ?? cuenta.onboarding.flujo ?? "clipero"
  const modo = modoUrl ?? "normal"
  const next = nextSeguro(nextUrl)
  const pasos = React.useMemo(
    () => pasosDe(flujo, cuenta.clipero.objetivo, modo, cuenta),
    [flujo, modo, cuenta]
  )

  // El paso vive en estado local (el teclado de iOS solo se abre si el foco va
  // en el mismo gesto); la URL (`?paso=`, con historial) va detrás
  const [estado, setEstado] = React.useState(() => {
    const paso = pasoInicial(pasos, cuenta, pasoUrl)
    const o = cuenta.onboarding
    return { paso, completo: o.animacionVista || o.pasosVistos.includes(paso) }
  })
  const [entrada] = React.useState(estado.paso)
  const [origen] = React.useState<OrigenOnboarding>(
    () =>
      origenUrl ??
      (cuenta.onboarding.estado === "pospuesto"
        ? "retomar"
        : modo === "expres"
          ? "invitacion"
          : "registro")
  )
  const [intento, setIntento] = React.useState(false)

  const paso = pasos.includes(estado.paso) ? estado.paso : pasos[0]
  const numero = numeroToma(pasos, paso)
  const total = totalTomas(pasos)
  const destino: DestinoOnboarding = next ?? destinoDeRama(flujo, cuenta.clipero.objetivo)

  /* Campañas y recomendación: la línea viva, las reacciones y el render */
  /**
   * Solo las campañas que el plan puede atender, la misma regla que /campanas:
   * proponerle a un Prueba una campaña que solo paga por Instagram es hacerle
   * perder el rato hasta el último paso.
   */
  const redesPlan = redesDe(plan)
  const items = React.useMemo<ItemCampana[]>(
    () =>
      itemsRecomendables(campanas, envios)
        .filter((x) => x.campana.redes.some((r) => redesPlan.includes(r)))
        .map((x) => ({
          ...x,
          clips: envios.filter(
            (e) => e.campanaId === x.campana.id && e.estado !== "rechazado"
          ).length,
        })),
    [campanas, envios, redesPlan]
  )
  const recomendacion = React.useMemo(
    () => recomendarCampanas(items, cuenta, { desbloqueadas }),
    [items, cuenta, desbloqueadas]
  )

  /* Validación en vivo tras el primer intento; `textos`: lo escrito en los enlaces */
  const [textos, setTextosEstado] = React.useState<TextosToma>({})
  const errores = React.useMemo<ErrorToma[]>(
    () => validarToma(paso, cuenta, textos),
    [paso, cuenta, textos]
  )

  /* Tiempo en la toma, solo con la pestaña visible */
  const tiempo = React.useRef({ acumulado: 0, desde: 0 })
  const tomarTiempo = React.useCallback(() => {
    const r = tiempo.current
    const visible = document.visibilityState === "visible"
    const ms = r.acumulado + (visible && r.desde ? performance.now() - r.desde : 0)
    tiempo.current = { acumulado: 0, desde: visible ? performance.now() : 0 }
    return ms
  }, [])

  /* Escritura: cuándo se montó la toma y cuánto dura su texto */
  const escritura = React.useRef({ montada: 0, fin: 0 })
  const registrarEscritura = React.useCallback((ms: number) => {
    escritura.current = { montada: performance.now(), fin: ms }
  }, [])
  /* «Aprende la prisa»: dos tomas seguidas completadas a mano */
  const prisa = React.useRef({ acelerada: false, seguidas: 0 })

  const escribiendo = () =>
    !estado.completo &&
    performance.now() - escritura.current.montada < escritura.current.fin

  const completarTexto = () => {
    if (!escribiendo()) return
    setEstado((e) => ({ ...e, completo: true }))
    prisa.current.acelerada = true
    prisa.current.seguidas += 1
    acelerarTexto()
    if (prisa.current.seguidas >= 2) marcarAnimacionVista()
  }

  const saltarIntro = () => {
    marcarAnimacionVista()
    setEstado((e) => ({ ...e, completo: true }))
  }

  /* Foco al cambiar de toma: al campo de texto si lo hay, si no al título */
  const enfocarToma = () => {
    const raiz = document.getElementById("bienvenida")
    const campo = raiz?.querySelector<HTMLElement>("[data-toma-foco]")
    ;(campo ?? document.getElementById("toma-titulo"))?.focus()
  }

  const enfocarError = (campo: string) => {
    const grupo = document.querySelector<HTMLElement>(
      `[data-toma] [data-campo="${campo}"]`
    )
    const control = grupo?.querySelector<HTMLElement>(
      'input:not([type="hidden"]), textarea, [role="combobox"], [tabindex="0"], button:not([disabled])'
    )
    ;(control ?? document.getElementById("toma-titulo"))?.focus()
  }

  const irA = (siguiente: PasoId, tipo: DetalleEventoToma["tipo"]) => {
    window.dispatchEvent(
      new CustomEvent<DetalleEventoToma>(EVENTO_TOMA, {
        detail: { tipo, paso, siguiente },
      })
    )
    // Una toma que se escribió entera sin acelerar corta la racha de prisa
    if (!prisa.current.acelerada && !estado.completo) prisa.current.seguidas = 0
    prisa.current.acelerada = false
    // La toma nueva registra su escritura al montarse (el render no escribe)
    escritura.current = { montada: 0, fin: 0 }
    const o = leerCuenta().onboarding
    flushSync(() => {
      setEstado({
        paso: siguiente,
        completo: o.animacionVista || o.pasosVistos.includes(siguiente),
      })
      setIntento(false)
      setTextosEstado({})
    })
    enfocarToma()
    void setPasoUrl(siguiente)
  }

  const salir = (a: DestinoOnboarding = destino) => {
    if (typeof a === "string") router.push(a)
    else router.push(a)
  }

  const continuar = () => {
    if (escribiendo()) {
      completarTexto()
      return
    }
    const c = leerCuenta()
    const actuales = validarToma(paso, c, textos)
    const bloqueante = actuales.find((e) => e.bloquea)
    if (bloqueante) {
      flushSync(() => setIntento(true))
      enfocarError(bloqueante.campo)
      return
    }
    sumarTiempo(paso, tomarTiempo())
    // Un país precargado del navegador pasa a declarado al confirmarlo
    if (paso === "basicos" && c.pais && c.meta.pais?.fuente === "inferido")
      responder("pais", c.pais)
    if (paso === "basicos" && c.idiomas.length && c.meta.idiomas?.fuente === "inferido")
      responder("idiomas", c.idiomas)
    responderPaso(paso, {
      opciones: opcionesElegidas(paso, c),
      acelerado: prisa.current.acelerada,
    })
    const despues = leerCuenta()
    const siguiente = siguientePaso(
      pasosDe(flujo, despues.clipero.objetivo, modo, despues),
      paso
    )
    if (siguiente) irA(siguiente, "respondida")
    else salir()
  }

  const atras = () => {
    const anterior = pasoAnterior(pasos, paso)
    if (!anterior) return
    sumarTiempo(paso, tomarTiempo())
    irA(anterior, "atras")
  }

  const saltar = () => {
    if (!esPasoOpcional(paso)) return
    sumarTiempo(paso, tomarTiempo())
    saltarPaso(paso)
    const siguiente = siguientePaso(pasos, paso)
    if (siguiente) irA(siguiente, "saltada")
  }

  const posponer = () => {
    sumarTiempo(paso, tomarTiempo())
    cuentaHook.posponer(paso)
    toast(t("chrome.postponed"))
    const c = leerCuenta()
    salir(next ?? destinoDeRama(flujo, c.clipero.objetivo))
  }

  const puedeEditar = (p: PasoId) =>
    pasos.includes(p) && !esRender(p) && pasoPermitido(p, pasos, cuenta)

  const editar = (p: PasoId) => {
    if (p === paso || !puedeEditar(p)) return
    sumarTiempo(paso, tomarTiempo())
    irA(p, "editar")
  }

  const terminar = ({ celebrar: conCelebracion = true }: { celebrar?: boolean } = {}) => {
    completar()
    if (!conCelebracion || !celebrar()) return false
    toast.celebrate(t("resultado.celebrate.title"), {
      description: t("resultado.celebrate.description", { count: recomendacion.encajan }),
    })
    return true
  }

  const setTextos = React.useCallback(
    (nuevos: TextosToma) => setTextosEstado((previos) => ({ ...previos, ...nuevos })),
    []
  )

  const textoError = (e: ErrorToma) => {
    switch (e.code) {
      case "orgCorto":
      case "orgLargo":
        return t(`errors.${e.code}`, e.values)
      case "limiteElegidos":
      case "maxIdiomas":
        return t(`errors.${e.code}`, e.values)
      default:
        return t(`errors.${e.code}`)
    }
  }

  /* Efectos */

  React.useEffect(() => {
    iniciar({ flujo, modo, origen })
  }, [iniciar, flujo, modo, origen])

  React.useEffect(() => {
    verPaso(paso)
    tiempo.current = {
      acumulado: 0,
      desde: document.visibilityState === "visible" ? performance.now() : 0,
    }
  }, [verPaso, paso])

  React.useEffect(() => {
    const nombre = t(`chrome.pasos.${paso}`)
    document.title = numero
      ? t("chrome.documentTitle", { n: numero, total, paso: nombre })
      : t("chrome.documentTitleFinal", { paso: nombre })
  }, [t, paso, numero, total])

  React.useEffect(() => {
    if (avisoGuardadoMostrado || almacenamientoDisponible()) return
    avisoGuardadoMostrado = true
    toast.error(t("errors.guardadoFallido.title"), {
      description: t("errors.guardadoFallido.description"),
    })
  }, [t])

  React.useEffect(() => {
    const alCambiarVisibilidad = () => {
      const r = tiempo.current
      if (document.visibilityState === "hidden") {
        if (r.desde)
          tiempo.current = {
            acumulado: r.acumulado + performance.now() - r.desde,
            desde: 0,
          }
      } else tiempo.current = { ...r, desde: performance.now() }
    }
    document.addEventListener("visibilitychange", alCambiarVisibilidad)
    return () => document.removeEventListener("visibilitychange", alCambiarVisibilidad)
  }, [])

  // Teclado (§5.8): Enter continúa, 1-9 elige, Esc y cualquier tecla completan el texto
  const alTeclado = React.useEffectEvent((e: KeyboardEvent) => {
    const raiz = document.getElementById("bienvenida")
    const objetivo = e.target
    if (!raiz || !(objetivo instanceof HTMLElement)) return
    if (objetivo !== document.body && !raiz.contains(objetivo)) return
    if (e.isComposing || e.metaKey || e.ctrlKey || e.altKey || MODIFICADORAS.has(e.key))
      return
    if (esRender(paso)) return

    if (e.key === "Enter") {
      if (objetivo.closest("[data-toma-enter='propio']")) return
      if (objetivo instanceof HTMLTextAreaElement && e.shiftKey) return
      const control = objetivo.closest(
        "button, a, [role='button'], [role='combobox'], [role='switch'], [role='link']"
      )
      if (control && !control.matches("[data-chip], [role='radio'], [role='checkbox']"))
        return
      e.preventDefault()
      continuar()
      return
    }

    completarTexto()
    if (e.key === "Escape") return
    // `[role='combobox']` también: un desplegable de Radix es un botón, no un
    // `select`, así que escribir «3» para buscar «Uruguay» elegía la opción 3
    // de la toma a la vez que el país
    const enTexto = objetivo.closest(
      "input, textarea, select, [role='combobox'], [contenteditable='true']"
    )
    if (enTexto || !/^[1-9]$/.test(e.key)) return
    const grupo = raiz.querySelector("[data-toma] [data-atajos]")
    const opcion =
      grupo?.querySelectorAll<HTMLElement>("[data-opcion]")[Number(e.key) - 1]
    if (!opcion || opcion.matches(":disabled")) return
    e.preventDefault()
    opcion.focus()
    opcion.click()
  })

  // Atrás y adelante del navegador: la URL manda sobre el estado local
  const alVolver = React.useEffectEvent(() => {
    const valor = new URLSearchParams(window.location.search).get("paso")
    const destinoPaso = esPaso(valor) ? valor : entrada
    const c = leerCuenta()
    const actuales = pasosDe(flujo, c.clipero.objetivo, modo, c)
    if (destinoPaso === paso || !pasoPermitido(destinoPaso, actuales, c)) return
    sumarTiempo(paso, tomarTiempo())
    escritura.current = { montada: 0, fin: 0 }
    // Lo ya escrito aparece al instante
    flushSync(() => {
      setEstado({ paso: destinoPaso, completo: true })
      setIntento(false)
      setTextosEstado({})
    })
    enfocarToma()
  })

  React.useEffect(() => {
    const tecla = (e: KeyboardEvent) => alTeclado(e)
    const volver = () => alVolver()
    document.addEventListener("keydown", tecla, true)
    window.addEventListener("popstate", volver)
    return () => {
      document.removeEventListener("keydown", tecla, true)
      window.removeEventListener("popstate", volver)
    }
  }, [])

  const ctx: FlujoContexto = {
    paso,
    pasos,
    numero,
    total,
    flujo,
    modo,
    origen,
    next,
    destino,
    cuenta,
    responder,
    consentir: cuentaHook.consentir,
    campanas: items,
    envios,
    recomendacion,
    encajan: recomendacion.encajan,
    completo: estado.completo,
    registrarEscritura,
    completarTexto,
    saltarIntro,
    intento,
    errores,
    error: (campo) =>
      intento ? (errores.find((e) => e.bloquea && e.campo === campo) ?? null) : null,
    textoError,
    setTextos,
    anunciar,
    continuar,
    atras,
    saltar,
    posponer,
    editar,
    puedeEditar,
    terminar,
    salir,
  }

  const rama = ramaDe({ tipo: flujo, clipero: cuenta.clipero })
  const render = esRender(paso)
  const Contenido = esPasoToma(paso) ? TOMAS[paso] : RENDERS[paso as keyof typeof RENDERS]

  return (
    <FlujoContext.Provider value={ctx}>
      <MarcoBienvenida
        ancho={render}
        data-paso={paso}
        barra={
          <BarraBienvenida
            marca={<Logo iconOnly className="size-7" />}
            centro={
              numero ? (
                <p className="flex min-w-0 items-center gap-3 text-sm">
                  <span className="truncate font-semibold">
                    {t("chrome.take", { n: numero, total })}
                  </span>
                  <span
                    data-slot="timecode"
                    aria-hidden
                    className="tabular hidden text-muted-foreground @md/bienvenida:inline"
                  >
                    {`00:00:${String(numero).padStart(2, "0")}:00`}
                  </span>
                </p>
              ) : null
            }
            acciones={
              <>
                <LocaleSwitcher />
                {!render && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-9 px-3"
                    onClick={posponer}
                  >
                    {t("chrome.actions.later")}
                  </Button>
                )}
              </>
            }
          />
        }
        mini={
          <TarjetaMini
            cuenta={cuenta}
            rama={rama}
            encajan={recomendacion.encajan}
            feed={recomendacion.recomendadas.map((r) => r.item.campana)}
            className="@5xl/bienvenida:hidden"
          />
        }
        monitor={<Monitor />}
      >
        {!render && (
          <TimelineTomas
            className="mb-8 @5xl/bienvenida:mb-12"
            pasos={pasos}
            actual={paso}
            respondidos={cuenta.onboarding.pasosRespondidos}
            saltados={cuenta.onboarding.pasosSaltados}
            puedeEditar={puedeEditar}
            onEditar={editar}
          />
        )}
        <EscenaToma>
          <Contenido key={paso} />
        </EscenaToma>
      </MarcoBienvenida>
    </FlujoContext.Provider>
  )
}
