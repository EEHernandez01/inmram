import { EstadoRecibo } from "@/generated/prisma/enums";
import { ConfirmSubmitButton } from "@/components/forms/confirm-submit-button";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/format";

import type { CollectionReceipt } from "./types";

type ReceiptActionProps = {
  canWrite: boolean;
  mobile?: boolean;
  paymentDate: string;
  periodValue: string;
  receipt: CollectionReceipt;
};

function PaymentHistory({
  canWrite,
  periodValue,
  receipt,
}: Pick<ReceiptActionProps, "canWrite" | "periodValue" | "receipt">) {
  if (receipt.pagos.length === 0) return null;

  return (
    <details className="mt-4 rounded-xl border border-border bg-bg/60 p-3 text-xs">
      <summary className="cursor-pointer font-semibold text-ink">
        Historial de movimientos ({receipt.pagos.length})
      </summary>
      <ul className="mt-3 space-y-3">
        {receipt.pagos.map((payment) => (
          <li className="border-t border-border pt-3 first:border-t-0 first:pt-0" key={payment.id}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className={payment.anuladoEn ? "font-semibold text-ink-secondary line-through" : "font-semibold text-ink"}>
                {formatCurrency(payment.monto)} · {formatDate(payment.fechaPago)}
              </span>
              <span className={payment.anuladoEn ? "text-danger" : "text-success"}>
                {payment.formaPago === "EFECTIVO" ? "Efectivo" : "Transferencia"}{payment.anuladoEn ? " · Revertido" : ""}
              </span>
            </div>
            {payment.referencia ? <p className="mt-1 text-ink-secondary">Referencia: {payment.referencia}</p> : null}
            {payment.anuladoEn ? (
              <p className="mt-1 text-danger">Revertido el {formatDate(payment.anuladoEn)} por {payment.anuladoPor?.perfil?.nombreCompleto ?? "Sistema"}: {payment.motivoAnulacion}</p>
            ) : (
              <>
                <p className="mt-1 text-ink-secondary">Registrado por {payment.registradoPor?.perfil?.nombreCompleto ?? "Sistema"}</p>
                {canWrite ? (
                  <form action={`/api/pagos/${payment.id}/revertir`} className="mt-2 flex flex-wrap items-end gap-2" method="post">
                    <input name="periodo" type="hidden" value={periodValue} />
                    <label className="flex-1 text-ink-secondary">Motivo de reversión<input className="mt-1 block w-full rounded border border-border bg-surface px-2 py-1.5 text-xs text-ink" maxLength={500} minLength={3} name="motivo" required /></label>
                    <ConfirmSubmitButton message="¿Revertir este movimiento? El pago se conservará en el historial con el motivo indicado.">Revertir</ConfirmSubmitButton>
                  </form>
                ) : null}
              </>
            )}
          </li>
        ))}
      </ul>
    </details>
  );
}

export function ReceiptAction({
  canWrite,
  mobile = false,
  paymentDate,
  periodValue,
  receipt,
}: ReceiptActionProps) {
  if (!canWrite) {
    return <div><span className="text-xs text-ink-secondary">Solo consulta</span><PaymentHistory canWrite={false} periodValue={periodValue} receipt={receipt} /></div>;
  }

  const settled = receipt.saldoPendiente === 0;

  return (
    <div>
      {settled ? <p className="text-sm font-semibold text-success">Recibo liquidado</p> : <form action={`/api/recibos/${receipt.id}/pago`} className={mobile ? "grid gap-3 sm:grid-cols-2" : "grid gap-3 sm:grid-cols-2 xl:grid-cols-4"} method="post">
        <input name="periodo" type="hidden" value={periodValue} />
        <label className="text-xs font-semibold text-ink-secondary"><span className="block">Importe</span><input className="mt-1 block w-full rounded border border-border bg-surface px-2 py-2 text-sm text-ink" defaultValue={receipt.saldoPendiente.toFixed(2)} max={receipt.saldoPendiente.toFixed(2)} min="0.01" name="monto" required step="0.01" type="number" /></label>
        <label className="text-xs font-semibold text-ink-secondary"><span className="block">Fecha</span><input className="mt-1 block w-full rounded border border-border bg-surface px-2 py-2 text-sm text-ink" defaultValue={paymentDate} name="fechaPago" required type="date" /></label>
        <label className="text-xs font-semibold text-ink-secondary"><span className="block">Forma</span><select className="mt-1 block w-full rounded border border-border bg-surface px-2 py-2 text-sm text-ink" name="formaPago" required><option value="TRANSFERENCIA">Transferencia</option><option value="EFECTIVO">Efectivo</option></select></label>
        <label className="text-xs font-semibold text-ink-secondary"><span className="block">Referencia (opcional)</span><input className="mt-1 block w-full rounded border border-border bg-surface px-2 py-2 text-sm text-ink" maxLength={100} name="referencia" /></label>
        <Button className="w-full px-3 py-2 sm:w-auto sm:self-end" type="submit">Registrar pago</Button>
      </form>}
      <PaymentHistory canWrite={canWrite} periodValue={periodValue} receipt={receipt} />
    </div>
  );
}

export function ReceiptDocuments({
  canWrite,
  periodValue,
  receipt,
}: Omit<ReceiptActionProps, "mobile" | "paymentDate">) {
  return (
    <div className="mb-3 flex flex-wrap gap-3">
      <a className="text-sm font-semibold text-brand hover:text-brand-hover" href={`/api/recibos/${receipt.id}/pdf`} rel="noreferrer" target="_blank">Ver PDF</a>
      {receipt.estatus === EstadoRecibo.PAGADO ? <a className="text-sm font-semibold text-brand hover:text-brand-hover" href={`/api/recibos/${receipt.id}/comprobante-pago`} rel="noreferrer" target="_blank">Comprobante de pago</a> : null}
      {canWrite && receipt.contrato.emailArrendatario && receipt.estatus !== EstadoRecibo.PAGADO ? <form action={`/api/recibos/${receipt.id}/notificar`} method="post"><input name="periodo" type="hidden" value={periodValue} /><ConfirmSubmitButton message={`¿Enviar recordatorio a ${receipt.contrato.emailArrendatario}?`}>Enviar recordatorio</ConfirmSubmitButton></form> : null}
    </div>
  );
}
