import type { ReactNode } from "react"
import { useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"
import type { DormidosBlock } from "@/lib/admin/metrics"
import { conMes } from "@/lib/admin/enlaces"
import { useFormat } from "@/hooks/use-format"
import { MockAction } from "@/components/admin/mock-action"
import { usePlanName } from "@/components/admin/textos"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

/**
 * Dormidos y ex-pagantes reactivables: activaron alguna vez, llevan entre 30
 * y 180 días sin entrar y hoy no pagan. Ex-pagantes primero: si vuelven, el
 * churn era de precio o cobro, no de producto.
 */
export function UsuariosDormidos({
  block,
  hoy,
  mes,
}: {
  block: DormidosBlock
  hoy: string
  mes?: string | null
}) {
  const t = useTranslations("admin.usuarios.dormant")
  const tLabels = useTranslations("admin.labels")
  const tTable = useTranslations("admin.table")
  const f = useFormat()
  const planName = usePlanName()
  const hoyDate = new Date(hoy)
  const strong = (chunks: ReactNode) => (
    <strong className="text-foreground">{chunks}</strong>
  )
  const enlace = (segmento: string) => {
    const EnlaceSegmento = (chunks: ReactNode) => (
      <Link
        href={conMes(`/admin/usuarios?segmento=${segmento}`, mes)}
        className="text-primary underline-offset-4 hover:underline"
      >
        {chunks}
      </Link>
    )
    return EnlaceSegmento
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground tabular-nums">
        {t.rich("summary", {
          b: strong,
          ex: enlace("ex-pagante"),
          dormido: enlace("dormido"),
          n: f.number(block.n),
          exPagantes: block.exPagantes,
          activados: block.freeActivados,
          listados: block.listados,
        })}
      </p>
      <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-border">
        <Table className="text-xs sm:text-sm">
          <caption className="sr-only">{t("caption")}</caption>
          <TableHeader>
            <TableRow>
              <TableHead>{t("user")}</TableHead>
              <TableHead>{t("type")}</TableHead>
              <TableHead className="text-right">{t("paid")}</TableHead>
              <TableHead className="text-right">{t("minutes")}</TableHead>
              <TableHead className="max-md:hidden">{t("lastActivity")}</TableHead>
              <TableHead className="text-right">
                <span className="sr-only">{tTable("actions")}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="tabular-nums">
            {block.items.map((row) => (
              <TableRow key={row.userId}>
                <TableCell className="max-w-52">
                  <Link
                    href={conMes(
                      `/admin/usuarios?q=${encodeURIComponent(row.userName)}`,
                      mes
                    )}
                    className="block truncate font-medium underline-offset-4 hover:text-primary hover:underline"
                  >
                    {row.userName}
                  </Link>
                  <span className="block truncate text-xs text-muted-foreground">
                    {planName(row.plan)}
                    {row.fuentePrincipal &&
                      ` · ${tLabels(`source.${row.fuentePrincipal}`)}`}
                    {` · ${t("projects", { n: row.proyectos })}`}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={row.exPagante ? "secondary" : "outline"}>
                    {row.exPagante ? t("formerPayer") : t("activatedOnTrial")}
                  </Badge>
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {row.totalPaid > 0 ? (
                    f.money(row.totalPaid)
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {f.number(Math.round(row.minutos))}
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground max-md:hidden">
                  {f.relative(row.lastActiveAt, hoyDate)}
                </TableCell>
                <TableCell className="text-right">
                  <MockAction
                    size="sm"
                    variant="ghost"
                    efecto={
                      row.exPagante
                        ? t("contactEffectOffer", { nombre: row.userName })
                        : t("contactEffect", { nombre: row.userName })
                    }
                  >
                    {t("contact")}
                  </MockAction>
                </TableCell>
              </TableRow>
            ))}
            {block.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  {t("empty")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">{t("note")}</p>
    </div>
  )
}
