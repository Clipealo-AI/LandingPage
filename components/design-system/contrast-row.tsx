"use client"

import { useTranslations } from "next-intl"

import { Badge } from "@/components/ui/badge"

/*
 * Aparte de los demás primitivos porque es el único que traduce: quien importe
 * `Swatch` o `DsCanvas` —la wiki, por ejemplo— no tiene por qué arrastrar los
 * textos del sistema de diseño.
 */

/** Par semantico con su ratio de contraste medido y su veredicto WCAG. */
export function ContrastRow({
  label,
  fg,
  bg,
  ratio,
  sample,
}: {
  label: string
  fg: string
  bg: string
  ratio: number
  sample?: string
}) {
  const t = useTranslations("designSystem.contrast")
  const verdict =
    ratio >= 7 ? "aaa" : ratio >= 4.5 ? "aa" : ratio >= 3 ? "aaLarge" : "fail"
  const variant = ratio >= 4.5 ? "success" : ratio >= 3 ? "warning" : "destructive"

  return (
    <div className="flex items-center gap-3 py-2">
      <span
        className="grid h-10 w-32 shrink-0 place-items-center rounded-md text-xs font-medium ring-1 ring-border"
        style={{ background: `var(${bg})`, color: `var(${fg})` }}
      >
        {sample ?? t("sample")}
      </span>
      <span className="min-w-0 flex-1 truncate text-xs">{label}</span>
      <span className="text-xs font-semibold tabular-nums">{ratio.toFixed(2)}:1</span>
      <Badge variant={variant} className="w-20 justify-center">
        {t(`verdict.${verdict}`)}
      </Badge>
    </div>
  )
}
