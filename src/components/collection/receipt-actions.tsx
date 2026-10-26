import { EstadoRecibo } from "@/generated/prisma/enums";
import { ConfirmSubmitButton } from "@/components/forms/confirm-submit-button";
import { Button } from "@/components/ui/button";
import { MoneyInput } from "@/components/ui/money-input";
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
    <details className="group min-w-0 text-sm">
      <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 px-2 text-base font-semibold text-brand hover:text-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand [&::-webkit-details-marker]:hidden">
        <svg aria-hidden="true" className="size-5 shrink-0" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
        <span>Historial de pagos ({receipt.pagos.length})</span>
        <svg aria-hidden="true" className="size-4 shrink-0 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>
      </summary>
      <ul className="mt-2 space-y-3 border-l-2 border-border pl-4">
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
                    <label className="flex-1 text-base font-semibold text-ink">Motivo de reversión<input className="mt-1 block min-h-12 w-full rounded border border-border bg-surface px-3 py-3 text-base text-ink" maxLength={500} minLength={3} name="motivo" required /></label>
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
    return <span className="text-xs text-ink-secondary">Solo consulta</span>;
  }

  const settled = receipt.saldoPendiente === 0;
  const underReview = receipt.estatus === EstadoRecibo.REVISION;
  const omitted = receipt.estatus === EstadoRecibo.OMITIDO;

  return (
    <div>
      {underReview ? (
        <section className="mt-6 rounded-xl border border-warning/40 bg-warning-soft/50 p-5" aria-labelledby={`receipt-review-${receipt.id}`}>
          <h3 className="text-base font-bold text-ink" id={`receipt-review-${receipt.id}`}>Este recibo necesita revisión</h3>
          <p className="mt-1 text-base leading-6 text-ink-secondary">Confirma el saldo antes de registrar un pago. Si el recibo no corresponde, puedes omitirlo.</p>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end">
            <form action={`/api/recibos/${receipt.id}/revision`} method="post">
              <input name="periodo" type="hidden" value={periodValue} />
              <input name="accion" type="hidden" value="SALDO" />
              <Button type="submit" variant="secondary">Confirmar saldo</Button>
            </form>
            <form action={`/api/recibos/${receipt.id}/revision`} className="flex flex-col gap-3 sm:flex-row sm:items-end" method="post">
              <input name="periodo" type="hidden" value={periodValue} />
              <input name="accion" type="hidden" value="OMITIR" />
              <label className="text-base font-semibold text-ink">Motivo para omitir
                <input className="mt-1 block min-h-12 w-full rounded border border-border bg-surface px-3 py-3 text-base text-ink" maxLength={500} minLength={3} name="motivo" required />
              </label>
              <Button type="submit" variant="secondary">Omitir recibo</Button>
            </form>
          </div>
        </section>
      ) : omitted ? (
        <p className="mt-6 rounded-xl bg-bg p-4 text-base leading-6 text-ink-secondary">Este recibo está omitido. Se conserva para consulta y no se pueden registrar pagos.</p>
      ) : settled ? (
        <p className="mt-6 rounded-xl bg-success-soft p-4 text-base font-semibold text-success">Este recibo ya está pagado por completo.</p>
      ) : (
        <section className="mt-6 rounded-xl border border-border bg-bg p-5" aria-labelledby={`receipt-payment-${receipt.id}`}>
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-ink" id={`receipt-payment-${receipt.id}`}>Registrar un pago recibido</h3>
              <p className="mt-1 text-base text-ink-secondary">Saldo pendiente: <strong className="text-danger">{formatCurrency(receipt.saldoPendiente)}</strong></p>
            </div>
          </div>
          <p className="mb-4 text-sm leading-6 text-ink-secondary">El importe ya incluye el saldo pendiente. Puedes cambiarlo si recibiste un abono parcial.</p>
          <form action={`/api/recibos/${receipt.id}/pago`} className={mobile ? "grid gap-4 sm:grid-cols-2" : "grid gap-4 sm:grid-cols-2 xl:grid-cols-4"} method="post">
            <input name="periodo" type="hidden" value={periodValue} />
            <label className="text-base font-semibold text-ink"><span className="block">Importe recibido</span><MoneyInput className="mt-1 block w-full" defaultValue={receipt.saldoPendiente.toFixed(2)} name="monto" required /></label>
            <label className="text-base font-semibold text-ink"><span className="block">Fecha del pago</span><input className="mt-1 block min-h-12 w-full rounded border border-border bg-surface px-3 py-3 text-base text-ink" defaultValue={paymentDate} name="fechaPago" required type="date" /></label>
            <label className="text-base font-semibold text-ink"><span className="block">Forma de pago</span><select className="mt-1 block min-h-12 w-full rounded border border-border bg-surface px-3 py-3 text-base text-ink" name="formaPago" required><option value="TRANSFERENCIA">Transferencia</option><option value="EFECTIVO">Efectivo</option></select></label>
            <label className="text-base font-semibold text-ink"><span className="block">Referencia <span className="font-normal text-ink-secondary">(opcional)</span></span><input className="mt-1 block min-h-12 w-full rounded border border-border bg-surface px-3 py-3 text-base text-ink" maxLength={100} name="referencia" /></label>
            <div className="flex items-end sm:col-span-2 xl:col-span-4">
              <ConfirmSubmitButton className="min-h-12 w-full cursor-pointer rounded bg-brand px-5 py-3 text-base font-semibold text-white hover:bg-brand-hover sm:w-auto" message="¿Registrar este pago? Revisa el importe, la fecha y la forma de pago antes de continuar.">Guardar pago</ConfirmSubmitButton>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}

export function ReceiptDocuments({
  canWrite,
  periodValue,
  receipt,
}: Omit<ReceiptActionProps, "mobile" | "paymentDate">) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-3">
      <a className="inline-flex min-h-11 items-center justify-center rounded border border-border bg-surface px-4 py-3 text-base font-semibold text-brand transition-colors hover:bg-bg hover:text-brand-hover" href={`/api/recibos/${receipt.id}/pdf`} rel="noreferrer" target="_blank">Ver solicitud de pago</a>
      <PaymentHistory canWrite={canWrite} periodValue={periodValue} receipt={receipt} />
      {canWrite && receipt.contrato.estado === "ACTIVO" && receipt.contrato.emailArrendatario && receipt.estatus !== EstadoRecibo.PAGADO && receipt.estatus !== EstadoRecibo.REVISION && receipt.estatus !== EstadoRecibo.OMITIDO ? <form action={`/api/recibos/${receipt.id}/notificar`} method="post"><input name="periodo" type="hidden" value={periodValue} /><ConfirmSubmitButton className="inline-flex min-h-11 items-center justify-center rounded border border-border bg-surface px-4 py-3 text-base font-semibold text-brand transition-colors hover:bg-bg hover:text-brand-hover" message={`¿Enviar recordatorio a ${receipt.contrato.emailArrendatario}?`}>Enviar recordatorio</ConfirmSubmitButton></form> : null}
    </div>
  );
}
