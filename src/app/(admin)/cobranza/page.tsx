import Link from "next/link";

import { EstadoRecibo } from "@/generated/prisma/enums";
import { ConfirmSubmitButton } from "@/components/forms/confirm-submit-button";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getSystemUser, WRITE_ROLES } from "@/lib/auth/authorization";
import {
  currentCollectionDate,
  currentReceiptPeriod,
  receiptPeriodFromValue,
  receiptPeriodValue,
} from "@/lib/calculations/collection";
import {
  formatCurrency,
  formatDate,
  formatPercent,
  toDateInput,
} from "@/lib/format";
import { listarCobranzaMensual } from "@/lib/services/collection";
import {
  receiptPeriodSchema,
  receiptStatusFilterSchema,
} from "@/lib/validation/collection";

const statusLabels = {
  PENDIENTE: "Pendiente",
  PAGADO: "Pagado",
  VENCIDO: "Vencido",
} as const;

const statusClasses = {
  PENDIENTE: "bg-warning-soft text-warning",
  PAGADO: "bg-success-soft text-success",
  VENCIDO: "bg-danger-soft text-danger",
} as const;

type CollectionReceipt = Awaited<
  ReturnType<typeof listarCobranzaMensual>
>["receipts"][number];

function ReceiptBadge({ status }: { status: EstadoRecibo }) {
  return (
    <span
      className={`inline-flex rounded-pill px-2.5 py-1 text-xs font-semibold ${statusClasses[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}

function ReceiptAction({
  canWrite,
  mobile = false,
  paymentDate,
  periodValue,
  receipt,
}: {
  canWrite: boolean;
  mobile?: boolean;
  paymentDate: string;
  periodValue: string;
  receipt: CollectionReceipt;
}) {
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
      <button
        className="w-full rounded bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-hover sm:w-auto"
        type="submit"
      >
        Marcar pagado
      </button>
    </form>
  );
}

function ReceiptDocuments({ canWrite, periodValue, receipt }: { canWrite: boolean; periodValue: string; receipt: CollectionReceipt }) {
  return <div className="mb-3 flex flex-wrap gap-3"><a className="text-sm font-semibold text-brand hover:text-brand-hover" href={`/api/recibos/${receipt.id}/pdf`} target="_blank">Ver PDF</a>{canWrite && receipt.contrato.emailArrendatario && receipt.estatus !== EstadoRecibo.PAGADO ? <form action={`/api/recibos/${receipt.id}/notificar`} method="post"><input name="periodo" type="hidden" value={periodValue} /><ConfirmSubmitButton message={`¿Enviar recordatorio a ${receipt.contrato.emailArrendatario}?`}>Enviar recordatorio</ConfirmSubmitButton></form> : null}</div>;
}

function ReceiptMobileCard({
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
          <dt className="text-xs text-ink-secondary">Agua</dt>
          <dd className="mt-1 text-ink [font-variant-numeric:tabular-nums]">
            {receipt.cargoAgua === null
              ? "Sin cargo"
              : formatCurrency(receipt.cargoAgua)}
          </dd>
        </div>
        <div className="text-right">
          <dt className="text-xs text-ink-secondary">Total</dt>
          <dd className="mt-1 font-semibold text-ink [font-variant-numeric:tabular-nums]">
            {formatCurrency(receipt.total)}
          </dd>
        </div>
      </dl>

      {receipt.fechaPago ? (
        <p className="mt-4 text-xs text-ink-secondary">
          Pagado el {formatDate(receipt.fechaPago)} ·{" "}
          {receipt.formaPago === "EFECTIVO" ? "Efectivo" : "Transferencia"}
        </p>
      ) : null}

      <div className="mt-5 border-t border-border pt-4">
        <ReceiptDocuments canWrite={canWrite} periodValue={periodValue} receipt={receipt} />
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

export default async function CollectionPage({
  searchParams,
}: {
  searchParams: Promise<{
    actualizados?: string;
    error?: string;
    estatus?: string;
    generados?: string;
    pago?: string;
    notificado?: string;
    periodo?: string;
  }>;
}) {
  const [query, { user }] = await Promise.all([searchParams, getSystemUser()]);
  const parsedPeriod = receiptPeriodSchema.safeParse(query.periodo);
  const period = parsedPeriod.success
    ? receiptPeriodFromValue(parsedPeriod.data)
    : currentReceiptPeriod();
  const periodValue = receiptPeriodValue(period);
  const parsedStatus = receiptStatusFilterSchema.safeParse(query.estatus);
  const status = parsedStatus.success ? parsedStatus.data : undefined;
  const { receipts, summary } = await listarCobranzaMensual({ period, status });
  const canWrite = WRITE_ROLES.includes(
    user.rol as (typeof WRITE_ROLES)[number],
  );
  const paymentDate = toDateInput(currentCollectionDate());

  return (
    <>
      <PageHeader
        action={
          canWrite ? (
            <form action="/api/cobranza/generar" method="post">
              <button
                className="rounded bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover"
                type="submit"
              >
                Generar/actualizar cobranza
              </button>
            </form>
          ) : null
        }
        description="Seguimiento mensual de recibos, pagos y morosidad."
        eyebrow="Operación"
        title="Cobranza"
      />

      {query.error ? (
        <Alert className="mt-6" variant="danger">
          {query.error}
        </Alert>
      ) : null}
      {query.generados !== undefined ? (
        <Alert className="mt-6" variant="success">
          Proceso completado: {query.generados} recibos creados y{" "}
          {query.actualizados ?? "0"} vencimientos actualizados.
        </Alert>
      ) : null}
      {query.pago ? (
        <Alert className="mt-6" variant="success">
          {query.pago === "registrado"
            ? "Pago registrado correctamente."
            : "El pago fue corregido y el recibo se recalculó."}
        </Alert>
      ) : null}
      {query.notificado ? <Alert className="mt-6" variant="success">Recordatorio enviado correctamente.</Alert> : null}

      <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ["Monto esperado", formatCurrency(summary.esperado), "text-brand"],
          ["Monto cobrado", formatCurrency(summary.cobrado), "text-brand"],
          [
            "Porcentaje cobrado",
            formatPercent(summary.porcentajeCobrado),
            "text-brand",
          ],
          ["Recibos vencidos", String(summary.recibosVencidos), "text-danger"],
          [
            "Tasa de morosidad",
            formatPercent(summary.tasaMorosidad),
            "text-danger",
          ],
        ].map(([label, display, color]) => (
          <div
            className="rounded-card border border-border bg-surface p-5"
            key={label}
          >
            <p className="text-xs font-medium text-ink-secondary">{label}</p>
            <p
              className={`mt-2 text-2xl font-bold tracking-tight [font-variant-numeric:tabular-nums] ${color}`}
            >
              {display}
            </p>
          </div>
        ))}
      </section>

      <section className="mt-7 rounded-card border border-border bg-surface p-5">
        <form className="flex flex-col gap-4 sm:flex-row sm:items-end" method="get">
          <label className="block text-sm font-semibold text-ink">
            <span className="mb-2 block">Periodo</span>
            <input
              className="rounded border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-brand"
              defaultValue={periodValue}
              name="periodo"
              type="month"
            />
          </label>
          <label className="block text-sm font-semibold text-ink">
            <span className="mb-2 block">Estatus</span>
            <select
              className="rounded border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-brand"
              defaultValue={status ?? ""}
              name="estatus"
            >
              <option value="">Todos</option>
              {Object.values(EstadoRecibo).map((value) => (
                <option key={value} value={value}>
                  {statusLabels[value]}
                </option>
              ))}
            </select>
          </label>
          <button
            className="rounded border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-ink hover:bg-bg"
            type="submit"
          >
            Aplicar filtros
          </button>
        </form>
      </section>

      <section className="mt-7">
        {receipts.length === 0 ? (
          <EmptyState
            description="No hay recibos que coincidan con el periodo y estatus seleccionados."
            title="Sin recibos"
          />
        ) : (
          <>
            <div className="space-y-4 lg:hidden">
              {receipts.map((receipt) => (
                <ReceiptMobileCard
                  canWrite={canWrite}
                  key={receipt.id}
                  paymentDate={paymentDate}
                  periodValue={periodValue}
                  receipt={receipt}
                />
              ))}
            </div>

            <div className="hidden overflow-x-auto rounded-card border border-border bg-surface lg:block">
              <table className="w-full min-w-[1380px] text-left text-sm">
                <caption className="sr-only">
                  Recibos de cobranza del periodo {periodValue}
                </caption>
                <thead className="border-b border-border text-xs font-semibold uppercase tracking-wide text-ink-secondary">
                  <tr>
                    <th className="px-5 py-3" scope="col">
                      Propiedad / unidad
                    </th>
                    <th className="px-5 py-3" scope="col">
                      Arrendatario
                    </th>
                    <th className="px-5 py-3" scope="col">
                      Vencimiento
                    </th>
                    <th className="px-5 py-3" scope="col">
                      Estatus
                    </th>
                    <th className="px-5 py-3 text-right" scope="col">
                      Renta
                    </th>
                    <th className="px-5 py-3 text-right" scope="col">
                      Agua
                    </th>
                    <th className="px-5 py-3 text-right" scope="col">
                      Total
                    </th>
                    <th className="px-5 py-3" scope="col">
                      Acción
                    </th>
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
                      <td className="px-5 py-4 text-ink">
                        {receipt.contrato.arrendatario}
                      </td>
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
                            {receipt.formaPago === "EFECTIVO"
                              ? "Efectivo"
                              : "Transferencia"}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-5 py-4 text-right font-semibold text-ink [font-variant-numeric:tabular-nums]">
                        {formatCurrency(receipt.monto)}
                      </td>
                      <td className="px-5 py-4 text-right text-ink [font-variant-numeric:tabular-nums]">
                        {receipt.cargoAgua === null
                          ? "—"
                          : formatCurrency(receipt.cargoAgua)}
                      </td>
                      <td className="px-5 py-4 text-right font-semibold text-ink [font-variant-numeric:tabular-nums]">
                        {formatCurrency(receipt.total)}
                      </td>
                      <td className="px-5 py-4">
                        <ReceiptDocuments canWrite={canWrite} periodValue={periodValue} receipt={receipt} />
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
          </>
        )}
      </section>
    </>
  );
}
