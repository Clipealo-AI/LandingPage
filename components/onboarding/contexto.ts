"use client"

import * as React from "react"

import type { useCuenta } from "@/hooks/use-cuenta"
import type {
  CampoToma,
  Cuenta,
  ErrorToma,
  FlujoOnboarding,
  ModoOnboarding,
  PasoId,
  TextosToma,
} from "@/lib/onboarding"
import type { ItemRecomendable, ResultadoRecomendacion } from "@/lib/recomendacion"
import type { Envio, EstadoVisto, Liquidacion } from "@/lib/campanas"

/** De dónde llega a la bienvenida (evento `onboarding_iniciado`, `?origen=`). */
export const ORIGENES_ONBOARDING = [
  "registro",
  "oauth",
  "retomar",
  "gate",
  "invitacion",
] as const
export type OrigenOnboarding = (typeof ORIGENES_ONBOARDING)[number]

/** Destino al terminar o posponer: un `next` seguro o el de la rama. */
export type DestinoOnboarding =
  | string
  | { pathname: "/campanas" | "/subir" | "/dashboard"; query?: { orden: "para-ti" } }

/** Una campaña ya liquidada, lista para recomendar y para pintar con `CampaignCard`. */
export type ItemCampana = ItemRecomendable & {
  liquidacion: Liquidacion
  estado: EstadoVisto
  clips: number
}

type AccionesCuenta = ReturnType<typeof useCuenta>

/**
 * Lo que una toma sabe y puede hacer. Lo provee `OnboardingFlow`; cada toma lo
 * lee con `useFlujo()` y no recibe props.
 */
export interface FlujoContexto {
  /* Dónde está */
  paso: PasoId
  /** Pasos del flujo con las respuestas de ahora (el render al final). */
  pasos: readonly PasoId[]
  /** «Toma n»; `null` en el render. */
  numero: number | null
  total: number
  flujo: FlujoOnboarding
  modo: ModoOnboarding
  origen: OrigenOnboarding
  /** `?next=` ya validado (sin `/dashboard`), o `null`. */
  next: string | null
  /** A dónde lleva terminar: `next` seguro o el destino de la rama. */
  destino: DestinoOnboarding

  /* La cuenta y sus acciones (`hooks/use-cuenta.ts`) */
  cuenta: Cuenta
  responder: AccionesCuenta["responder"]
  consentir: AccionesCuenta["consentir"]

  /* Campañas, para las reacciones y el render */
  campanas: readonly ItemCampana[]
  envios: readonly Envio[]
  recomendacion: ResultadoRecomendacion<ItemCampana>
  /** Campañas que encajan ahora mismo: la línea viva «12 campañas encajan contigo». */
  encajan: number

  /* Texto que se escribe solo */
  /** La pregunta de esta toma ya está completa (vista antes, aprendida la prisa o acelerada). */
  completo: boolean
  /** La toma avisa de cuánto dura su escritura (ms desde que se monta). */
  registrarEscritura: (ms: number) => void
  /**
   * Completa la línea a mano (tecla, clic o toque sobre la toma, Esc): pone
   * `data-completo`. Si aún se escribía, cuenta para «aprende la prisa».
   */
  completarTexto: () => void
  /** «Saltar intro»: esta toma completa y el resto también. */
  saltarIntro: () => void

  /* Validación (§5.13) */
  /** Ha intentado continuar: desde ahora los errores se ven en vivo. */
  intento: boolean
  /** Errores de ahora, bloqueen o no. */
  errores: readonly ErrorToma[]
  /** Error que se enseña junto a un campo: solo tras el intento. */
  error: (campo: CampoToma) => ErrorToma | null
  /** Frase de un error (`onboarding.errors.<code>`). */
  textoError: (error: ErrorToma) => string
  /** Texto crudo de los campos de enlace, para validar lo que aún no se reconoce. */
  setTextos: (textos: TextosToma) => void

  /* Región viva única del layout (600 ms tras el último cambio; `espera` lo cambia) */
  anunciar: (texto: string, opciones?: { espera?: number }) => void

  /* Navegación (silenciosa, §5.12) */
  /** Enter o «Continuar»: completa el texto, valida y avanza. */
  continuar: () => void
  atras: () => void
  /** «Saltar esta toma» (solo tomas opcionales). */
  saltar: () => void
  /** «Hacerlo luego». */
  posponer: () => void
  /** «Editar» desde el timeline o el resumen: lleva a una toma ya permitida. */
  editar: (paso: PasoId) => void
  /** ¿Se puede abrir esa toma ahora? */
  puedeEditar: (paso: PasoId) => boolean
  /**
   * Fin del render: `completar()` y, si toca y es la primera vez, `toast.celebrate`.
   * Devuelve `true` si ha celebrado. Idempotente.
   */
  terminar: (opciones?: { celebrar?: boolean }) => boolean
  /** Sale al destino (o a otro). */
  salir: (destino?: DestinoOnboarding) => void
}

export const FlujoContext = React.createContext<FlujoContexto | null>(null)

/** Estado y acciones de la toma en curso. Solo dentro de `OnboardingFlow`. */
export function useFlujo(): FlujoContexto {
  const ctx = React.useContext(FlujoContext)
  if (!ctx) throw new Error("useFlujo: fuera de <OnboardingFlow>")
  return ctx
}

/**
 * Evento de ventana que emite el flujo al responder, saltar o volver (antes de
 * cambiar de toma): el Montaje lo usa para el clip que viaja al timeline y el
 * rótulo del monitor, sin tocar el flujo.
 */
export const EVENTO_TOMA = "clipealo:toma"
export interface DetalleEventoToma {
  tipo: "respondida" | "saltada" | "atras" | "editar"
  paso: PasoId
  siguiente: PasoId | null
}
