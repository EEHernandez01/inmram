import Link from "next/link";

import { formatCurrency, formatDate } from "@/lib/format";

import { ReceiptAction, ReceiptDocuments } from "./receipt-actions";
import { ReceiptBadge } from "./receipt-badge";
import type { CollectionReceipt } from "./types";

export function ReceiptTable({
  canWrite,
  paymentDate,
  periodValue,
  receipts,
}: {
  canWrite: boolean;
  paymentDate: string;
  periodValue: string;
  receipts: CollectionReceipt[];
}) {
  return (
    <div className="hidden overflow-x-auto rounded-card border border-border bg-surface lg:block">
      <table className="w-full min-w-[1380px] text-left text-sm">
        <caption className="sr-only">
          Recibos de cobranza del periodo {periodValue}
        </caption>
        <thead className="border-b border-border text-xs font-semibold uppercase tracking-wide text-ink-secondary">
          <tr>
            <th className="px-5 py-3" scope="col">Propiedad / unidad</th>
            <th className="px-5 py-3" scope="col">Arrendatario</th>
            <th className="px-5 py-3" scope="col">Vencimiento</th>
            <th className="px-5 py-3" scope="col">Estatus</th>
            <th className="px-5 py-3 text-right" scope="col">Renta</th>
            <th className="px-5 py-3 text-right" scope="col">Agua</th>
            <th className="px-5 py-3 text-right" scope="col">Total</th>
            <th className="px-5 py-3" scope="col">Acción</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {receipts.map((receipt) => (
            <tr className="align-top hover:bg-bg/50" key={receipt.id}>
              <td className="px-5 py-4">
                <Link
                  className="font-semibold text-brand hover:text-brand-hover"
                  href={`/propiedades/${receipt.contrato.unidad.propiedadId}/unidades/${receipt.contrato.unidadId}`}
                >
                  {receipt.contrato.unidad.propiedad.direccion} ·{" "}
                  {receipt.contrato.unidad.identificador}
                </Link>
              </td>
              <td className="px-5 py-4 text-ink">{receipt.contrato.arrendatario}</td>
              <td className="px-5 py-4 text-ink-secondary">
                {formatDate(receipt.fechaVencimiento)}
                {receipt.diasAtraso > 0 ? (
                  <span className="mt-1 block text-xs text-danger">
                    {receipt.diasAtraso} días de atraso
                  </span>
                ) : null}
              </td>
              <td className="px-5 py-4">
                <ReceiptBadge status={receipt.estatus} />
                {receipt.fechaPago ? (
                  <span className="mt-1 block text-xs text-ink-secondary">
                    {formatDate(receipt.fechaPago)} ·{" "}
                    {receipt.formaPago === "EFECTIVO" ? "Efectivo" : "Transferencia"}
                  </span>
                ) : null}
              </td>
              <td className="px-5 py-4 text-right font-semibold text-ink [font-variant-numeric:tabular-nums]">
                {formatCurrency(receipt.monto)}
              </td>
              <td className="px-5 py-4 text-right text-ink [font-variant-numeric:tabular-nums]">
                {receipt.cargoAgua === null ? "—" : formatCurrency(receipt.cargoAgua)}
              </td>
              <td className="px-5 py-4 text-right font-semibold text-ink [font-variant-numeric:tabular-nums]">
                {formatCurrency(receipt.total)}
              </td>
              <td className="px-5 py-4">
                <ReceiptDocuments
                  canWrite={canWrite}
                  periodValue={periodValue}
                  receipt={receipt}
                />
                <ReceiptAction
                  canWrite={canWrite}
                  paymentDate={paymentDate}
                  periodValue={periodValue}
                  receipt={receipt}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
