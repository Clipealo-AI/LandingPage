"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { parseAsStringLiteral, useQueryState } from "nuqs"

import { Link, hrefDinamico, useRouter } from "@/i18n/navigation"
import type { Locale } from "@/i18n/routing"
import { toast } from "@/lib/toast"
import {
  CATEGORIAS,
  CUENTA_DEMO,
  LIMITES,
  borradorACampana,
  generarCodigo,
  nuevoId,
  puedeCrearCampanas,
  topePorVideo,
  validarBorrador,
  videosAlTope,
  vistasCompradas,
  vistasHastaTope,
  type BorradorCampana,
  type Categoria,
  type ErrorBorrador,
  type Perfil,
} from "@/lib/campanas"
import {
  ALCANCES_LICENCIA,
  LICENCIA_POR_DEFECTO,
  LIMITES_LICENCIA,
  type AlcanceLicencia,
} from "@/lib/derechos"
import { SOCIAL_IDS, SOCIAL_NETWORKS, type SocialId } from "@/lib/social"
import { useCampanas } from "@/hooks/use-campanas"
import { useCuenta } from "@/hooks/use-cuenta"
import { useFormat } from "@/hooks/use-format"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { SocialGlyph } from "@/components/brand/social"
import { PageHeader } from "@/components/shared/page-header"
import { CampaignCard } from "@/components/campanas/campaign-card"
import { AgencyGate } from "@/components/campanas/agency-gate"
import { PayoutCalculator } from "@/components/campanas/payout-calculator"

const INICIAL: BorradorCampana = {
  marca: "",
  titulo: "",
  serie: "",
  descripcion: "",
  categoria: "influencers",
  material: "",
  redes: ["tiktok", "instagram", "youtube"],
  requisitos: "",
  presupuesto: 1000,
  cpm: 1,
  topePorVideoPct: 10,
  minimoVistas: 2000,
  inicio: "2026-09-15",
  fin: "2026-10-15",
  licencia: { ...LICENCIA_POR_DEFECTO },
  privada: false,
  destacada: false,
}

/** Lo que se escribe en un campo de cifra. En inglés la coma separa miles; en el resto, decimales. */
const numero = (v: string, locale: Locale) =>
  v.trim() === ""
    ? Number.NaN
    : Number(locale === "en" ? v.replace(/,/g, "") : v.replace(",", "."))

/**
 * Crear una campaña: solo agencias y admin, y se publica al momento. Un usuario
 * es clipero y aquí ve cómo pedir el perfil de agencia. A la derecha, la tarjeta
 * tal como saldrá en Explorar y la calculadora con las reglas que se están
 * escribiendo: se ve el juego antes de poner el dinero.
 *
 * `?como=admin` es la entrada desde el backoffice. En producción el perfil sale
 * de la sesión, nunca de la URL.
 */
export function CampaignForm() {
  const t = useTranslations("campaigns.form")
  const tl = useTranslations("campaigns.licencia")
  const tc = useTranslations("campaigns.category")
  const tCard = useTranslations("campaigns.card")
  const f = useFormat()
  const router = useRouter()
  const { perfil: perfilCuenta, crear } = useCampanas()
  const { cuenta, guardarBorrador } = useCuenta()
  const [como] = useQueryState("como", parseAsStringLiteral(["admin"] as const))
  const perfil: Perfil = como === "admin" ? "admin" : perfilCuenta

  /**
   * El formulario arranca con lo que la agencia dejó en el simulador del
   * onboarding. Se guardaba de verdad (`guardarBorrador`) y dos pantallas lo
   * prometían —«Tu borrador te espera en Crear campaña»—, pero aquí nadie lo
   * leía y el formulario salía en blanco.
   */
  const [b, setB] = React.useState<BorradorCampana>(() => ({
    ...INICIAL,
    ...(cuenta.borradorCampana ?? {}),
  }))
  const [intento, setIntento] = React.useState(false)
  const errores = validarBorrador(b)
  const hayErrores = Object.keys(errores).length > 0
  const mensaje = ({ code, values }: ErrorBorrador) => {
    if (!values) return t(`errors.${code}`)
    const { min, max } = values
    if (code === "budgetRange")
      return t(`errors.${code}`, { min: f.money(min), max: f.money(max) })
    if (code === "cpmRange")
      return t(`errors.${code}`, {
        min: f.money(min, { decimals: 2 }),
        max: f.money(max),
      })
    if (code === "capRange")
      return t(`errors.${code}`, { min: f.percent(min), max: f.percent(max) })
    return t(`errors.${code}`, { min: f.number(min), max: f.number(max) })
  }
  const error = (k: keyof BorradorCampana) => {
    const e = intento ? errores[k] : undefined
    return e && mensaje(e)
  }
  const set = <K extends keyof BorradorCampana>(k: K, v: BorradorCampana[K]) =>
    setB((x) => ({ ...x, [k]: v }))

  const reglasValidas = !errores.presupuesto && !errores.cpm && !errores.topePorVideoPct

  const enviar = (e: React.FormEvent) => {
    e.preventDefault()
    setIntento(true)
    if (hayErrores) {
      toast.error(t("invalid"), {
        description: t("invalidDescription", { n: Object.keys(errores).length }),
      })
      // Lleva al primer campo con error
      requestAnimationFrame(() =>
        document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus()
      )
      return
    }
    const id = nuevoId("cmp")
    const autor =
      perfil === "admin"
        ? { perfil, nombre: "Clipealo" }
        : {
            perfil,
            nombre:
              // El nombre con el que firma queda guardado en la campaña, en el idioma de quien la crea
              perfil === "agencia"
                ? t("agencyAuthor", { name: CUENTA_DEMO.nombre })
                : CUENTA_DEMO.nombre,
            userId: CUENTA_DEMO.userId,
          }
    const campana = borradorACampana(
      b,
      autor,
      new Date(),
      id,
      b.privada ? generarCodigo() : undefined
    )
    crear(campana)
    // Publicado: el borrador ya no espera a nadie
    guardarBorrador(null)
    toast.celebrate(t("published"), {
      description: campana.privada
        ? t("publishedPrivate", { code: campana.codigo ?? "" })
        : t("publishedPublic"),
    })
    router.push(
      perfil === "admin" ? "/admin/campanas" : hrefDinamico("/campanas/[id]", { id })
    )
  }

  if (!puedeCrearCampanas(perfil)) return <AgencyGate />

  return (
    <form onSubmit={enviar} noValidate className="space-y-6">
      <PageHeader
        eyebrow={t("eyebrow", { profile: perfil })}
        title={t("title")}
        description={t("description")}
      />

      <div className="grid items-start gap-6 @5xl/nueva:grid-cols-[minmax(0,1fr)_minmax(22rem,28rem)] @[110rem]/nueva:grid-cols-[minmax(0,1fr)_32rem]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("basics.title")}</CardTitle>
              <CardDescription>{t("basics.description")}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 @3xl/nueva:grid-cols-2">
              <Field data-invalid={error("marca") ? true : undefined}>
                <FieldLabel htmlFor="marca">{t("brand")}</FieldLabel>
                <Input
                  id="marca"
                  value={b.marca}
                  aria-invalid={error("marca") ? true : undefined}
                  onChange={(e) => set("marca", e.target.value)}
                />
                {error("marca") && <FieldError>{error("marca")}</FieldError>}
              </Field>
              <Field data-invalid={error("titulo") ? true : undefined}>
                <FieldLabel htmlFor="titulo">{t("name")}</FieldLabel>
                <Input
                  id="titulo"
                  value={b.titulo}
                  aria-invalid={error("titulo") ? true : undefined}
                  onChange={(e) => set("titulo", e.target.value)}
                />
                {error("titulo") && <FieldError>{error("titulo")}</FieldError>}
              </Field>
              <Field>
                <FieldLabel htmlFor="categoria">{t("category")}</FieldLabel>
                <Select
                  value={b.categoria}
                  onValueChange={(v) => set("categoria", v as Categoria)}
                >
                  <SelectTrigger id="categoria" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {tc(c)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="serie">{t("series")}</FieldLabel>
                <Input
                  id="serie"
                  value={b.serie}
                  placeholder={t("seriesPlaceholder")}
                  onChange={(e) => set("serie", e.target.value)}
                />
              </Field>
              <Field
                data-invalid={error("descripcion") ? true : undefined}
                className="@3xl/nueva:col-span-2"
              >
                <FieldLabel htmlFor="descripcion">{t("brief")}</FieldLabel>
                <Textarea
                  id="descripcion"
                  rows={3}
                  value={b.descripcion}
                  aria-invalid={error("descripcion") ? true : undefined}
                  onChange={(e) => set("descripcion", e.target.value)}
                />
                {error("descripcion") ? (
                  <FieldError>{error("descripcion")}</FieldError>
                ) : (
                  <FieldDescription>{t("briefHint")}</FieldDescription>
                )}
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("materialTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 @3xl/nueva:grid-cols-2">
              <Field data-invalid={error("material") ? true : undefined}>
                <FieldLabel htmlFor="material">{t("material")}</FieldLabel>
                <Input
                  id="material"
                  inputMode="url"
                  placeholder="https://youtube.com/…"
                  value={b.material}
                  aria-invalid={error("material") ? true : undefined}
                  onChange={(e) => set("material", e.target.value)}
                />
                {error("material") ? (
                  <FieldError>{error("material")}</FieldError>
                ) : (
                  <FieldDescription>{t("materialHint")}</FieldDescription>
                )}
              </Field>
              <FieldSet data-invalid={error("redes") ? true : undefined}>
                <FieldLegend variant="label">{t("networks")}</FieldLegend>
                <ToggleGroup
                  type="multiple"
                  variant="outline"
                  spacing={2}
                  value={b.redes}
                  onValueChange={(v) => set("redes", v as SocialId[])}
                  className="flex-wrap"
                >
                  {SOCIAL_IDS.map((r) => (
                    <ToggleGroupItem
                      key={r}
                      value={r}
                      data-sound="tap"
                      aria-label={SOCIAL_NETWORKS[r].name}
                      className="size-10 data-[state=on]:border-primary data-[state=on]:bg-accent"
                    >
                      <SocialGlyph
                        network={r}
                        tone="official"
                        className="size-5"
                        aria-hidden
                      />
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
                {error("redes") && <FieldError>{error("redes")}</FieldError>}
              </FieldSet>
              <Field className="@3xl/nueva:col-span-2">
                <FieldLabel htmlFor="requisitos">{t("requirements")}</FieldLabel>
                <Textarea
                  id="requisitos"
                  rows={3}
                  value={b.requisitos}
                  placeholder={t("requirementsPlaceholder")}
                  onChange={(e) => set("requisitos", e.target.value)}
                />
                <FieldDescription>{t("requirementsHint")}</FieldDescription>
              </Field>
            </CardContent>
          </Card>

          {/* Derechos: lo que se concede con la campaña. Va antes del dinero
              porque es la mitad del trato que el clipero mira antes de entrar */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{tl("title")}</CardTitle>
              <CardDescription>{tl("description")}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 @3xl/nueva:grid-cols-2">
              <FieldSet>
                <FieldLegend variant="label">{tl("alcance")}</FieldLegend>
                <ToggleGroup
                  type="single"
                  variant="outline"
                  spacing={2}
                  value={b.licencia.alcance}
                  onValueChange={(v) =>
                    v && set("licencia", { ...b.licencia, alcance: v as AlcanceLicencia })
                  }
                  className="flex-wrap"
                >
                  {ALCANCES_LICENCIA.map((a) => (
                    <ToggleGroupItem
                      key={a}
                      value={a}
                      data-sound="tap"
                      className="data-[state=on]:border-primary data-[state=on]:bg-accent"
                    >
                      {tl(`alcances.${a}`)}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
                <FieldDescription>
                  {tl(`alcanceHint.${b.licencia.alcance}`)}
                </FieldDescription>
              </FieldSet>
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldLabel htmlFor="lista-blanca">{tl("listaBlanca")}</FieldLabel>
                  <FieldDescription>{tl("listaBlancaHint")}</FieldDescription>
                </FieldContent>
                <Switch
                  id="lista-blanca"
                  checked={b.licencia.listaBlanca}
                  onCheckedChange={(v) =>
                    set("licencia", { ...b.licencia, listaBlanca: v })
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="atribucion">{tl("atribucion")}</FieldLabel>
                <Input
                  id="atribucion"
                  value={b.licencia.atribucion ?? ""}
                  placeholder={tl("atribucionPlaceholder")}
                  maxLength={LIMITES_LICENCIA.atribucionMax}
                  onChange={(e) =>
                    set("licencia", { ...b.licencia, atribucion: e.target.value })
                  }
                />
                <FieldDescription>{tl("atribucionHint")}</FieldDescription>
              </Field>
              <Field data-invalid={error("licencia") ? true : undefined}>
                <FieldLabel htmlFor="notas-licencia">{tl("notas")}</FieldLabel>
                <Textarea
                  id="notas-licencia"
                  rows={2}
                  value={b.licencia.notas ?? ""}
                  placeholder={tl("notasPlaceholder")}
                  maxLength={LIMITES_LICENCIA.notasMax}
                  onChange={(e) =>
                    set("licencia", { ...b.licencia, notas: e.target.value })
                  }
                />
                {error("licencia") && <FieldError>{error("licencia")}</FieldError>}
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("payment.title")}</CardTitle>
              <CardDescription>{t("payment.description")}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 @3xl/nueva:grid-cols-2">
              <Field data-invalid={error("presupuesto") ? true : undefined}>
                <FieldLabel htmlFor="presupuesto">{t("budget")}</FieldLabel>
                <InputGroup>
                  <InputGroupAddon>
                    <InputGroupText>US$</InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    id="presupuesto"
                    inputMode="decimal"
                    defaultValue={b.presupuesto}
                    aria-invalid={error("presupuesto") ? true : undefined}
                    onChange={(e) => set("presupuesto", numero(e.target.value, f.locale))}
                  />
                </InputGroup>
                {error("presupuesto") ? (
                  <FieldError>{error("presupuesto")}</FieldError>
                ) : (
                  <FieldDescription>{t("budgetHint")}</FieldDescription>
                )}
              </Field>
              <Field data-invalid={error("cpm") ? true : undefined}>
                <FieldLabel htmlFor="cpm">{t("cpm")}</FieldLabel>
                <InputGroup>
                  <InputGroupAddon>
                    <InputGroupText>US$</InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    id="cpm"
                    inputMode="decimal"
                    defaultValue={
                      f.locale === "en" ? String(b.cpm) : String(b.cpm).replace(".", ",")
                    }
                    aria-invalid={error("cpm") ? true : undefined}
                    onChange={(e) => set("cpm", numero(e.target.value, f.locale))}
                  />
                </InputGroup>
                {error("cpm") ? (
                  <FieldError>{error("cpm")}</FieldError>
                ) : (
                  <FieldDescription>
                    {t("cpmHint", {
                      min: f.money(0.3, { decimals: 2 }),
                      max: f.money(3),
                    })}
                  </FieldDescription>
                )}
              </Field>
              <Field data-invalid={error("topePorVideoPct") ? true : undefined}>
                <div className="flex items-baseline justify-between gap-3">
                  <FieldLabel htmlFor="tope">{t("cap")}</FieldLabel>
                  <span className="text-sm font-semibold tabular-nums">
                    {f.percent(b.topePorVideoPct)}
                    {reglasValidas && ` · ${f.money(topePorVideo(b))}`}
                  </span>
                </div>
                <Slider
                  id="tope"
                  aria-label={t("capAria")}
                  min={LIMITES.topeMin}
                  max={LIMITES.topeMax}
                  step={1}
                  value={[b.topePorVideoPct]}
                  onValueChange={([v]) => set("topePorVideoPct", v)}
                />
                <FieldDescription>{t("capHint")}</FieldDescription>
              </Field>
              <Field data-invalid={error("minimoVistas") ? true : undefined}>
                <FieldLabel htmlFor="minimo">{t("minViews")}</FieldLabel>
                <Input
                  id="minimo"
                  inputMode="numeric"
                  defaultValue={b.minimoVistas}
                  aria-invalid={error("minimoVistas") ? true : undefined}
                  onChange={(e) => set("minimoVistas", numero(e.target.value, f.locale))}
                />
                {error("minimoVistas") ? (
                  <FieldError>{error("minimoVistas")}</FieldError>
                ) : (
                  <FieldDescription>{t("minViewsHint")}</FieldDescription>
                )}
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("datesTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 @3xl/nueva:grid-cols-2">
              <Field data-invalid={error("inicio") ? true : undefined}>
                <FieldLabel htmlFor="inicio">{t("starts")}</FieldLabel>
                <Input
                  id="inicio"
                  type="date"
                  value={b.inicio}
                  aria-invalid={error("inicio") ? true : undefined}
                  onChange={(e) => set("inicio", e.target.value)}
                />
                {error("inicio") && <FieldError>{error("inicio")}</FieldError>}
              </Field>
              <Field data-invalid={error("fin") ? true : undefined}>
                <FieldLabel htmlFor="fin">{t("ends")}</FieldLabel>
                <Input
                  id="fin"
                  type="date"
                  value={b.fin}
                  aria-invalid={error("fin") ? true : undefined}
                  onChange={(e) => set("fin", e.target.value)}
                />
                {error("fin") && <FieldError>{error("fin")}</FieldError>}
              </Field>
              <Field orientation="horizontal" className="@3xl/nueva:col-span-2">
                <FieldContent>
                  <FieldLabel htmlFor="privada">{t("private")}</FieldLabel>
                  <FieldDescription>{t("privateHint")}</FieldDescription>
                </FieldContent>
                <Switch
                  id="privada"
                  checked={b.privada}
                  onCheckedChange={(v) => set("privada", v)}
                />
              </Field>
              {perfil === "admin" && (
                <Field orientation="horizontal" className="@3xl/nueva:col-span-2">
                  <FieldContent>
                    <FieldLabel htmlFor="destacada">{t("featured")}</FieldLabel>
                    <FieldDescription>{t("featuredHint")}</FieldDescription>
                  </FieldContent>
                  <Switch
                    id="destacada"
                    checked={b.destacada}
                    onCheckedChange={(v) => set("destacada", v)}
                  />
                </Field>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="ghost" size="lg" asChild>
              <Link href={perfil === "admin" ? "/admin/campanas" : "/campanas"}>
                {t("cancel")}
              </Link>
            </Button>
            <Button type="submit" variant="brand" size="lg">
              {t("publish")}
            </Button>
          </div>
        </div>

        <aside className="space-y-6 @5xl/nueva:sticky @5xl/nueva:top-[calc(var(--spacing-topbar)+1.5rem)]">
          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              {t("preview")}
            </p>
            <CampaignCard
              preview
              campana={{
                ...borradorACampana(
                  {
                    ...b,
                    titulo: b.titulo || tCard("titlePlaceholder"),
                    marca: b.marca || tCard("brandPlaceholder"),
                    descripcion: b.descripcion || "—",
                    material: b.material || "https://",
                  },
                  { perfil, nombre: "" },
                  new Date(0),
                  "preview"
                ),
                presupuesto: Number.isFinite(b.presupuesto) ? b.presupuesto : 0,
                cpm: Number.isFinite(b.cpm) ? b.cpm : 0,
              }}
              liquidacion={{ consumidoPct: 0 }}
              estado="activa"
              clips={0}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("distribution.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {reglasValidas ? (
                <>
                  <ul className="space-y-1.5 text-sm">
                    <li>
                      {t.rich("distribution.buys", {
                        b: (c) => <strong>{c}</strong>,
                        views: f.compact(vistasCompradas(b)),
                      })}
                    </li>
                    <li>
                      {t.rich("distribution.capAt", {
                        b: (c) => <strong>{c}</strong>,
                        cap: f.money(topePorVideo(b)),
                        views: f.number(vistasHastaTope(b)),
                      })}
                    </li>
                    <li>
                      {t.rich("distribution.atLeast", {
                        b: (c) => <strong>{c}</strong>,
                        n: f.number(videosAlTope(b)),
                      })}
                    </li>
                  </ul>
                  <PayoutCalculator
                    key={`${b.presupuesto}-${b.cpm}-${b.topePorVideoPct}`}
                    reglas={b}
                  />
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t("distribution.incomplete")}
                </p>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </form>
  )
}
