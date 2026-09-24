"use client"

import * as React from "react"
import { Copy, Eraser, Upload } from "lucide-react"
import { useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"
import { formatTimecode } from "@/lib/format"
import { toast } from "@/lib/toast"
import type { SourceVideo } from "@/lib/types"
import {
  LIMITES_PUBLICACION,
  copiaConTexto,
  hashtagsDe,
  impideCopiar,
  textoParaEnviar,
  validarCopia,
  type CopiaPublicacion,
} from "@/lib/publicacion"
import { SOCIAL_IDS, SOCIAL_NETWORKS, type SocialId } from "@/lib/social"
import { useJobs } from "@/hooks/use-jobs"
import { usePublicacion } from "@/hooks/use-publicacion"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { SocialGlyph } from "@/components/brand/social"

/**
 * La PLANTILLA de un proyecto por red: título, descripción y hashtags con los
 * que Clipealo publica sus clips. Aquí se escribe una vez lo que vale para
 * todos —la firma, los hashtags de siempre, el aviso legal— y cada clip puede
 * apartarse de ella desde su ficha. Nada de aquí toca el archivo de video.
 *
 * Se guarda al teclear en este navegador (`hooks/use-publicacion.ts`); cada
 * pestaña de red lleva un punto cuando ya tiene algo escrito.
 */
export function PublicacionPanel({ iniciales }: { iniciales: SourceVideo[] }) {
  const t = useTranslations("app.operaciones.publicacion")
  const tOps = useTranslations("app.operaciones")
  const { data: proyectos } = useJobs(iniciales)
  const { plantillaDe } = usePublicacion()

  // Cualquier proyecto listo: también un recorte o una variante ya procesada
  const listos = proyectos.filter((p) => p.status === "listo")
  const [videoId, setVideoId] = React.useState<string>(listos[0]?.id ?? "")
  const [red, setRed] = React.useState<SocialId>("tiktok")
  const video = listos.find((p) => p.id === videoId) ?? null

  if (listos.length === 0)
    return (
      <div className="space-y-4 rounded-xl bg-card p-6 ring-1 ring-border">
        <p className="text-sm text-pretty text-muted-foreground">{tOps("sinVideos")}</p>
        <Button variant="outline" asChild>
          <Link href="/subir">
            <Upload /> {tOps("subir")}
          </Link>
        </Button>
      </div>
    )

  return (
    <div className="space-y-6">
      <Field>
        <FieldLabel htmlFor="publicacion-video">{tOps("video")}</FieldLabel>
        <Select value={videoId} onValueChange={setVideoId}>
          <SelectTrigger id="publicacion-video" className="h-10 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {listos.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.title} · {formatTimecode(p.duration)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {video && (
        <Tabs value={red} onValueChange={(v) => setRed(v as SocialId)}>
          <TabsList className="flex-wrap" aria-label={t("red")}>
            {SOCIAL_IDS.map((id) => {
              const escrita = copiaConTexto(plantillaDe(video.id, id))
              return (
                <TabsTrigger key={id} value={id} className="gap-1.5">
                  <SocialGlyph
                    network={id}
                    tone="official"
                    className="size-3.5"
                    aria-hidden
                  />
                  {SOCIAL_NETWORKS[id].name}
                  {escrita && (
                    <span
                      className="size-1.5 rounded-full bg-primary"
                      aria-label={t("conTexto")}
                    />
                  )}
                </TabsTrigger>
              )
            })}
          </TabsList>
          {SOCIAL_IDS.map((id) => (
            <TabsContent key={id} value={id} className="pt-4">
              {/* `key` por proyecto y red: cambiar de red es otro texto */}
              <PlantillaEditor key={`${video.id}:${id}`} proyectoId={video.id} red={id} />
            </TabsContent>
          ))}
        </Tabs>
      )}

      <p className="text-xs text-pretty text-muted-foreground">{t("nota")}</p>
    </div>
  )
}

function PlantillaEditor({ proyectoId, red }: { proyectoId: string; red: SocialId }) {
  const t = useTranslations("app.operaciones.publicacion")
  const { plantillaDe, guardarPlantilla, vaciarPlantilla } = usePublicacion()
  const almacenada = plantillaDe(proyectoId, red)
  const [copia, setCopia] = React.useState<CopiaPublicacion>(almacenada)
  // Lo que se teclea en el campo de hashtags, antes de normalizarlo
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
  const avisos = validarCopia(copia, red)
  // Pasarse de largo impide ENVIAR, no copiar: lo que no se puede copiar es la
  // nada. El aviso sigue estando, que es lo que evita que salga cortado
  const sinNada = impideCopiar(avisos)

  const pon = (siguiente: CopiaPublicacion) => {
    setCopia(siguiente)
    guardarPlantilla(proyectoId, red, siguiente)
  }

  const copiar = async () => {
    if (sinNada) return
    try {
      await navigator.clipboard.writeText(textoParaEnviar(copia, red))
      toast.success(t("copiado"), { description: t("copiadoHint", { red: nombreRed }) })
    } catch {
      // Sin portapapeles (permiso denegado): el texto sigue en pantalla para copiarlo a mano
      toast(t("copiado"), { description: t("copiadoHint", { red: nombreRed }) })
    }
  }

  return (
    <div className="space-y-4">
      <Field>
        <FieldLabel htmlFor={`pub-titulo-${red}`}>{t("titulo")}</FieldLabel>
        <Input
          id={`pub-titulo-${red}`}
          value={copia.titulo}
          onChange={(e) => pon({ ...copia, titulo: e.target.value })}
        />
        {limites.titulo !== undefined && (
          <FieldDescription className="tabular-nums">
            {t("contador", { n: copia.titulo.length, max: limites.titulo })}
          </FieldDescription>
        )}
      </Field>
      <Field>
        <FieldLabel htmlFor={`pub-texto-${red}`}>{t("texto")}</FieldLabel>
        <Textarea
          id={`pub-texto-${red}`}
          rows={5}
          value={copia.texto}
          onChange={(e) => pon({ ...copia, texto: e.target.value })}
        />
        <FieldDescription className="tabular-nums">
          {t("contador", { n: copia.texto.length, max: limites.texto })}
        </FieldDescription>
      </Field>
      <Field>
        <FieldLabel htmlFor={`pub-hashtags-${red}`}>{t("hashtags")}</FieldLabel>
        <Input
          id={`pub-hashtags-${red}`}
          value={hashtagsTexto}
          placeholder={t("hashtagsPlaceholder")}
          onChange={(e) => {
            setHashtagsTexto(e.target.value)
            pon({ ...copia, hashtags: hashtagsDe(e.target.value) })
          }}
        />
        <FieldDescription className="tabular-nums">
          {t("hashtagsHint", { n: copia.hashtags.length, max: limites.hashtags })}
        </FieldDescription>
      </Field>

      {avisos.length > 0 && (
        <ul className="space-y-1 text-sm text-warning" role="status">
          {avisos.map((a) => (
            <li key={a.code}>
              {t(`avisos.${a.code}`, {
                red: nombreRed,
                max: a.values?.max ?? 0,
                n: a.values?.n ?? 0,
              })}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={copiar} disabled={sinNada}>
          <Copy /> {t("copiar", { red: nombreRed })}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={!copiaConTexto(copia)}
          // Se vacía el almacén y el ajuste de arriba trae el hueco: sin eso
          // había dos caminos para lo mismo y uno se podía olvidar
          onClick={() => vaciarPlantilla(proyectoId, red)}
        >
          <Eraser /> {t("limpiar", { red: nombreRed })}
        </Button>
      </div>
    </div>
  )
}
