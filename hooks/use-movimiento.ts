"use client"

import * as React from "react"

import {
  aplicarMovimiento,
  CLAVE_MOVIMIENTO,
  EVENTO_MOVIMIENTO,
  guardarMovimiento,
  leerMovimiento,
  MOVIMIENTO_POR_DEFECTO,
  type Movimiento,
} from "@/lib/preferencia-movimiento"

const suscribir = (avisar: () => void) => {
  window.addEventListener(EVENTO_MOVIMIENTO, avisar)
  const otraPestana = (e: StorageEvent) => {
    if (e.key !== CLAVE_MOVIMIENTO && e.key !== null) return
    // El atributo también: de él cuelgan el CSS y `prefiereMenosMovimiento()`,
    // y sin esto la otra pestaña cambiaba el radio de Ajustes y seguía
    // moviéndose igual
    aplicarMovimiento(leerMovimiento())
    avisar()
  }
  window.addEventListener("storage", otraPestana)
  return () => {
    window.removeEventListener(EVENTO_MOVIMIENTO, avisar)
    window.removeEventListener("storage", otraPestana)
  }
}

/**
 * Preferencia de movimiento del usuario: completo (el de por defecto) o
 * reducido. Se aplica al momento, sin recargar, porque el CSS cuelga de
 * `data-motion` en `<html>`, y se recuerda en este navegador.
 *
 * En el servidor y durante la hidratación devuelve el valor por defecto: el
 * script de arranque ya puso el atributo, así que no hay parpadeo.
 */
export function useMovimiento(): [Movimiento, (valor: Movimiento) => void] {
  const valor = React.useSyncExternalStore(
    suscribir,
    leerMovimiento,
    () => MOVIMIENTO_POR_DEFECTO
  )
  return [valor, guardarMovimiento]
}
