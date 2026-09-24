"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Upload } from "lucide-react"

import { toast } from "@/lib/toast"
import { INDEXADO_EN, metricasEn, todasLasPublicaciones } from "@/lib/analytics"
import {
  HOY_CAMPANAS,
  liquidar,
  nuevoId,
  pagoPorVideo,
  topePorVideo,
  vistasHastaTope,
  type Campana,
  type Envio,
} from "@/lib/campanas"
import { compromisoAlEntregar } from "@/lib/participacion"
import { requisitosQueFaltan } from "@/lib/micro-preguntas"
import { SOCIAL_NETWORKS, type SocialId } from "@/lib/social"
import { useAgenda } from "@/hooks/use-agenda"
import { useCampanas } from "@/hooks/use-campanas"
import { useCuenta, useCuentaLista } from "@/hooks/use-cuenta"
import { useFormat } from "@/hooks/use-format"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SocialGlyph } from "@/components/brand/social"
import { MicroLugar, RequisitosCampana } from "@/components/onboarding/micro-question"
import { miParticipacion } from "@/components/campanas/solicitar-dialog"

const ENLACE = "enlace"

/**
 * Enviar un clip a una campaña. Se elige uno ya publicado (sus vistas vienen del
 * índice de Analíticas) o se pega el enlace de uno publicado fuera. La red tiene
 * que ser de las que admite la campaña. El envío entra en revisión: quien creó
 * la campaña comprueba que cumple los requisitos antes de que cobre.
 */
export function SubmitClipDialog({
  campana,
  open,
  onOpenChange,
}: {
  campana: Campana | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open && campana !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {campana && (
          <Formulario
            key={campana.id}
            campana={campana}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function Formulario({ campana, onDone }: { campana: Campana; onDone: () => void }) {
  const t = useTranslations("campaigns.submit")
  const tr = useTranslations("onboarding.micro.requisitos")
  const f = useFormat()
  const { enviarClip, cuenta, envios, participaciones } = useCampanas()
  const { cuenta: perfil } = useCuenta()
  const { entradas } = useAgenda()
  const cuentaLista = useCuentaLista()
  const [requisitosHechos, setRequisitosHechos] = React.useState(false)
  /**
   * Lo que se ha publicado de verdad: las semillas ya indexadas y lo que ha
   * salido desde Clipealo. Antes era un array fijo del módulo, así que enviar
   * un clip recién publicado obligaba a pegar su enlace y a cobrar cero.
   */
  const propias = React.useMemo(
    () => todasLasPublicaciones(entradas).filter((p) => campana.redes.includes(p.red)),
    [entradas, campana.redes]
  )
  const [origen, setOrigen] = React.useState<string>(propias[0]?.id ?? ENLACE)
  const [url, setUrl] = React.useState("")
  const [red, setRed] = React.useState<SocialId>(campana.redes[0])
  const [acepta, setAcepta] = React.useState(false)
  const [intento, setIntento] = React.useState(false)

  const pub = propias.find((p) => p.id === origen)
  /**
   * Una publicación recién salida todavía no se ha leído: `undefined` dice
   * «pendiente de lectura», que no es lo mismo que «se midió y salió cero».
   * Con `publicacionId` guardado, la tabla sabe distinguirlas.
   */
  const leida = pub ? Date.parse(pub.publicadoEn) < Date.parse(INDEXADO_EN) : false
  const vistas = pub && leida ? metricasEn(pub, INDEXADO_EN).vistas : undefined
  const redFinal = pub ? pub.red : red
  const urlFinal = pub ? pub.url : url.trim()
  const errorUrl = !pub && !/^https?:\/\/\S+\.\S+/.test(urlFinal)
  // Con lo que queda del presupuesto, no con el presupuesto entero: si la
  // campaña está casi agotada, el estimado tiene que decirlo
  const estimado = pagoPorVideo(campana, vistas ?? 0, liquidar(campana, envios).restante)
  // Sin requisitos no hay nada que confirmar
  const cumple = campana.requisitos.length === 0 || acepta

  const enviar = (e: React.FormEvent) => {
    e.preventDefault()
    setIntento(true)
    if (errorUrl || !cumple) return
    const envio: Envio = {
      id: nuevoId("env"),
      campanaId: campana.id,
      creador: cuenta.nombre,
      userId: cuenta.userId,
      // Sin título que leer del enlace, se guarda uno en el idioma de quien lo envía
      titulo: pub ? pub.titulo : t("linkedTitle"),
      red: redFinal,
      url: urlFinal,
      // De dónde salió: con esto las vistas se vuelven a leer, la agencia ve la
      // cuenta y la fila enlaza al clip dentro de su proyecto
      publicacionId: pub?.id,
      cuentaId: pub?.cuentaId,
      clipId: pub?.clipId,
      proyectoId: pub?.proyectoId,
      vistas,
      vistasEn: vistas === undefined ? undefined : INDEXADO_EN,
      estado: "en-revision",
      enviadoEn: new Date().toISOString(),
    }
    // Entregar CIERRA el compromiso. Sin esto la participación se quedaba en
    // «aceptada» hasta caducar, y la tarjeta acababa diciendo «venció el plazo
    // sin entrega» a quien había entregado y cobrado
    enviarClip(
      envio,
      compromisoAlEntregar({
        participacion: miParticipacion(participaciones, campana.id, cuenta.userId),
        campana,
        envioId: envio.id,
        nuevo: {
          id: nuevoId("par"),
          campanaId: campana.id,
          userId: cuenta.userId,
          clipero: cuenta.nombre,
          en: HOY_CAMPANAS,
        },
      })
    )
    toast.success(t("sent"), {
      description: t("sentDescription", { brand: campana.marca }),
    })
    onDone()
  }

  // Redes, país e idiomas son obligatorios para aceptar una campaña (§6.5):
  // se piden aquí, antes del formulario, y no se pueden posponer.
  const faltan = cuentaLista && !requisitosHechos ? requisitosQueFaltan(perfil) : []
  if (faltan.length > 0) {
    return (
      <div className="space-y-5">
        <DialogHeader>
          <DialogTitle>{tr("title")}</DialogTitle>
          <DialogDescription>
            {tr("description", {
              n: faltan.length,
              campos: f.list(
                faltan.map((campo) => tr(`campos.${campo}`)),
                "conjunction"
              ),
            })}
          </DialogDescription>
        </DialogHeader>
        <RequisitosCampana faltan={faltan} onListo={() => setRequisitosHechos(true)} />
      </div>
    )
  }

  return (
    <form onSubmit={enviar} className="space-y-5">
      <DialogHeader>
        <DialogTitle>{t("title", { title: campana.titulo })}</DialogTitle>
        <DialogDescription>
          {t("description", {
            networks: campana.redes.map((r) => SOCIAL_NETWORKS[r].name).join(", "),
            views: f.number(campana.minimoVistas),
            cap: f.money(topePorVideo(campana)),
          })}
        </DialogDescription>
      </DialogHeader>

      <Field>
        <FieldLabel htmlFor="origen-clip">{t("clip")}</FieldLabel>
        <Select value={origen} onValueChange={setOrigen}>
          <SelectTrigger id="origen-clip" className="h-10 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {propias.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                <SocialGlyph
                  network={p.red}
                  tone="official"
                  className="size-4"
                  aria-hidden
                />
                <span className="truncate">{p.titulo}</span>
              </SelectItem>
            ))}
            <SelectItem value={ENLACE}>{t("pasteLink")}</SelectItem>
          </SelectContent>
        </Select>
        <FieldDescription>
          {!pub
            ? t("publishedHint")
            : vistas === undefined
              ? t("pendingRead", { network: SOCIAL_NETWORKS[pub.red].name })
              : t("publishedViews", {
                  network: SOCIAL_NETWORKS[pub.red].name,
                  views: f.number(vistas),
                })}
        </FieldDescription>
      </Field>

      {!pub && (
        <div className="grid gap-4 sm:grid-cols-[1fr_11rem]">
          <Field data-invalid={intento && errorUrl ? true : undefined}>
            <FieldLabel htmlFor="url-clip">{t("link")}</FieldLabel>
            <Input
              id="url-clip"
              value={url}
              inputMode="url"
              placeholder={t("linkPlaceholder")}
              aria-invalid={intento && errorUrl ? true : undefined}
              onChange={(e) => setUrl(e.target.value)}
            />
            {intento && errorUrl ? (
              <FieldError>{t("linkError")}</FieldError>
            ) : (
              <FieldDescription>{t("linkHint")}</FieldDescription>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor="red-clip">{t("network")}</FieldLabel>
            <Select value={red} onValueChange={(v) => setRed(v as SocialId)}>
              <SelectTrigger id="red-clip" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {campana.redes.map((r) => (
                  <SelectItem key={r} value={r}>
                    <SocialGlyph
                      network={r}
                      tone="official"
                      className="size-4"
                      aria-hidden
                    />
                    {SOCIAL_NETWORKS[r].name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      )}

      {pub && (
        <p className="rounded-lg bg-muted p-3 text-sm">
          {t.rich(
            estimado.limitadoPor === "tope"
              ? "estimateAtCap"
              : estimado.limitadoPor === "minimo"
                ? "estimateBelowMin"
                : "estimate",
            {
              b: (c) => <strong className="tabular-nums">{c}</strong>,
              amount: f.money(estimado.pago, { decimals: 2 }),
              missing: f.number(campana.minimoVistas - (vistas ?? 0)),
              views: f.number(vistasHastaTope(campana)),
            }
          )}
        </p>
      )}

      {campana.requisitos.length > 0 && (
        <Field
          data-invalid={intento && !acepta ? true : undefined}
          orientation="horizontal"
        >
          <Checkbox
            id="acepta-requisitos"
            checked={acepta}
            onCheckedChange={(v) => setAcepta(v === true)}
          />
          {/* `FieldContent` y no un div suelto: es lo que hace que el `Field`
              horizontal alinee la casilla arriba, con la frase, y no en el centro
              de las viñetas */}
          <FieldContent className="gap-1">
            <FieldLabel htmlFor="acepta-requisitos" className="font-normal">
              {t("confirm")}
            </FieldLabel>
            <ul className="list-disc space-y-0.5 pl-4 text-xs text-muted-foreground">
              {campana.requisitos.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            {intento && !acepta && <FieldError>{t("confirmError")}</FieldError>}
          </FieldContent>
        </Field>
      )}

      {/* Una micropregunta como mucho, en silencio y con «Ahora no» (§6.6) */}
      <MicroLugar lugar="enviar" variante="linea" />

      <DialogFooter>
        <Button type="submit" variant="brand">
          <Upload /> {t("send")}
        </Button>
      </DialogFooter>
    </form>
  )
}
