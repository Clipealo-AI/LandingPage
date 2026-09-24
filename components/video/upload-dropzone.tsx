"use client"

import * as React from "react"
import {
  CircleAlert,
  CircleCheck,
  FileVideo,
  Link2,
  Pause,
  Play,
  RotateCcw,
  UploadCloud,
  X,
} from "lucide-react"
import { useTranslations } from "next-intl"

import { cn } from "@/lib/utils"
import { shake } from "@/lib/effects"
import { playSound } from "@/lib/sound"
import { uploadProgress, type UploadItem } from "@/lib/types"
import { useFormat } from "@/hooks/use-format"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { CropFrame } from "@/components/brand/logo"

const ACCEPTED = ["video/mp4", "video/quicktime", "video/webm", "video/x-matroska"]
const MAX_BYTES = 8 * 1024 ** 3 // 8 GB

/** Por qué se rechaza un archivo; el texto lo pone el componente en su idioma. */
interface UploadProblem {
  code: "invalidType" | "tooBig"
  name: string
}

// `onPause` y `onResume` colisionan con handlers DOM del mismo nombre
export interface UploadDropzoneProps extends Omit<
  React.ComponentProps<"div">,
  "onChange" | "onPause" | "onResume"
> {
  /**
   * Cola de subida. El progreso es por archivo: con varios videos grandes, un
   * porcentaje único no dice cuál va lento ni cuál ha fallado.
   */
  items?: UploadItem[]
  onFiles?: (files: File[]) => void
  onUrl?: (url: string) => void
  onPause?: (id: string) => void
  onResume?: (id: string) => void
  onRetry?: (id: string) => void
  onRemove?: (id: string) => void
  disabled?: boolean
  /**
   * Cómo se pinta «Seleccionar archivos». En una página que existe para subir
   * es la acción naranja; dentro de un formulario más grande la naranja es la
   * de guardar, y esta pasa a segundo plano: solo una por vista.
   */
  accion?: "brand" | "outline"
}

/**
 * Zona de subida.
 *
 * Al arrastrar encima aparecen las esquinas de recorte: el gesto de la marca
 * aplicado al momento en que el usuario «encuadra» su video dentro del producto.
 */
export function UploadDropzone({
  items = [],
  onFiles,
  onUrl,
  onPause,
  onResume,
  onRetry,
  onRemove,
  disabled,
  accion = "brand",
  className,
  ...props
}: UploadDropzoneProps) {
  const t = useTranslations("common.video.upload")
  const f = useFormat()
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = React.useState(false)
  const [error, setError] = React.useState<UploadProblem | null>(null)
  const zona = React.useRef<HTMLDivElement>(null)
  const [url, setUrl] = React.useState("")
  const dragDepth = React.useRef(0)

  const limit = f.bytes(MAX_BYTES, 0)

  const validate = (files: File[]): UploadProblem | null => {
    const invalid = files.find((file) => !ACCEPTED.includes(file.type))
    if (invalid) return { code: "invalidType", name: invalid.name }
    const tooBig = files.find((file) => file.size > MAX_BYTES)
    if (tooBig) return { code: "tooBig", name: tooBig.name }
    return null
  }

  const importar = () => {
    if (!url.trim()) return
    onUrl?.(url.trim())
    setUrl("")
  }

  const accept = (files: File[]) => {
    if (!files.length) return
    const problem = validate(files)
    setError(problem)
    if (problem) {
      // Un «no» que se oye y se ve, además del mensaje
      playSound("error")
      shake(zona.current)
      return
    }
    onFiles?.(files)
  }

  // dragenter/dragleave también disparan al cruzar hijos: contamos profundidad
  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    dragDepth.current += 1
    if (!disabled) setDragging(true)
  }
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    dragDepth.current -= 1
    if (dragDepth.current <= 0) setDragging(false)
  }
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    dragDepth.current = 0
    setDragging(false)
    if (disabled) return
    accept(Array.from(e.dataTransfer.files))
  }

  return (
    <div className={cn("flex flex-col gap-3", className)} {...props}>
      <CropFrame size="md" active={dragging}>
        <div
          ref={zona}
          onDragEnter={onDragEnter}
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={cn(
            "relative flex flex-col items-center justify-center gap-3 rounded-frame border-2 border-dashed px-6 py-12 text-center transition-colors duration-200 sm:py-16",
            dragging ? "border-brand bg-brand-subtle/40" : "border-border bg-card",
            disabled && "pointer-events-none opacity-60"
          )}
        >
          <span
            className={cn(
              "grid size-14 place-items-center rounded-2xl transition-colors",
              dragging
                ? "bg-brand text-brand-foreground"
                : "bg-secondary text-secondary-foreground"
            )}
          >
            <UploadCloud className="size-6" aria-hidden />
          </span>

          <div className="space-y-1">
            <p className="font-semibold">
              {dragging ? t("dropHere") : t("dragOrUpload")}
            </p>
            <p className="text-sm text-balance text-muted-foreground">
              {t("hint", { limit })}
            </p>
          </div>

          <Button
            type="button"
            variant={accion}
            size="lg"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
          >
            {t("select")}
          </Button>

          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED.join(",")}
            multiple
            className="sr-only"
            aria-label={t("selectLabel")}
            onChange={(e) => {
              accept(Array.from(e.target.files ?? []))
              e.target.value = "" // permite volver a elegir el mismo archivo
            }}
          />
        </div>
      </CropFrame>

      {onUrl && (
        // Un `div`, no un `form`: esta zona se usa dentro de formularios —el
        // alta de una clase en el panel— y un formulario dentro de otro es
        // HTML inválido que el navegador deshace al leerlo
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Link2
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                // Sin formulario, el Enter hay que atenderlo aquí
                if (e.key === "Enter") {
                  e.preventDefault()
                  importar()
                }
              }}
              placeholder={t("urlPlaceholder")}
              aria-label={t("urlLabel")}
              className="pl-9"
              disabled={disabled}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={!url.trim() || disabled}
            onClick={importar}
          >
            {t("import")}
          </Button>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {t(error.code, { name: error.name, limit })}
        </p>
      )}

      {items.length > 0 && (
        <ul className="space-y-2" aria-label={t("queue")}>
          {items.map((item) => (
            <UploadRow
              key={item.id}
              item={item}
              onPause={onPause}
              onResume={onResume}
              onRetry={onRetry}
              onRemove={onRemove}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

function UploadRow({
  item,
  onPause,
  onResume,
  onRetry,
  onRemove,
}: {
  item: UploadItem
  onPause?: (id: string) => void
  onResume?: (id: string) => void
  onRetry?: (id: string) => void
  onRemove?: (id: string) => void
}) {
  const t = useTranslations("common.video.upload")
  const f = useFormat()
  const progress = uploadProgress(item)
  const done = item.status === "completado"
  const failed = item.status === "error"

  return (
    <li className="flex items-center gap-3 rounded-lg bg-card p-3 ring-1 ring-border">
      <span className="shrink-0" aria-hidden>
        {done ? (
          <CircleCheck className="size-4 text-success" />
        ) : failed ? (
          <CircleAlert className="size-4 text-destructive" />
        ) : (
          <FileVideo className="size-4 text-muted-foreground" />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.name}</p>
        <p className="text-xs text-muted-foreground tabular-nums">
          {t("progress", {
            uploaded: f.bytes(item.uploadedBytes),
            total: f.bytes(item.size),
          })}{" "}
          · {failed ? (item.error ?? t("status.error")) : t(`status.${item.status}`)}
          {!done && !failed && ` · ${f.percent(Math.round(progress))}`}
        </p>
        {!done && (
          <Progress
            value={progress}
            className={cn(
              "mt-2 h-1",
              failed && "[&_[data-slot=progress-indicator]]:bg-destructive"
            )}
          />
        )}
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        {item.status === "subiendo" && onPause && (
          <RowAction label={t("pause")} onClick={() => onPause(item.id)}>
            <Pause />
          </RowAction>
        )}
        {item.status === "pausado" && onResume && (
          <RowAction label={t("resume")} onClick={() => onResume(item.id)}>
            <Play />
          </RowAction>
        )}
        {failed && onRetry && (
          <RowAction label={t("retry")} onClick={() => onRetry(item.id)}>
            <RotateCcw />
          </RowAction>
        )}
        {onRemove && (
          <RowAction
            label={t("remove", { name: item.name })}
            onClick={() => onRemove(item.id)}
          >
            <X />
          </RowAction>
        )}
      </div>
    </li>
  )
}

function RowAction({
  label,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon-xs" aria-label={label} {...props}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
