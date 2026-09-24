import { AREAS, type Accion, type Area, type Endpoint } from "@/lib/wiki/tipos"
import { ACCIONES as a_acceso } from "@/lib/wiki/acciones/acceso"
import { ACCIONES as a_onboarding } from "@/lib/wiki/acciones/onboarding"
import { ACCIONES as a_proyectos } from "@/lib/wiki/acciones/proyectos"
import { ACCIONES as a_operaciones } from "@/lib/wiki/acciones/operaciones"
import { ACCIONES as a_publicar } from "@/lib/wiki/acciones/publicar"
import { ACCIONES as a_calendario } from "@/lib/wiki/acciones/calendario"
import { ACCIONES as a_analiticas } from "@/lib/wiki/acciones/analiticas"
import { ACCIONES as a_campanas } from "@/lib/wiki/acciones/campanas"
import { ACCIONES as a_agencias } from "@/lib/wiki/acciones/agencias"
import { ACCIONES as a_wallet } from "@/lib/wiki/acciones/wallet"
import { ACCIONES as a_planes } from "@/lib/wiki/acciones/planes"
import { ACCIONES as a_formacion } from "@/lib/wiki/acciones/formacion"
import { ACCIONES as a_cuenta } from "@/lib/wiki/acciones/cuenta"
import { ACCIONES as a_ayuda } from "@/lib/wiki/acciones/ayuda"
import { ACCIONES as a_backoffice } from "@/lib/wiki/acciones/backoffice"
import { ENDPOINTS as e_acceso } from "@/lib/wiki/api/acceso"
import { ENDPOINTS as e_onboarding } from "@/lib/wiki/api/onboarding"
import { ENDPOINTS as e_proyectos } from "@/lib/wiki/api/proyectos"
import { ENDPOINTS as e_operaciones } from "@/lib/wiki/api/operaciones"
import { ENDPOINTS as e_publicar } from "@/lib/wiki/api/publicar"
import { ENDPOINTS as e_calendario } from "@/lib/wiki/api/calendario"
import { ENDPOINTS as e_analiticas } from "@/lib/wiki/api/analiticas"
import { ENDPOINTS as e_campanas } from "@/lib/wiki/api/campanas"
import { ENDPOINTS as e_agencias } from "@/lib/wiki/api/agencias"
import { ENDPOINTS as e_wallet } from "@/lib/wiki/api/wallet"
import { ENDPOINTS as e_planes } from "@/lib/wiki/api/planes"
import { ENDPOINTS as e_formacion } from "@/lib/wiki/api/formacion"
import { ENDPOINTS as e_cuenta } from "@/lib/wiki/api/cuenta"
import { ENDPOINTS as e_ayuda } from "@/lib/wiki/api/ayuda"
import { ENDPOINTS as e_backoffice } from "@/lib/wiki/api/backoffice"

/**
 * El catálogo entero de la wiki, en el orden de `AREAS`.
 *
 * Cada área vive en su archivo (`acciones/<area>.ts` y `api/<area>.ts`) para
 * que se pueda mantener por separado; aquí solo se juntan.
 */
export const ACCIONES: readonly Accion[] = [
  ...a_acceso,
  ...a_onboarding,
  ...a_proyectos,
  ...a_operaciones,
  ...a_publicar,
  ...a_calendario,
  ...a_analiticas,
  ...a_campanas,
  ...a_agencias,
  ...a_wallet,
  ...a_planes,
  ...a_formacion,
  ...a_cuenta,
  ...a_ayuda,
  ...a_backoffice,
]
export const ENDPOINTS: readonly Endpoint[] = [
  ...e_acceso,
  ...e_onboarding,
  ...e_proyectos,
  ...e_operaciones,
  ...e_publicar,
  ...e_calendario,
  ...e_analiticas,
  ...e_campanas,
  ...e_agencias,
  ...e_wallet,
  ...e_planes,
  ...e_formacion,
  ...e_cuenta,
  ...e_ayuda,
  ...e_backoffice,
]

export const accionPorId = (id: string) => ACCIONES.find((a) => a.id === id)
export const endpointPorId = (id: string) => ENDPOINTS.find((e) => e.id === id)

export const accionesDe = (area: Area) => ACCIONES.filter((a) => a.area === area)
export const endpointsDe = (area: Area) => ENDPOINTS.filter((e) => e.area === area)

/** Las acciones que usan un endpoint: la otra mitad del enlace cruzado. */
export const accionesQueUsan = (endpoint: string) =>
  ACCIONES.filter((a) => a.endpoints.includes(endpoint))

export { AREAS }
