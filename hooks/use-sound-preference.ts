"use client"

import * as React from "react"

import { setSoundsEnabled, soundsEnabled, subscribeSounds } from "@/lib/sound"

/**
 * Preferencia de sonidos, sincronizada entre componentes y pestañas.
 * En el servidor se asume encendida; el cliente corrige al hidratar.
 */
export function useSoundPreference() {
  const enabled = React.useSyncExternalStore(subscribeSounds, soundsEnabled, () => true)
  return [enabled, setSoundsEnabled] as const
}
