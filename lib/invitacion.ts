import type { Cuenta } from "@/lib/onboarding"

/**
 * Modo exprés por invitación (§2.7): quien llega a una campaña privada con su
 * código y aún no ha terminado el onboarding pasa antes por dos tomas (redes y
 * país con idiomas) y vuelve a la campaña. Reglas puras; la navegación la
 * hace `access-code-dialog.tsx`, y `result-expres.tsx` lee de vuelta a qué
 * campaña devolverlo. El `?codigo=` de la URL lo lee nuqs en el diálogo.
 */

/** Pasa por el modo exprés: su onboarding no está completado. */
export const necesitaExpres = (c: Pick<Cuenta, "onboarding">) =>
  c.onboarding.estado !== "completado"

/** Ruta interna (en español) del detalle de una campaña, para `?next=`. */
export const rutaCampana = (id: string) => `/campanas/${id}`

/**
 * Consulta de `/bienvenida` en modo exprés hacia una campaña. `tipo=clipero`:
 * a una campaña se entra como clipero, aunque la cuenta pidiera agencia.
 */
export const consultaExpres = (id: string) => ({
  modo: "expres",
  tipo: "clipero",
  origen: "invitacion",
  next: rutaCampana(id),
})

/** Id de campaña de un `next` a su detalle (`/campanas/cmp_x`, en cualquier idioma). */
export const campanaDeNext = (next: string | null | undefined) =>
  next?.match(/^\/(?:campanas|campaigns|campanhas)\/([^/?#]+)/)?.[1] ?? null
