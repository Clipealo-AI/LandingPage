import { ArrowRight, Volume2 } from "lucide-react"

import { Link } from "@/i18n/navigation"
import { hrefAccion, hrefEndpoint } from "@/lib/wiki/rutas"
import { accionPorId, endpointPorId } from "@/lib/wiki"
import { AREA_INFO } from "@/lib/wiki/areas"
import type { Accion } from "@/lib/wiki/tipos"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ICONO_AREA } from "@/components/wiki/iconos"
import {
  EstadoBadge,
  MetodoBadge,
  PlanBadge,
  RolBadge,
} from "@/components/wiki/insignias"
import {
  Apartado,
  Lista,
  Origenes,
  RutaApp,
  TablaErrores,
} from "@/components/wiki/partes"
import { Texto } from "@/components/wiki/texto"

/**
 * La ficha de una acción: qué consigue, quién la hace, dónde, cómo, qué
 * garantiza el producto, qué puede salir mal y qué endpoints hay detrás.
 *
 * El orden es el de alguien que llega sin saber nada: primero para qué sirve y
 * quién puede, luego cómo se hace, y al final lo que hay que tocar para
 * cambiarla (endpoints, datos y código).
 */
export function FichaAccion({ accion: a }: { accion: Accion }) {
  const Icono = ICONO_AREA[a.area]
  const endpoints = a.endpoints.map(endpointPorId).filter((e) => e != null)
  const relacionadas = (a.relacionadas ?? []).map(accionPorId).filter((x) => x != null)
  const porConstruir = endpoints.filter((e) => e.estado === "por-construir").length

  return (
    <article className="@container/ficha mx-auto w-full max-w-5xl space-y-10">
      <header className="space-y-4">
        <Link
          href={`/docs/acciones#${a.area}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <Icono className="size-4" aria-hidden />
          {AREA_INFO[a.area].titulo}
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-balance">{a.titulo}</h1>
        <p className="max-w-2xl text-lg text-pretty text-muted-foreground">
          <Texto>{a.resumen}</Texto>
        </p>

        <dl className="flex flex-wrap items-center gap-x-6 gap-y-3 border-y py-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <dt className="text-muted-foreground">Quién</dt>
            <dd className="flex flex-wrap gap-1.5">
              {a.quien.map((r) => (
                <RolBadge key={r} rol={r} />
              ))}
            </dd>
          </div>
          {a.plan && (
            <div className="flex flex-wrap items-center gap-2">
              <dt className="text-muted-foreground">Plan</dt>
              <dd>
                {a.plan.minimo ? (
                  <PlanBadge minimo={a.plan.minimo} />
                ) : (
                  <Badge variant="secondary">Según el plan</Badge>
                )}
              </dd>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <dt className="text-muted-foreground">Backend</dt>
            <dd>
              {endpoints.length === 0 ? (
                <Badge variant="secondary">Sin servidor</Badge>
              ) : porConstruir === 0 ? (
                <Badge variant="success">Conectado</Badge>
              ) : (
                <Badge variant="warning">
                  {porConstruir === endpoints.length
                    ? "Por construir"
                    : `${porConstruir} de ${endpoints.length} por construir`}
                </Badge>
              )}
            </dd>
          </div>
        </dl>
        {a.plan?.nota && (
          <p className="rounded-xl bg-brand-subtle px-4 py-3 text-sm text-pretty text-brand-subtle-foreground">
            <Texto>{a.plan.nota}</Texto>
          </p>
        )}
      </header>

      <div className="grid gap-10 @3xl/ficha:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="min-w-0 space-y-10">
          <Apartado id="donde" titulo="Dónde se hace">
            <ul className="space-y-2">
              {a.donde.map((d) => (
                <li key={d.ruta + d.etiqueta}>
                  <RutaApp ruta={d.ruta} etiqueta={d.etiqueta} />
                </li>
              ))}
            </ul>
          </Apartado>

          <Apartado id="pasos" titulo="Cómo se hace">
            {/* Numerada porque el orden importa: es una secuencia de verdad */}
            <ol className="space-y-3">
              {a.pasos.map((p, i) => (
                <li key={`${i}-${p}`} className="flex gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary tabular-nums">
                    {i + 1}
                  </span>
                  <span className="pt-0.5 text-pretty">
                    <Texto>{p}</Texto>
                  </span>
                </li>
              ))}
            </ol>
          </Apartado>

          <Apartado id="reglas" titulo="Qué garantiza el producto">
            <Lista items={a.reglas} />
          </Apartado>

          {a.estados && a.estados.length > 0 && (
            <Apartado id="estados" titulo="Estados">
              <dl className="divide-y rounded-xl ring-1 ring-border">
                {a.estados.map((e) => (
                  <div
                    key={e.estado}
                    className="grid gap-1 px-4 py-3 sm:grid-cols-[12rem_1fr]"
                  >
                    <dt>
                      <code className="font-mono text-xs">{e.estado}</code>
                    </dt>
                    <dd className="text-pretty text-muted-foreground">
                      <Texto>{e.significa}</Texto>
                    </dd>
                  </div>
                ))}
              </dl>
            </Apartado>
          )}

          {a.errores && a.errores.length > 0 && (
            <Apartado id="errores" titulo="Qué puede salir mal">
              <TablaErrores errores={a.errores} />
            </Apartado>
          )}

          <Apartado id="endpoints" titulo="Endpoints">
            {endpoints.length === 0 ? (
              <p className="text-sm text-muted-foreground">No necesita servidor.</p>
            ) : (
              <ul className="space-y-2">
                {endpoints.map((e) => (
                  <li key={e.id}>
                    <Link
                      href={hrefEndpoint(e.id)}
                      className="group flex flex-wrap items-center gap-3 rounded-xl p-3 ring-1 ring-border transition-colors hover:bg-muted/50"
                    >
                      <MetodoBadge metodo={e.metodo} />
                      <code className="min-w-0 flex-1 truncate font-mono text-sm">
                        {e.ruta}
                      </code>
                      <EstadoBadge estado={e.estado} />
                      <ArrowRight className="size-4 text-muted-foreground" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Apartado>
        </div>

        <aside className="space-y-6 text-sm @3xl/ficha:sticky @3xl/ficha:top-20 @3xl/ficha:self-start">
          <Card>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Dónde viven los datos
                </p>
                <p className="text-pretty">
                  <Texto>{a.datos}</Texto>
                </p>
              </div>
              {a.respuesta && (
                <div className="space-y-1">
                  <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Volume2 className="size-3.5" aria-hidden /> Respuesta
                  </p>
                  <p className="text-pretty">
                    <Texto>{a.respuesta}</Texto>
                  </p>
                </div>
              )}
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">Id</p>
                <code className="block font-mono text-xs break-all">{a.id}</code>
              </div>
            </CardContent>
          </Card>

          {relacionadas.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Relacionadas</p>
              <ul className="space-y-1.5">
                {relacionadas.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={hrefAccion(r.id)}
                      className="text-primary hover:underline"
                    >
                      {r.titulo}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">En el código</p>
            <Origenes origenes={a.origen} />
          </div>
        </aside>
      </div>
    </article>
  )
}
