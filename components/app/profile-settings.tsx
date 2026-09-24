"use client"

import * as React from "react"
import { Check, ImageUp } from "lucide-react"
import { useTranslations } from "next-intl"

import { LOCALE_NAME, LOCALE_TAG, routing, type Locale } from "@/i18n/routing"
import { toast } from "@/lib/toast"
import { COUNTRY_CODES, type CountryCode } from "@/lib/countries"
import {
  AVATAR_MAX_BYTES,
  AVATAR_TIPOS,
  CANAL_MAX,
  PLATAFORMA_LABEL,
  PLATAFORMAS_DIRECTO,
  validarCanal,
  type PerfilCanal,
  type PlataformaDirecto,
} from "@/lib/ajustes"
import { inicialesDe, useCuenta } from "@/hooks/use-cuenta"
import { useFormat } from "@/hooks/use-format"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  FacebookIcon,
  KickIcon,
  TikTokIcon,
  TwitchIcon,
  YouTubeIcon,
  type SocialIconProps,
} from "@/components/brand/social-icons"
import { CountryFlag, useCountryName } from "@/components/shared/country-flag"
import {
  ZONA_POR_DEFECTO,
  ciudadDeZona,
  etiquetaZona,
  zonaDelNavegador,
  zonasDisponibles,
} from "@/lib/fechas"
import { HOY_CAMPANAS } from "@/lib/campanas"
import { MOVIMIENTOS, type Movimiento } from "@/lib/preferencia-movimiento"
import { useMovimiento } from "@/hooks/use-movimiento"
import { useCambiarIdioma } from "@/components/shared/locale-switcher"
import { SettingsSaveBar } from "@/components/app/settings-save-bar"

const ICONO_PLATAFORMA: Record<
  PlataformaDirecto,
  React.ComponentType<SocialIconProps>
> = {
  twitch: TwitchIcon,
  youtube: YouTubeIcon,
  kick: KickIcon,
  tiktok: TikTokIcon,
  facebook: FacebookIcon,
}

const mismos = (a: PerfilCanal, b: PerfilCanal) =>
  a.canal === b.canal &&
  a.avatarUrl === b.avatarUrl &&
  a.pais === b.pais &&
  [...a.plataformas].sort().join() === [...b.plataformas].sort().join()

/**
 * Perfil del canal: la foto, el nombre que firma los clips, dónde transmite y
 * su país. El nombre es lo más delicado —es la marca de agua de cada clip—, así
 * que se valida mientras se escribe y se enseña tal como saldrá: con arroba.
 *
 * Lo guardado vive en la cuenta (`use-cuenta`), la misma que rellena el
 * onboarding: aquí solo hay un borrador mientras se edita. Sin borrador se
 * enseña lo guardado, así que un cambio desde otra pestaña o desde la
 * bienvenida aparece solo.
 */
/** La zona del navegador no cambia sola: no hay a qué suscribirse. */
const sinCambios = () => () => {}

export function ProfileSettings() {
  const t = useTranslations("settings.profile")
  const f = useFormat()
  const nombrePais = useCountryName()
  const {
    locale,
    cambiar: cambiarIdioma,
    pendiente: cambiandoIdioma,
  } = useCambiarIdioma()
  const [movimiento, setMovimiento] = useMovimiento()
  // La zona de este navegador no existe en el servidor y no cambia mientras la
  // página vive: es justo lo que `useSyncExternalStore` sabe hacer sin efectos
  const zonaNavegador = React.useSyncExternalStore(
    sinCambios,
    zonaDelNavegador,
    () => ZONA_POR_DEFECTO
  )
  // En orden alfabético del idioma activo: «España» no va en el mismo sitio que «Spain»
  const paises = [...COUNTRY_CODES].sort((a, b) =>
    nombrePais(a).localeCompare(nombrePais(b), f.locale)
  )
  const { cuenta, guardarPerfil } = useCuenta()
  const guardado = cuenta.perfilCanal
  const iniciales = inicialesDe(cuenta.nombre)
  const [borrador, setBorrador] = React.useState<PerfilCanal | null>(null)
  const perfil = borrador ?? guardado
  const setPerfil = (cambio: (p: PerfilCanal) => PerfilCanal) =>
    setBorrador((b) => cambio(b ?? guardado))
  const archivo = React.useRef<HTMLInputElement>(null)
  // Las zonas que conoce el navegador, con la de casa y la guardada siempre dentro
  const zonas = React.useMemo(() => {
    const todas = new Set(zonasDisponibles())
    todas.add(ZONA_POR_DEFECTO)
    todas.add(perfil.zona)
    return [...todas].sort()
  }, [perfil.zona])

  const errorCanal = validarCanal(perfil.canal)
  const dirty = borrador !== null && !mismos(borrador, guardado)

  // Las fotos elegidas viven como blob: al salir se liberan todas menos la guardada
  const blobs = React.useRef(new Set<string>())
  const fotoGuardada = React.useRef(guardado.avatarUrl)
  React.useEffect(() => {
    fotoGuardada.current = guardado.avatarUrl
  }, [guardado.avatarUrl])
  React.useEffect(() => {
    const vivos = blobs.current
    const foto = fotoGuardada
    return () =>
      vivos.forEach((url) => {
        if (url !== foto.current) URL.revokeObjectURL(url)
      })
  }, [])

  const elegirFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivoElegido = e.target.files?.[0]
    e.target.value = ""
    if (!archivoElegido) return
    if (!AVATAR_TIPOS.includes(archivoElegido.type)) {
      toast.error(t("photo.invalid.title"), {
        description: t("photo.invalid.description"),
      })
      return
    }
    if (archivoElegido.size > AVATAR_MAX_BYTES) {
      toast.error(t("photo.tooBig.title"), {
        description: t("photo.tooBig.description", {
          size: f.bytes(archivoElegido.size),
          max: f.bytes(AVATAR_MAX_BYTES, 0),
        }),
      })
      return
    }
    const url = URL.createObjectURL(archivoElegido)
    blobs.current.add(url)
    setPerfil((p) => ({ ...p, avatarUrl: url }))
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Una columna en móvil; con sitio, nombre y plataformas lado a lado y el
              país debajo; en pantallas grandes, las tres secciones en fila.
              `items-start`: cada columna cierra en su alto y no se estira al de la
              más larga, que dejaba 300 px muertos bajo el avatar */}
          <div className="grid items-start gap-y-6 @5xl/ajustes:grid-cols-2 @5xl/ajustes:gap-x-10 @7xl/ajustes:grid-cols-3">
            <div className="flex min-w-0 flex-col gap-6 sm:flex-row sm:items-start">
              <div className="relative w-fit shrink-0">
                <Avatar className="size-24 ring-1 ring-border">
                  {perfil.avatarUrl && (
                    <AvatarImage src={perfil.avatarUrl} alt={t("photo.alt")} />
                  )}
                  <AvatarFallback className="bg-primary text-2xl font-semibold text-primary-foreground">
                    {iniciales}
                  </AvatarFallback>
                </Avatar>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="secondary"
                  aria-label={t("photo.change")}
                  className="absolute -right-1 -bottom-1 rounded-full shadow-sm ring-2 ring-card"
                  onClick={() => archivo.current?.click()}
                >
                  <ImageUp />
                </Button>
                <input
                  ref={archivo}
                  type="file"
                  accept={AVATAR_TIPOS.join(",")}
                  className="sr-only"
                  tabIndex={-1}
                  aria-hidden
                  onChange={elegirFoto}
                />
              </div>

              <Field
                data-invalid={errorCanal ? true : undefined}
                className="min-w-0 flex-1"
              >
                <FieldLabel htmlFor="canal">{t("channel.label")}</FieldLabel>
                <InputGroup className="h-10">
                  <InputGroupAddon>
                    <InputGroupText>@</InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    id="canal"
                    className="pl-0.5"
                    value={perfil.canal}
                    maxLength={CANAL_MAX}
                    autoComplete="off"
                    spellCheck={false}
                    aria-invalid={errorCanal ? true : undefined}
                    aria-describedby="canal-ayuda"
                    onChange={(e) =>
                      setPerfil((p) => ({
                        ...p,
                        canal: e.target.value.replace(/^@+/, ""),
                      }))
                    }
                  />
                </InputGroup>
                {errorCanal ? (
                  <FieldError id="canal-ayuda">
                    {t(`channel.errors.${errorCanal.code}`, errorCanal.values)}
                  </FieldError>
                ) : (
                  <FieldDescription id="canal-ayuda">
                    {t("channel.help")}
                  </FieldDescription>
                )}
              </Field>
            </div>

            {/* El borde va fuera del fieldset: en él, la leyenda corta la línea */}
            <div className="min-w-0 border-t pt-6 @5xl/ajustes:border-t-0 @5xl/ajustes:border-l @5xl/ajustes:pt-0 @5xl/ajustes:pl-10">
              <FieldSet>
                <FieldLegend>{t("platforms.legend")}</FieldLegend>
                <FieldDescription>{t("platforms.description")}</FieldDescription>
                <ToggleGroup
                  type="multiple"
                  variant="outline"
                  size="lg"
                  spacing={2}
                  value={perfil.plataformas}
                  onValueChange={(v) =>
                    setPerfil((p) => ({ ...p, plataformas: v as PlataformaDirecto[] }))
                  }
                  className="flex-wrap"
                >
                  {PLATAFORMAS_DIRECTO.map((id) => {
                    const Icono = ICONO_PLATAFORMA[id]
                    return (
                      <ToggleGroupItem
                        key={id}
                        value={id}
                        data-sound="tap"
                        className="group/plataforma h-10 gap-2 px-3.5 data-[state=on]:border-primary data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
                      >
                        <Icono tone="official" className="size-5" aria-hidden />
                        {PLATAFORMA_LABEL[id]}
                        <Check
                          aria-hidden
                          className="hidden size-4 text-primary group-data-[state=on]/plataforma:block"
                        />
                      </ToggleGroupItem>
                    )
                  })}
                </ToggleGroup>
              </FieldSet>
            </div>

            {/* País e idioma: lado a lado cuando la sección ocupa las dos columnas,
                uno bajo otro en la tercera columna y en móvil */}
            <div className="grid min-w-0 gap-6 border-t pt-6 @5xl/ajustes:col-span-2 @5xl/ajustes:grid-cols-2 @5xl/ajustes:gap-x-10 @7xl/ajustes:col-span-1 @7xl/ajustes:grid-cols-1 @7xl/ajustes:border-t-0 @7xl/ajustes:border-l @7xl/ajustes:pt-0 @7xl/ajustes:pl-10">
              <Field className="min-w-0">
                <FieldLabel htmlFor="pais">{t("country.label")}</FieldLabel>
                <FieldDescription>{t("country.description")}</FieldDescription>
                <Select
                  value={perfil.pais}
                  onValueChange={(v) =>
                    setPerfil((p) => ({ ...p, pais: v as CountryCode }))
                  }
                >
                  <SelectTrigger
                    id="pais"
                    className="h-10 w-full sm:max-w-sm @5xl/ajustes:max-w-none"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paises.map((code) => (
                      <SelectItem key={code} value={code}>
                        <CountryFlag code={code} className="h-3.5 w-[1.125rem]" />
                        {nombrePais(code)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              {/* El idioma no pasa por «Guardar»: se aplica al elegirlo y lo recuerda la cookie */}
              <Field className="min-w-0">
                <FieldLabel htmlFor="idioma">{t("language.label")}</FieldLabel>
                <FieldDescription>{t("language.description")}</FieldDescription>
                <Select value={locale} onValueChange={(v) => cambiarIdioma(v as Locale)}>
                  <SelectTrigger
                    id="idioma"
                    aria-busy={cambiandoIdioma || undefined}
                    className="h-10 w-full sm:max-w-sm @5xl/ajustes:max-w-none"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {routing.locales.map((l) => (
                      // Cada idioma en su propio idioma: así lo encuentra quien no lee el actual
                      <SelectItem key={l} value={l} lang={LOCALE_TAG[l]}>
                        {LOCALE_NAME[l]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              {/* Zona horaria: con ella se programan las publicaciones del
                  Calendario, así que no puede depender del navegador de turno */}
              <Field className="min-w-0">
                <FieldLabel htmlFor="zona">{t("zone.label")}</FieldLabel>
                <FieldDescription>{t("zone.description")}</FieldDescription>
                <Select
                  value={perfil.zona}
                  onValueChange={(v) => setPerfil((p) => ({ ...p, zona: v }))}
                >
                  <SelectTrigger
                    id="zona"
                    className="h-10 w-full sm:max-w-sm @5xl/ajustes:max-w-none"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {zonas.map((z) => (
                      <SelectItem key={z} value={z}>
                        {ciudadDeZona(z)}
                        <span className="tabular text-muted-foreground">
                          {etiquetaZona(z, HOY_CAMPANAS)}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {perfil.zona !== zonaNavegador && (
                  <FieldDescription>
                    {t("zone.auto", { zona: ciudadDeZona(zonaNavegador) })}
                  </FieldDescription>
                )}
              </Field>

              {/* Movimiento: completo por defecto para todos; aquí se baja a
                  suave. Se aplica al momento y se recuerda en este navegador */}
              <Field className="min-w-0">
                <FieldLabel htmlFor="movimiento">{t("motion.label")}</FieldLabel>
                <FieldDescription>{t("motion.description")}</FieldDescription>
                <Select
                  value={movimiento}
                  onValueChange={(v) => setMovimiento(v as Movimiento)}
                >
                  <SelectTrigger
                    id="movimiento"
                    className="h-10 w-full sm:max-w-sm @5xl/ajustes:max-w-none"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MOVIMIENTOS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {t(`motion.options.${m}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </div>
        </CardContent>
      </Card>

      <SettingsSaveBar
        dirty={dirty}
        invalid={Boolean(errorCanal)}
        onDiscard={() => setBorrador(null)}
        onSave={() => {
          const limpio = { ...perfil, canal: perfil.canal.trim() }
          guardarPerfil(limpio)
          setBorrador(null)
          toast.success(t("saved.title"), {
            description: t("saved.description", { channel: limpio.canal }),
          })
        }}
      />
    </div>
  )
}
