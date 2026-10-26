import Link from "next/link";

import { calculateOverdueDays } from "@/lib/calculations/collection";
import { formatCurrency, formatDate } from "@/lib/format";
import type { listarCobranzaMensual } from "@/lib/services/collection";

type Receipt = Awaited<ReturnType<typeof listarCobranzaMensual>>["receipts"][number];

export function CollectionFollowUp({
  collectionHref,
  currentDate,
  hasReceipts,
  pendingPayments,
}: {
  collectionHref: string;
  currentDate: Date;
  hasReceipts: boolean;
  pendingPayments: Receipt[];
}) {
  const overduePayments = pendingPayments.filter(
    (receipt) => receipt.estatus === "VENCIDO",
  );
  const dueSoonPayments = pendingPayments.filter(
    (receipt) => receipt.estatus !== "VENCIDO",
  );
  const visibleOverduePayments = overduePayments.slice(0, 4);
  const visibleDueSoonPayments = dueSoonPayments.slice(
    0,
    Math.max(0, 4 - visibleOverduePayments.length),
  );

  return (
    <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-[.1em] text-brand">Seguimiento</p>
          <h2 className="mt-1 font-serif text-2xl font-semibold text-ink">Pagos pendientes</h2>
        </div>
        {pendingPayments.length > 0 ? <span className="rounded-full bg-warning-soft px-3 py-1.5 text-sm font-bold text-warning">{pendingPayments.length} pendientes</span> : null}
      </div>

      {pendingPayments.length === 0 ? (
        hasReceipts ? (
          <p className="mt-5 text-base leading-7 text-ink-secondary">La cobranza va al corriente. No hay saldos pendientes en este periodo.</p>
        ) : (
          <div className="mt-5 rounded-xl border border-dashed border-border p-4">
            <p className="text-base font-semibold text-ink">Aún no hay recibos para este periodo.</p>
            <p className="mt-1 text-base leading-7 text-ink-secondary">Abre la cobranza del mes para consultar o generar los recibos.</p>
            <Link className="mt-3 inline-flex min-h-11 items-center text-base font-bold text-brand hover:text-brand-hover" href={collectionHref}>Abrir cobranza <span aria-hidden="true" className="ml-1">→</span></Link>
          </div>
        )
      ) : (
        <div className="mt-5 space-y-5">
          {overduePayments.length > 0 ? (
            <div>
              <h3 className="mb-1 flex items-center justify-between text-sm font-bold text-danger">
                <span>Vencidos</span><span>{overduePayments.length}</span>
              </h3>
              <ul className="divide-y divide-border">
                {visibleOverduePayments.map((receipt) => {
                  const daysOverdue = calculateOverdueDays(currentDate, receipt.fechaVencimiento);
                  return (
                    <li key={receipt.id}>
                      <Link className="flex min-h-16 items-center justify-between gap-3 py-3" href={`${collectionHref}&estatus=${receipt.estatus}`}>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-ink">{receipt.contrato.arrendatario}</p>
                          <p className="mt-1 truncate text-xs text-ink-secondary">{receipt.contrato.unidad.propiedad.direccion} · Unidad {receipt.contrato.unidad.identificador}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="inline-flex rounded-full bg-danger-soft px-2 py-1 text-xs font-bold text-danger">Vencido hace {daysOverdue} {daysOverdue === 1 ? "día" : "días"}</span>
                          <p className="mt-1 text-sm text-ink-secondary">Venció {formatDate(receipt.fechaVencimiento)}</p>
                          <p className="mt-1 text-sm font-bold text-ink [font-variant-numeric:tabular-nums]">{formatCurrency(receipt.saldoPendiente)}</p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}

          {dueSoonPayments.length > 0 && visibleDueSoonPayments.length > 0 ? (
            <div>
              <h3 className="mb-1 flex items-center justify-between text-sm font-bold text-ink-secondary">
                <span>Por vencer</span><span>{dueSoonPayments.length}</span>
              </h3>
              <ul className="divide-y divide-border">
                {visibleDueSoonPayments.map((receipt) => (
                  <li key={receipt.id}>
                    <Link className="flex min-h-16 items-center justify-between gap-3 py-3" href={`${collectionHref}&estatus=${receipt.estatus}`}>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-ink">{receipt.contrato.arrendatario}</p>
                        <p className="mt-1 truncate text-xs text-ink-secondary">{receipt.contrato.unidad.propiedad.direccion} · Unidad {receipt.contrato.unidad.identificador}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="inline-flex rounded-full bg-warning-soft px-2 py-1 text-xs font-bold text-warning">Vence {formatDate(receipt.fechaVencimiento)}</span>
                        <p className="mt-1 text-sm font-bold text-ink [font-variant-numeric:tabular-nums]">{formatCurrency(receipt.saldoPendiente)}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {pendingPayments.length > 4 ? <Link className="inline-flex min-h-11 items-center text-base font-bold text-brand hover:text-brand-hover" href={collectionHref}>Ver todos los pagos pendientes <span aria-hidden="true" className="ml-1">→</span></Link> : null}
        </div>
      )}
    </section>
  );
}
