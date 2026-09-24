import type { Metadata } from "next"

import { idiomaDe } from "@/i18n/server"
import { SECCIONES_MARCA } from "@/lib/wiki/marca"
import { EspecimenDe, Tokens } from "@/components/wiki/especimenes"
import { Lista, Origenes } from "@/components/wiki/partes"
import { Texto } from "@/components/wiki/texto"
import { PaginaWiki } from "@/components/wiki/pagina-wiki"

export const metadata: Metadata = { title: "Marca" }

/**
 * La guía de marca: cada sección con su criterio, sus reglas, lo que no se
 * hace y sus tokens pintados en vivo. Los componentes uno a uno están en
 * /design-system; aquí va el porqué.
 */
export default async function MarcaPage({ params }: PageProps<"/[locale]">) {
  await idiomaDe(params)
  return (
    <PaginaWiki migas={[{ label: "Wiki", href: "/docs" }, { label: "Marca" }]}>
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[12rem_minmax(0,1fr)]">
        <nav aria-label="Secciones de la guía" className="max-lg:hidden">
          <ul className="sticky top-20 space-y-1 text-sm">
            {SECCIONES_MARCA.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="block rounded-md px-2 py-1.5 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                >
                  {s.titulo}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 space-y-16">
          <header className="max-w-3xl space-y-3">
            <h1 className="text-3xl font-bold tracking-tight">Marca</h1>
            <p className="text-lg text-pretty text-muted-foreground">
              Cómo se ve, suena y se mueve Clipealo, y por qué. Los colores, las
              tipografías y los logos de esta página son los de verdad: salen de los
              mismos tokens y componentes que la app.
            </p>
          </header>

          {SECCIONES_MARCA.map((s) => (
            <section
              key={s.id}
              id={s.id}
              aria-labelledby={`${s.id}-t`}
              className="scroll-mt-20 space-y-6 border-t pt-10"
            >
              <div className="max-w-3xl space-y-3">
                <h2 id={`${s.id}-t`} className="text-2xl font-bold tracking-tight">
                  {s.titulo}
                </h2>
                <p className="text-lg text-pretty text-muted-foreground">
                  <Texto>{s.resumen}</Texto>
                </p>
                {s.criterio.map((p) => (
                  <p key={p} className="leading-relaxed text-pretty">
                    <Texto>{p}</Texto>
                  </p>
                ))}
              </div>

              <EspecimenDe id={s.id} />
              {s.tokens && s.tokens.length > 0 && <Tokens tokens={s.tokens} />}

              <div className="grid gap-8 md:grid-cols-2">
                {s.reglas && s.reglas.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold">Siempre</h3>
                    <Lista items={s.reglas} />
                  </div>
                )}
                {s.noHacer && s.noHacer.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold">Nunca</h3>
                    <ul className="space-y-3">
                      {s.noHacer.map((n) => (
                        <li
                          key={n.que}
                          className="rounded-xl bg-destructive/5 px-4 py-3 ring-1 ring-destructive/15"
                        >
                          <p className="font-medium">
                            <Texto>{n.que}</Texto>
                          </p>
                          <p className="mt-1 text-sm text-pretty text-muted-foreground">
                            <Texto>{n.porque}</Texto>
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">En el código</p>
                <Origenes origenes={s.origen} />
              </div>
            </section>
          ))}
        </div>
      </div>
    </PaginaWiki>
  )
}
