"use client"

import * as React from "react"
import { Eraser } from "lucide-react"
import { useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"
import {
  LIMITES_PUBLICACION,
  copiaConTexto,
  copiaEfectiva,
  copiaHeredada,
  hashtagsDe,
  validarCopia,
  type CopiaPublicacion,
} from "@/lib/publicacion"
import { SOCIAL_IDS, SOCIAL_NETWORKS, type SocialId } from "@/lib/social"
import type { Clip } from "@/lib/types"
import { usePublicacion } from "@/hooks/use-publicacion"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { SocialGlyph } from "@/components/brand/social"

/**
 * El texto con el que sale ESTE clip en cada red.
 *
 * Empieza heredando la plantilla de su proyecto (Operaciones › Publicación): en
 * cuanto se escribe algo aquí, el clip se aparta de ella y lo dice. «Volver a
 * la plantilla» borra lo propio, no lo copia: si copiara, mejorar la plantilla
 * dejaría de llegar a los clips que la usan.
 *
 * Una pestaña por red, con su punto cuando ya tiene algo escrito: es la misma
 * barra que la plantilla del proyecto (`publicacion-panel.tsx`), y las dos
 * pantallas editan lo mismo con la misma forma. Vive en la columna ancha de la
 * ficha porque tres campos y seis redes no caben en la estrecha.
 */
export function CopiaClip({ clip }: { clip: Clip }) {
  const t = useTranslations("app.clip.copia")
  const tp = useTranslations("app.operaciones.publicacion")
  const [red, setRed] = React.useState<SocialId>("tiktok")
  const { guardado } = usePublicacion()

  // Contenedor propio: los campos se reparten según lo ancho que sea ESTA
  // columna, no la página; con la consulta al contenedor de fuera salían en dos
  // columnas dentro de un hueco de trescientos píxeles
  return (
    <section className="@container/copia space-y-3" aria-labelledby="clip-copia">
      <div className="space-y-1">
        <h2 id="clip-copia" className="text-sm font-semibold">
          {t("titulo")}
        </h2>
        <p className="text-xs text-pretty text-muted-foreground">{t("ayuda")}</p>
      </div>

      <Tabs value={red} onValueChange={(v) => setRed(v as SocialId)}>
        <TabsList className="flex-wrap" aria-label={tp("red")}>
          {SOCIAL_IDS.map((id) => (
            <TabsTrigger key={id} value={id} className="gap-1.5">
              <SocialGlyph
                network={id}
                tone="official"
                className="size-3.5"
                aria-hidden
              />
              {SOCIAL_NETWORKS[id].name}
              {copiaConTexto(copiaEfectiva(guardado, clip, id)) && (
                <span
                  className="size-1.5 rounded-full bg-primary"
                  aria-label={tp("conTexto")}
                />
              )}
            </TabsTrigger>
          ))}
        </TabsList>
        {SOCIAL_IDS.map((id) => (
          <TabsContent key={id} value={id} className="pt-4">
            {/* `key` por clip y red: cambiar de red es empezar otro texto */}
            <Editor key={`${clip.id}:${id}`} clip={clip} red={id} />
          </TabsContent>
        ))}
      </Tabs>
    </section>
  )
}

function Editor({ clip, red }: { clip: Clip; red: SocialId }) {
  const t = useTranslations("app.clip.copia")
  const tp = useTranslations("app.operaciones.publicacion")
  const { guardado, guardarCopia, vaciarCopia } = usePublicacion()
  const heredada = copiaHeredada(guardado, clip, red)
  const almacenada = copiaEfectiva(guardado, clip, red)
  const [copia, setCopia] = React.useState<CopiaPublicacion>(almacenada)
  const [hashtagsTexto, setHashtagsTexto] = React.useState(almacenada.hashtags.join(" "))

  /**
   * El almacén manda cuando cambia por fuera.
   *
   * Los campos nacen con lo guardado, pero en el PRIMER render del navegador
   * el almacén todavía está vacío: `useSyncExternalStore` usa la foto del
   * servidor mientras hidrata y solo después lee `localStorage`. Un `useState`
   * a secas se quedaba con ese vacío para siempre.
   *
   * Se ajusta durante el render y no volviendo a montar el formulario: montar
   * de nuevo tiraba lo que se acabara de teclear en esa rendija. `vista` es lo
   * último que se vio del almacén; si lo guardado ya no es eso y tampoco es lo
   * que hay escrito, vino de fuera —la hidratación, otra pestaña, «volver a la
   * plantilla»— y manda.
   */
  const [vista, setVista] = React.useState(almacenada)
  if (almacenada !== vista) {
    setVista(almacenada)
    if (almacenada !== copia) {
      setCopia(almacenada)
      setHashtagsTexto(almacenada.hashtags.join(" "))
    }
  }

  const limites = LIMITES_PUBLICACION[red]
  const nombreRed = SOCIAL_NETWORKS[red].name
  // `vacia` no se enseña aquí: un clip sin texto propio sale con el gancho que
  // propuso la IA, así que no tener nada escrito no es un error que arreglar
  const avisos = validarCopia(copia, red).filter((a) => a.code !== "vacia")

  /** Escribir aquí es apartarse de la plantilla: se guarda como texto del clip. */
  const pon = (siguiente: CopiaPublicacion) => {
    setCopia(siguiente)
    guardarCopia(clip.id, red, siguiente)
  }

  return (
    <div className="space-y-3">
      {heredada && copiaConTexto(copia) && (
        <p className="text-xs text-pretty text-muted-foreground">
          {t("heredada")}{" "}
          <Link
            href="/operaciones/publicacion"
            className="text-primary underline-offset-4 hover:underline"
          >
            {t("verPlantilla")}
          </Link>
        </p>
      )}

      <div className="grid gap-3 @md/copia:grid-cols-2">
        <Field>
          <FieldLabel htmlFor={`clip-titulo-${red}`}>{tp("titulo")}</FieldLabel>
          <Input
            id={`clip-titulo-${red}`}
            value={copia.titulo}
            onChange={(e) => pon({ ...copia, titulo: e.target.value })}
          />
          {limites.titulo !== undefined && (
            <FieldDescription className="tabular-nums">
              {tp("contador", { n: copia.titulo.length, max: limites.titulo })}
            </FieldDescription>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor={`clip-hashtags-${red}`}>{tp("hashtags")}</FieldLabel>
          <Input
            id={`clip-hashtags-${red}`}
            value={hashtagsTexto}
            placeholder={tp("hashtagsPlaceholder")}
            onChange={(e) => {
              setHashtagsTexto(e.target.value)
              pon({ ...copia, hashtags: hashtagsDe(e.target.value) })
            }}
          />
          <FieldDescription className="tabular-nums">
            {tp("hashtagsHint", { n: copia.hashtags.length, max: limites.hashtags })}
          </FieldDescription>
        </Field>
      </div>

      <Field>
        <FieldLabel htmlFor={`clip-texto-${red}`}>{tp("texto")}</FieldLabel>
        <Textarea
          id={`clip-texto-${red}`}
          rows={4}
          value={copia.texto}
          onChange={(e) => pon({ ...copia, texto: e.target.value })}
        />
        <FieldDescription className="tabular-nums">
          {tp("contador", { n: copia.texto.length, max: limites.texto })}
        </FieldDescription>
      </Field>

      {avisos.length > 0 && (
        <ul
          className="space-y-1 text-sm"
          role="status"
          aria-label={t("avisos", { red: nombreRed })}
        >
          {avisos.map((a) => (
            <li key={a.code} className={a.bloquea ? "text-destructive" : "text-warning"}>
              {tp(`avisos.${a.code}`, {
                red: nombreRed,
                max: a.values?.max ?? 0,
                n: a.values?.n ?? 0,
              })}
            </li>
          ))}
        </ul>
      )}

      {!heredada && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          // Solo se borra lo propio: lo que quede lo trae el almacén por el
          // ajuste de arriba, que es el mismo camino que la hidratación
          onClick={() => vaciarCopia(clip.id, red)}
        >
          <Eraser /> {t("volverAPlantilla")}
        </Button>
      )}
    </div>
  )
}
