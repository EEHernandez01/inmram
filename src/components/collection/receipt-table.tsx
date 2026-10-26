import Link from "next/link";
import { formatCurrency, formatDate, formatReceiptPeriodRange } from "@/lib/format";
import { ReceiptAction, ReceiptDocuments } from "./receipt-actions";
import { ReceiptBadge } from "./receipt-badge";
import type { CollectionReceipt } from "./types";

export function ReceiptTable({ canWrite, paymentDate, periodValue, receipts }: { canWrite: boolean; paymentDate: string; periodValue: string; receipts: CollectionReceipt[] }) {
  return <div className="hidden space-y-4 lg:block">
    {receipts.map((receipt) => <details className="group rounded-card border border-border bg-surface shadow-sm transition-shadow hover:shadow-md" key={receipt.id}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-5 p-5 [&::-webkit-details-marker]:hidden sm:p-6">
        <div className="min-w-0">
          <p className="truncate text-base font-bold text-ink">{receipt.contrato.unidad.propiedad.direccion} · Unidad {receipt.contrato.unidad.identificador}</p>
          <div className="mt-1 flex flex-wrap items-center gap-3"><p className="text-sm text-ink-secondary">{receipt.contrato.arrendatario}</p><ReceiptBadge status={receipt.estatus} />{receipt.contrato.unidad.propiedad.archivadaEn ? <span className="rounded-full bg-warning-soft px-2.5 py-1 text-xs font-semibold text-warning">Archivada</span> : null}</div>
        </div>
        <div className="flex shrink-0 items-center gap-5">
          <div className="text-right"><p className="text-sm font-semibold text-ink-secondary">{receipt.estatus === "REVISION" ? "Saldo por revisar" : receipt.estatus === "OMITIDO" ? "Monto omitido" : "Saldo pendiente"}</p><p className={receipt.estatus === "REVISION" || receipt.estatus === "OMITIDO" ? "mt-1 text-xl font-bold text-ink-secondary [font-variant-numeric:tabular-nums]" : receipt.saldoPendiente > 0 ? "mt-1 text-xl font-bold text-danger [font-variant-numeric:tabular-nums]" : "mt-1 text-xl font-bold text-success [font-variant-numeric:tabular-nums]"}>{formatCurrency(receipt.saldoPendiente)}</p><p className="mt-1 text-sm text-ink-secondary [font-variant-numeric:tabular-nums]">Total del recibo: {formatCurrency(receipt.total)}</p></div>
          <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center text-ink-secondary"><svg className="size-4 origin-center transition-transform duration-200 ease-out group-open:rotate-180" fill="none" viewBox="0 0 20 20"><path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" /></svg></span>
        </div>
      </summary>
      <div className="border-t border-border p-5 sm:p-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,.6fr)_minmax(190px,.75fr)_minmax(180px,1.45fr)] xl:items-start">
        <div className="min-w-0">
          <p className="text-base font-semibold text-ink">Periodo: {formatReceiptPeriodRange(receipt.periodo, receipt.periodoFin)}</p>
          <Link className="mt-3 inline-flex min-h-11 items-center text-base font-semibold text-brand hover:text-brand-hover" href={`/propiedades/${receipt.contrato.unidad.propiedadId}/unidades/${receipt.contrato.unidadId}`}>Ver inmueble y unidad</Link>
        </div>
        <div className="border-l-0 border-border xl:border-l xl:pl-6">
          <p className="text-sm font-semibold text-ink-secondary">Fecha límite de pago</p><p className="mt-1 text-base font-semibold text-ink">{formatDate(receipt.fechaVencimiento)}</p>
          {receipt.diasAtraso > 0 ? <p className="mt-1 text-base font-semibold text-danger">{receipt.diasAtraso} {receipt.diasAtraso === 1 ? "día" : "días"} de atraso</p> : null}
          {receipt.fechaPago ? <p className="mt-2 text-sm text-ink-secondary">Liquidado el {formatDate(receipt.fechaPago)} · {receipt.formaPago === "EFECTIVO" ? "Efectivo" : "Transferencia"}</p> : null}
        </div>
        <div className="rounded-xl border border-border bg-bg p-4">
          <p className="text-base font-bold text-ink">Resumen del recibo</p>
          <dl className="mt-3 grid grid-cols-3 gap-3 text-sm [font-variant-numeric:tabular-nums]">
            <div><dt className="text-ink-secondary">Total</dt><dd className="mt-1 font-semibold text-ink">{formatCurrency(receipt.total)}</dd></div>
            <div><dt className="text-ink-secondary">Pagado</dt><dd className="mt-1 font-semibold text-ink">{formatCurrency(receipt.montoPagado)}</dd></div>
            <div><dt className="font-semibold text-ink-secondary">Falta pagar</dt><dd className={receipt.saldoPendiente > 0 ? "mt-1 font-bold text-danger" : "mt-1 font-bold text-success"}>{formatCurrency(receipt.saldoPendiente)}</dd></div>
          </dl>
        </div>
      </div>
      <div className="mt-6 border-t border-border pt-5">
        <section aria-label="Documentos del recibo">
          <h3 className="mb-3 text-base font-bold text-ink">Documentos y seguimiento</h3>
          <ReceiptDocuments canWrite={canWrite && !receipt.contrato.unidad.propiedad.archivadaEn} periodValue={periodValue} receipt={receipt} />
        </section>
        <ReceiptAction canWrite={canWrite && !receipt.contrato.unidad.propiedad.archivadaEn} paymentDate={paymentDate} periodValue={periodValue} receipt={receipt} />
      </div>
      </div>
    </details>)}
  </div>;
}
