import { UserPlus } from "lucide-react"
import { useTranslations } from "next-intl"

import { Link } from "@/i18n/navigation"
import type { ReferralStats } from "@/lib/admin/metrics"
import { conMes } from "@/lib/admin/enlaces"
import { useFormat } from "@/hooks/use-format"
import { PlanBadge } from "@/components/admin/plan-badge"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

/**
 * Quién invita y con qué resultado: invitados, cuántos activan, cuántos pagan
 * y lo que han ingresado. Cinco filas como máximo, ordenadas por convertidos;
 * con un programa pequeño cada invitador tiene nombre.
 */
export function ReferidosInvitadores({
  items,
  mes,
}: {
  items: ReferralStats["topReferrers"]
  /** El mes elegido en el backoffice, para que los enlaces no lo pierdan. */
  mes?: string | null
}) {
  const t = useTranslations("admin.referidos.referrers")
  const f = useFormat()

  if (items.length === 0) {
    return (
      <Empty className="py-10">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <UserPlus />
          </EmptyMedia>
          <EmptyTitle>{t("emptyTitle")}</EmptyTitle>
          <EmptyDescription>{t("emptyDescription")}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-border">
      <Table>
        <caption className="sr-only">{t("caption")}</caption>
        <TableHeader>
          <TableRow>
            <TableHead>{t("referrer")}</TableHead>
            <TableHead className="text-right">{t("invitees")}</TableHead>
            <TableHead className="text-right">{t("activated")}</TableHead>
            <TableHead className="text-right">{t("converted")}</TableHead>
            <TableHead className="text-right">{t("revenue")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="tabular-nums">
          {items.map((row) => (
            <TableRow key={row.userId}>
              <TableCell className="max-w-56">
                <div className="flex min-w-0 items-center gap-2">
                  <Link
                    href={conMes(
                      `/admin/usuarios?q=${encodeURIComponent(row.name)}`,
                      mes
                    )}
                    className="truncate font-medium underline-offset-4 hover:text-primary hover:underline"
                  >
                    {row.name}
                  </Link>
                  <PlanBadge plan={row.plan} />
                </div>
              </TableCell>
              <TableCell className="text-right font-medium">{row.invitados}</TableCell>
              <Celda n={row.activados} total={row.invitados} />
              <Celda n={row.convertidos} total={row.invitados} />
              <TableCell className="text-right">
                {row.ingreso > 0 ? (
                  f.money(row.ingreso)
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function Celda({ n, total }: { n: number; total: number }) {
  const f = useFormat()
  return (
    <TableCell className="text-right whitespace-nowrap">
      {n}
      {total > 0 && (
        <span className="ml-1 text-[11px] text-muted-foreground">
          {f.percent((n / total) * 100, 0)}
        </span>
      )}
    </TableCell>
  )
}
