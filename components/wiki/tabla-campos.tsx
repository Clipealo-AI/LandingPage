import type { Campo } from "@/lib/wiki/tipos"
import { Texto } from "@/components/wiki/texto"

/**
 * Los campos de un parámetro, un cuerpo o una respuesta. Si es obligatorio se
 * dice con la palabra: el asterisco solo no basta.
 */
export function TablaCampos({ campos }: { campos: Campo[] }) {
  return (
    <div className="overflow-x-auto rounded-xl ring-1 ring-border">
      <table className="w-full min-w-[36rem] text-sm">
        <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Campo</th>
            <th className="px-3 py-2 font-medium">Tipo</th>
            <th className="px-3 py-2 font-medium whitespace-nowrap">¿Hace falta?</th>
            <th className="px-3 py-2 font-medium">Qué es</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {campos.map((c) => (
            <tr key={`${c.en ?? ""}${c.nombre}`} className="align-top">
              <td className="px-3 py-2.5 font-mono text-xs">
                {c.nombre}
                {c.en && <span className="ml-1.5 text-muted-foreground">({c.en})</span>}
              </td>
              <td className="max-w-56 px-3 py-2.5 font-mono text-xs break-words text-primary">
                {c.tipo}
              </td>
              <td className="px-3 py-2.5 text-xs">
                {c.requerido ? "Obligatorio" : "Opcional"}
              </td>
              <td className="px-3 py-2.5 text-pretty text-muted-foreground">
                <Texto>{c.descripcion}</Texto>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
