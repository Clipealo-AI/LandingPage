"use client"

import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"

import { usePathname, useRouter } from "@/i18n/navigation"
import { useFormat } from "@/hooks/use-format"
import type { MonthKey } from "@/lib/admin/types"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface MonthPickerProps {
  months: MonthKey[]
  value: MonthKey
  current: MonthKey
}

/**
 * Selector de mes. Escribe `?mes=AAAA-MM` en la URL y la página, que es un
 * componente de servidor, recalcula la instantánea: los números nunca viajan
 * al navegador más allá de lo que se pinta.
 */
export function MonthPicker({ months, value, current }: MonthPickerProps) {
  const t = useTranslations("admin.monthPicker")
  const f = useFormat()
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const cambiar = (mes: string) => {
    const next = new URLSearchParams(params.toString())
    if (mes === current) next.delete("mes")
    else next.set("mes", mes)
    const qs = next.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  return (
    <Select value={value} onValueChange={cambiar}>
      <SelectTrigger size="sm" className="w-52" aria-label={t("label")}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {[...months].reverse().map((m) => (
          <SelectItem key={m} value={m}>
            {m === current
              ? t("today", { mes: f.month(m, { capital: true }) })
              : f.month(m, { capital: true })}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
