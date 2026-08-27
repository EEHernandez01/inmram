import Link from "next/link";

import { formatCurrency, formatDate } from "@/lib/format";

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
    <article className="rounded-card border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Link
            className="font-semibold text-brand hover:text-brand-hover"
            href={`/propiedades/${receipt.contrato.unidad.propiedadId}/unidades/${receipt.contrato.unidadId}`}
          >
            {receipt.contrato.unidad.propiedad.direccion}
          </Link>
          <p className="mt-1 text-xs text-ink-secondary">
            Unidad {receipt.contrato.unidad.identificador}
          </p>
        </div>
        <ReceiptBadge status={receipt.estatus} />
      </div>

      <p className="mt-4 text-sm font-semibold text-ink">
        {receipt.contrato.arrendatario}
      </p>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div>
          <dt className="text-xs text-ink-secondary">Vencimiento</dt>
          <dd className="mt-1 text-ink">{formatDate(receipt.fechaVencimiento)}</dd>
          {receipt.diasAtraso > 0 ? (
            <dd className="mt-1 text-xs text-danger">
              {receipt.diasAtraso} días de atraso
            </dd>
          ) : null}
        </div>
        <div className="text-right">
          <dt className="text-xs text-ink-secondary">Renta</dt>
          <dd className="mt-1 font-semibold text-ink [font-variant-numeric:tabular-nums]">
            {formatCurrency(receipt.monto)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-ink-secondary">Servicios (incluye agua)</dt>
          <dd className="mt-1 text-ink [font-variant-numeric:tabular-nums]">
            {formatCurrency(receipt.cargoFijo)}
          </dd>
        </div>
        <div className="text-right">
          <dt className="text-xs text-ink-secondary">Total</dt>
          <dd className="mt-1 font-semibold text-ink [font-variant-numeric:tabular-nums]">
            {formatCurrency(receipt.total)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-ink-secondary">Pagado</dt>
          <dd className="mt-1 text-ink [font-variant-numeric:tabular-nums]">{formatCurrency(receipt.montoPagado)}</dd>
        </div>
        <div className="text-right">
          <dt className="text-xs text-ink-secondary">Saldo</dt>
          <dd className={receipt.saldoPendiente > 0 ? "mt-1 font-semibold text-danger [font-variant-numeric:tabular-nums]" : "mt-1 font-semibold text-success [font-variant-numeric:tabular-nums]"}>{formatCurrency(receipt.saldoPendiente)}</dd>
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
          canWrite={canWrite}
          periodValue={periodValue}
          receipt={receipt}
        />
        <ReceiptAction
          canWrite={canWrite}
          mobile
          paymentDate={paymentDate}
          periodValue={periodValue}
          receipt={receipt}
        />
      </div>
    </article>
  );
}
