import { cn } from "@/lib/utils"
import { AUTH_INFO, PLAN_INFO, ROL_INFO } from "@/lib/wiki/areas"
import type { Endpoint, PlanBase, Rol } from "@/lib/wiki/tipos"
import { Badge } from "@/components/ui/badge"

/**
 * Las insignias de la wiki. Todas llevan el estado ESCRITO: el color ayuda a
 * encontrarlo de un vistazo, pero nunca es lo único que lo dice.
 */

const METODO: Record<
  Endpoint["metodo"],
  { variant: "outline" | "success" | "warning" | "destructive"; clase?: string }
> = {
  // GET no cambia nada: azul de estructura, sin relleno
  GET: { variant: "outline", clase: "border-primary/30 text-primary" },
  POST: { variant: "success" },
  PUT: { variant: "warning" },
  PATCH: { variant: "warning" },
  DELETE: { variant: "destructive" },
}

export function MetodoBadge({
  metodo,
  className,
}: {
  metodo: Endpoint["metodo"]
  className?: string
}) {
  const m = METODO[metodo]
  return (
    <Badge
      variant={m.variant}
      className={cn(
        "w-16 justify-center font-mono text-[11px] tracking-wide",
        m.clase,
        className
      )}
    >
      {metodo}
    </Badge>
  )
}

export function EstadoBadge({ estado }: { estado: Endpoint["estado"] }) {
  return estado === "conectado" ? (
    <Badge
      variant="success"
      title="El front ya lo llama cuando existe NEXT_PUBLIC_API_URL"
    >
      Conectado
    </Badge>
  ) : (
    <Badge
      variant="warning"
      title="Hoy vive en el navegador; el servidor tendrá que darlo"
    >
      Por construir
    </Badge>
  )
}

export function AuthBadge({ auth }: { auth: Endpoint["auth"] }) {
  return (
    <Badge variant="secondary" title={AUTH_INFO[auth].descripcion}>
      {AUTH_INFO[auth].titulo}
    </Badge>
  )
}

export function RolBadge({ rol }: { rol: Rol }) {
  return <Badge variant="secondary">{ROL_INFO[rol]}</Badge>
}

export function PlanBadge({ minimo }: { minimo: PlanBase }) {
  return <Badge variant="brand-subtle">Desde {PLAN_INFO[minimo]}</Badge>
}
