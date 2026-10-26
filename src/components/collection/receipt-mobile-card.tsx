import Link from "next/link";

import { formatCurrency, formatDate, formatReceiptPeriodRange } from "@/lib/format";

import { ReceiptAction, ReceiptDocuments } from "./receipt-actions";
import { ReceiptBadge } from "./receipt-badge";
import type { CollectionReceipt } from "./types";

export function ReceiptMobileCard({
  canWrite,
  paymentDate,
  periodValue,
  receipt,
}: {
  canWrite: boolean;
  paymentDate: string;
  periodValue: string;
  receipt: CollectionReceipt;
}) {
  return (
    <details className="group rounded-card border border-border bg-surface">
      <summary className="cursor-pointer list-none p-5 [&::-webkit-details-marker]:hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink">{receipt.contrato.unidad.propiedad.direccion} · Unidad {receipt.contrato.unidad.identificador}</p>
            <p className="mt-1 truncate text-sm text-ink-secondary">{receipt.contrato.arrendatario}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2"><ReceiptBadge status={receipt.estatus} /><span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center text-ink-secondary"><svg className="size-4 origin-center transition-transform duration-200 ease-out group-open:rotate-180" fill="none" viewBox="0 0 20 20"><path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" /></svg></span></div>
        </div>
        <div className="mt-4 flex items-end justify-between border-t border-border pt-3"><div><p className="text-sm font-semibold text-ink-secondary">{receipt.estatus === "REVISION" ? "Saldo por revisar" : receipt.estatus === "OMITIDO" ? "Monto omitido" : "Saldo pendiente"}</p><p className={receipt.estatus === "REVISION" || receipt.estatus === "OMITIDO" ? "mt-1 text-lg font-bold text-ink-secondary [font-variant-numeric:tabular-nums]" : receipt.saldoPendiente > 0 ? "mt-1 text-lg font-bold text-danger [font-variant-numeric:tabular-nums]" : "mt-1 text-lg font-bold text-success [font-variant-numeric:tabular-nums]"}>{formatCurrency(receipt.saldoPendiente)}</p></div><p className="text-right text-sm text-ink-secondary">Total del recibo<br/><span className="font-semibold text-ink [font-variant-numeric:tabular-nums]">{formatCurrency(receipt.total)}</span></p></div>
      </summary>
      <div className="border-t border-border p-5">
      {receipt.contrato.unidad.propiedad.archivadaEn ? <span className="inline-flex rounded-full bg-warning-soft px-2.5 py-1 text-xs font-semibold text-warning">Propiedad archivada</span> : null}
      <Link className="inline-flex min-h-11 items-center font-semibold text-brand hover:text-brand-hover" href={`/propiedades/${receipt.contrato.unidad.propiedadId}/unidades/${receipt.contrato.unidadId}`}>Ver inmueble y unidad</Link>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div className="col-span-2">
          <dt className="text-sm font-semibold text-ink-secondary">Periodo</dt>
          <dd className="mt-1 text-base text-ink">{formatReceiptPeriodRange(receipt.periodo, receipt.periodoFin)}</dd>
        </div>
        <div>
          <dt className="text-sm font-semibold text-ink-secondary">Fecha límite</dt>
          <dd className="mt-1 text-base text-ink">{formatDate(receipt.fechaVencimiento)}</dd>
          {receipt.diasAtraso > 0 ? (
            <dd className="mt-1 text-sm font-semibold text-danger">
              {receipt.diasAtraso} días de atraso
            </dd>
          ) : null}
        </div>
        <div className="text-right">
          <dt className="text-sm font-semibold text-ink-secondary">Renta</dt>
          <dd className="mt-1 text-base font-semibold text-ink [font-variant-numeric:tabular-nums]">
            {formatCurrency(receipt.monto)}
          </dd>
        </div>
        <div className="text-right">
          <dt className="text-sm font-semibold text-ink-secondary">Total del recibo</dt>
          <dd className="mt-1 text-base font-semibold text-ink [font-variant-numeric:tabular-nums]">
            {formatCurrency(receipt.total)}
          </dd>
        </div>
        <div>
          <dt className="text-sm font-semibold text-ink-secondary">Pagado</dt>
          <dd className="mt-1 text-base text-ink [font-variant-numeric:tabular-nums]">{formatCurrency(receipt.montoPagado)}</dd>
        </div>
        <div className="text-right">
          <dt className="text-sm font-semibold text-ink-secondary">Falta pagar</dt>
          <dd className={receipt.saldoPendiente > 0 ? "mt-1 text-base font-semibold text-danger [font-variant-numeric:tabular-nums]" : "mt-1 text-base font-semibold text-success [font-variant-numeric:tabular-nums]"}>{formatCurrency(receipt.saldoPendiente)}</dd>
        </div>
      </dl>

      {receipt.fechaPago ? (
        <p className="mt-4 text-xs text-ink-secondary">
          Liquidado el {formatDate(receipt.fechaPago)} ·{" "}
          {receipt.formaPago === "EFECTIVO" ? "Efectivo" : "Transferencia"}
        </p>
      ) : null}

      <div className="mt-5 border-t border-border pt-4">
        <ReceiptDocuments
          canWrite={canWrite && !receipt.contrato.unidad.propiedad.archivadaEn}
          periodValue={periodValue}
          receipt={receipt}
        />
        <ReceiptAction
          canWrite={canWrite && !receipt.contrato.unidad.propiedad.archivadaEn}
          mobile
          paymentDate={paymentDate}
          periodValue={periodValue}
          receipt={receipt}
        />
      </div>
      </div>
    </details>
  );
}
