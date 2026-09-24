/**
 * Texto de la wiki con código en línea.
 *
 * El contenido se escribe como se escribe en un commit: los nombres de código
 * entre comillas invertidas (`iniciarSesion`, `lib/auth.ts:112`). Aquí se
 * pintan como código en vez de enseñar las comillas.
 */
export function Texto({ children }: { children: string }) {
  const partes = children.split(/(`[^`]+`)/g)
  return (
    <>
      {partes.map((p, i) =>
        p.startsWith("`") && p.endsWith("`") && p.length > 2 ? (
          <code key={i} className="rounded bg-muted px-1 py-px font-mono text-[0.85em]">
            {p.slice(1, -1)}
          </code>
        ) : (
          p
        )
      )}
    </>
  )
}
