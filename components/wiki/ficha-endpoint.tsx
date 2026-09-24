import { Link } from "@/i18n/navigation"
import { hrefAccion } from "@/lib/wiki/rutas"
import { accionesQueUsan } from "@/lib/wiki"
import { AREA_INFO } from "@/lib/wiki/areas"
import type { Endpoint, Esquema } from "@/lib/wiki/tipos"
import { Card, CardContent } from "@/components/ui/card"
import { BloqueCodigo } from "@/components/wiki/bloque-codigo"
import { ICONO_AREA } from "@/components/wiki/iconos"
import { AuthBadge, EstadoBadge, MetodoBadge } from "@/components/wiki/insignias"
import { Apartado, Lista, Origenes, TablaErrores } from "@/components/wiki/partes"
import { TablaCampos } from "@/components/wiki/tabla-campos"
import { Texto } from "@/components/wiki/texto"

/**
 * El `curl` de ejemplo, con la base en una variable y los parámetros de ruta
 * rellenos con los del ejemplo. La cabecera de sesión va solo donde hace falta,
 * y avisa de que la sesión aún no existe en el servidor.
 */
function curlDe(e: Endpoint): string {
  const ejemploRuta =
    e.parametros
      ?.filter((p) => p.en === "ruta")
      .reduce((ruta, p) => ruta.replace(`{${p.nombre}}`, `<${p.nombre}>`), e.ruta) ??
    e.ruta
  const lineas = [
    `curl -X ${e.metodo} "$CLIPEALO_API${ejemploRuta}"`,
    `  -H "Accept: application/json"`,
  ]
  if (e.auth !== "publico") lineas.push(`  -H "Authorization: Bearer $TOKEN"`)
  if (e.cuerpo?.ejemplo !== undefined) {
    lineas.push(`  -H "Content-Type: application/json"`)
    lineas.push(`  -d '${JSON.stringify(e.cuerpo.ejemplo)}'`)
  }
  return lineas.join(" \\\n")
}

function BloqueEsquema({
  esquema,
  id,
  titulo,
}: {
  esquema: Esquema
  id: string
  titulo: string
}) {
  return (
    <Apartado id={id} titulo={titulo}>
      <p className="text-sm text-muted-foreground">
        Tipo <code className="font-mono text-xs text-primary">{esquema.tipo}</code>
        {esquema.definidoEn && (
          <>
            {" "}
            en <code className="font-mono text-xs">{esquema.definidoEn}</code>
          </>
        )}
      </p>
      {esquema.campos && esquema.campos.length > 0 && (
        <TablaCampos campos={esquema.campos} />
      )}
      {esquema.ejemplo !== undefined && (
        <BloqueCodigo
          codigo={JSON.stringify(esquema.ejemplo, null, 2)}
          etiqueta="ejemplo · json"
        />
      )}
    </Apartado>
  )
}

/**
 * La ficha de un endpoint: el contrato entero que el servidor tiene que
 * cumplir para que la app no cambie ni una línea al conectarse.
 */
export function FichaEndpoint({ endpoint: e }: { endpoint: Endpoint }) {
  const Icono = ICONO_AREA[e.area]
  const lousan = accionesQueUsan(e.id)

  return (
    <article className="@container/ficha mx-auto w-full max-w-5xl space-y-10">
      <header className="space-y-4">
        <Link
          href={`/docs/api#${e.area}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <Icono className="size-4" aria-hidden />
          {AREA_INFO[e.area].titulo}
        </Link>
        <h1 className="flex flex-wrap items-center gap-3">
          <MetodoBadge metodo={e.metodo} className="h-7 w-20 text-sm" />
          <code className="min-w-0 font-mono text-2xl font-semibold tracking-tight break-all">
            {e.ruta}
          </code>
        </h1>
        <p className="max-w-2xl text-lg text-pretty text-muted-foreground">
          <Texto>{e.resumen}</Texto>
        </p>
        <div className="flex flex-wrap items-center gap-2 border-y py-3">
          <EstadoBadge estado={e.estado} />
          <AuthBadge auth={e.auth} />
          <code className="ml-auto font-mono text-xs text-muted-foreground">{e.id}</code>
        </div>
      </header>

      <div className="grid gap-10 @3xl/ficha:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="min-w-0 space-y-10">
          {e.descripcion && (
            <p className="max-w-2xl leading-relaxed text-pretty">
              <Texto>{e.descripcion}</Texto>
            </p>
          )}

          {e.parametros && e.parametros.length > 0 && (
            <Apartado id="parametros" titulo="Parámetros">
              <TablaCampos campos={e.parametros} />
            </Apartado>
          )}

          {e.cuerpo && <BloqueEsquema esquema={e.cuerpo} id="cuerpo" titulo="Cuerpo" />}
          <BloqueEsquema esquema={e.respuesta} id="respuesta" titulo="Respuesta" />

          {e.errores && e.errores.length > 0 && (
            <Apartado id="errores" titulo="Errores">
              <TablaErrores errores={e.errores} conHttp />
            </Apartado>
          )}

          {e.reglas && e.reglas.length > 0 && (
            <Apartado id="reglas" titulo="Lo que el servidor hace cumplir">
              <p className="text-sm text-muted-foreground">
                No se fía del front: estas reglas se comprueban también aquí.
              </p>
              <Lista items={e.reglas} />
            </Apartado>
          )}

          <Apartado id="probar" titulo="Pruébalo">
            <BloqueCodigo codigo={curlDe(e)} etiqueta="shell" />
            {e.auth !== "publico" && (
              <p className="text-xs text-pretty text-muted-foreground">
                La sesión todavía no existe en el servidor: el token es el que dará cuando
                exista (docs/costuras-backend.md, «Sesión e identidad»).
              </p>
            )}
          </Apartado>
        </div>

        <aside className="space-y-6 text-sm @3xl/ficha:sticky @3xl/ficha:top-20 @3xl/ficha:self-start">
          <Card>
            <CardContent className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                {e.estado === "conectado" ? "Frontera en el front" : "Lo sustituye hoy"}
              </p>
              <Origenes origenes={[e.origen]} />
            </CardContent>
          </Card>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Lo usan</p>
            <ul className="space-y-1.5">
              {lousan.map((a) => (
                <li key={a.id}>
                  <Link href={hrefAccion(a.id)} className="text-primary hover:underline">
                    {a.titulo}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </article>
  )
}
