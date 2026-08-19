import { EstadoRecibo } from "@/generated/prisma/enums";
import { ConfirmSubmitButton } from "@/components/forms/confirm-submit-button";
import { Button } from "@/components/ui/button";

import type { CollectionReceipt } from "./types";

type ReceiptActionProps = {
  canWrite: boolean;
  mobile?: boolean;
  paymentDate: string;
  periodValue: string;
  receipt: CollectionReceipt;
};

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

  if (receipt.estatus === EstadoRecibo.PAGADO) {
    return (
      <form action={`/api/recibos/${receipt.id}/revertir`} method="post">
        <input name="periodo" type="hidden" value={periodValue} />
        <ConfirmSubmitButton message="¿Corregir este pago? Se eliminarán la fecha y forma de pago.">
          Corregir pago
        </ConfirmSubmitButton>
      </form>
    );
  }

  return (
    <form
      action={`/api/recibos/${receipt.id}/pago`}
      className={
        mobile
          ? "grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
          : "flex min-w-[330px] items-end gap-2"
      }
      method="post"
    >
      <input name="periodo" type="hidden" value={periodValue} />
      <label className="text-xs font-semibold text-ink-secondary">
        <span className="block">Fecha</span>
        <input
          className="mt-1 block w-full rounded border border-border bg-surface px-2 py-2 text-sm text-ink"
          defaultValue={paymentDate}
          name="fechaPago"
          required
          type="date"
        />
      </label>
      <label className="text-xs font-semibold text-ink-secondary">
        <span className="block">Forma</span>
        <select
          className="mt-1 block w-full rounded border border-border bg-surface px-2 py-2 text-sm text-ink"
          name="formaPago"
          required
        >
          <option value="TRANSFERENCIA">Transferencia</option>
          <option value="EFECTIVO">Efectivo</option>
        </select>
      </label>
      <Button className="w-full px-3 py-2 sm:w-auto" type="submit">
        Marcar pagado
      </Button>
    </form>
  );
}

export function ReceiptDocuments({
  canWrite,
  periodValue,
  receipt,
}: Omit<ReceiptActionProps, "mobile" | "paymentDate">) {
  return (
    <div className="mb-3 flex flex-wrap gap-3">
      <a
        className="text-sm font-semibold text-brand hover:text-brand-hover"
        href={`/api/recibos/${receipt.id}/pdf`}
        rel="noreferrer"
        target="_blank"
      >
        Ver PDF
      </a>
      {canWrite &&
      receipt.contrato.emailArrendatario &&
      receipt.estatus !== EstadoRecibo.PAGADO ? (
        <form action={`/api/recibos/${receipt.id}/notificar`} method="post">
          <input name="periodo" type="hidden" value={periodValue} />
          <ConfirmSubmitButton
            message={`¿Enviar recordatorio a ${receipt.contrato.emailArrendatario}?`}
          >
            Enviar recordatorio
          </ConfirmSubmitButton>
        </form>
      ) : null}
    </div>
  );
}
