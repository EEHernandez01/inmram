import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/format";
import { ReceiptAction, ReceiptDocuments } from "./receipt-actions";
import { ReceiptBadge } from "./receipt-badge";
import type { CollectionReceipt } from "./types";

export function ReceiptTable({ canWrite, paymentDate, periodValue, receipts }: { canWrite: boolean; paymentDate: string; periodValue: string; receipts: CollectionReceipt[] }) {
  return <div className="hidden space-y-4 lg:block">
    {receipts.map((receipt) => <article className="rounded-card border border-border bg-surface p-6 shadow-sm transition-shadow hover:shadow-md" key={receipt.id}>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(190px,.75fr)_minmax(180px,.6fr)] xl:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3"><p className="text-base font-bold text-ink">{receipt.contrato.arrendatario}</p><ReceiptBadge status={receipt.estatus} /></div>
          <Link className="mt-2 inline-block text-sm font-semibold text-brand hover:text-brand-hover" href={`/propiedades/${receipt.contrato.unidad.propiedadId}/unidades/${receipt.contrato.unidadId}`}>{receipt.contrato.unidad.propiedad.direccion} · Unidad {receipt.contrato.unidad.identificador}</Link>
        </div>
        <div className="border-l-0 border-border xl:border-l xl:pl-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-secondary">Vencimiento</p><p className="mt-1 text-sm font-semibold text-ink">{formatDate(receipt.fechaVencimiento)}</p>
          {receipt.diasAtraso > 0 ? <p className="mt-1 text-sm font-semibold text-danger">{receipt.diasAtraso} {receipt.diasAtraso === 1 ? "día" : "días"} de atraso</p> : null}
          {receipt.fechaPago ? <p className="mt-2 text-xs text-ink-secondary">Pagado el {formatDate(receipt.fechaPago)} · {receipt.formaPago === "EFECTIVO" ? "Efectivo" : "Transferencia"}</p> : null}
        </div>
        <div className="border-l-0 border-border text-left xl:border-l xl:pl-6 xl:text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-secondary">Total a cobrar</p><p className="mt-1 text-2xl font-bold tracking-tight text-ink [font-variant-numeric:tabular-nums]">{formatCurrency(receipt.total)}</p>
          <p className="mt-1 text-xs text-ink-secondary [font-variant-numeric:tabular-nums]">Renta {formatCurrency(receipt.monto)}{receipt.cargoAgua !== null ? ` · Agua ${formatCurrency(receipt.cargoAgua)}` : ""}</p>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-4 border-t border-border pt-5">
        <div><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-secondary">Documentos y seguimiento</p><ReceiptDocuments canWrite={canWrite} periodValue={periodValue} receipt={receipt} /></div>
        <div className="min-w-[330px]"><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-secondary">Registrar movimiento</p><ReceiptAction canWrite={canWrite} paymentDate={paymentDate} periodValue={periodValue} receipt={receipt} /></div>
      </div>
    </article>)}
  </div>;
}
