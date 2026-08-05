import Link from "next/link";
import { notFound } from "next/navigation";

import { expireContractAction } from "@/app/_actions/foundation";
import { ConfirmSubmitButton } from "@/components/forms/confirm-submit-button";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { getSystemUser, WRITE_ROLES } from "@/lib/auth/authorization";
import { currentCollectionDate } from "@/lib/calculations/collection";
import { formatCurrency, formatDate } from "@/lib/format";
import { obtenerContrato } from "@/lib/services/foundation";

export default async function ContractDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ renovado?: string; error?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const [{ user }, contract] = await Promise.all([getSystemUser(), obtenerContrato(id)]);
  if (!contract) notFound();
  const canWrite = WRITE_ROLES.includes(user.rol as (typeof WRITE_ROLES)[number]);
  const renewalStart = new Date(contract.fechaFin); renewalStart.setUTCDate(renewalStart.getUTCDate() + 1);
  const renewalEnd = new Date(renewalStart); renewalEnd.setUTCFullYear(renewalEnd.getUTCFullYear() + 1); renewalEnd.setUTCDate(renewalEnd.getUTCDate() - 1);
  const finalIndexMonth = contract.fechaFin.toISOString().slice(0, 7);
  const baseIndexDate = new Date(Date.UTC(contract.fechaFin.getUTCFullYear() - 1, contract.fechaFin.getUTCMonth(), 1));
  const renewalAvailable = currentCollectionDate().getTime() >= contract.fechaFin.getTime();

  return (
    <>
      <PageHeader action={canWrite ? <Link className="rounded bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover" href={`/contratos/${id}/editar`}>Editar contrato</Link> : null} description={`${contract.unidad.propiedad.direccion} · Unidad ${contract.unidad.identificador}`} eyebrow="Contrato" title={contract.arrendatario} />
      {query.renovado ? <Alert className="mt-7" variant="success">Contrato renovado y ajuste INPC registrado.</Alert> : null}
      {query.error ? <Alert className="mt-7" variant="danger">{query.error}</Alert> : null}
      <section className="mt-7 rounded-card border border-border bg-surface p-5">
        <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Estado", contract.estado === "ACTIVO" ? "Activo" : "Vencido"],
            ["Aval", contract.aval],
            ["Correo", contract.emailArrendatario || "No registrado"],
            ["Teléfono", contract.telefonoArrendatario || "No registrado"],
            ["Inicio", formatDate(contract.fechaInicio)],
            ["Finalización", formatDate(contract.fechaFin)],
            ["Plazo", `${contract.plazoMeses} meses`],
            ["Día de pago", `Día ${contract.diaPago}`],
            ["Renta mensual", formatCurrency(contract.rentaMensualBase)],
            ["Depósito", formatCurrency(contract.depositoGarantia)],
          ].map(([label, display]) => <div key={label}><p className="text-xs font-medium text-ink-secondary">{label}</p><p className="mt-1 text-sm font-semibold text-ink [font-variant-numeric:tabular-nums]">{display}</p></div>)}
        </div>
      </section>
      <Link className="mt-5 inline-block text-sm font-semibold text-brand hover:text-brand-hover" href={`/propiedades/${contract.unidad.propiedadId}/unidades/${contract.unidadId}`}>Ver unidad</Link>
      {contract.ajustesInflacion.length > 0 ? <section className="mt-7 rounded-card border border-border bg-surface p-5"><h2 className="text-sm font-semibold text-ink">Historial de ajustes</h2><div className="mt-4 space-y-3">{contract.ajustesInflacion.map((adjustment) => <div className="flex flex-wrap justify-between gap-3 border-t border-border pt-3 text-sm" key={adjustment.id}><span className="text-ink-secondary">{adjustment.indiceUsado}</span><span className="font-semibold text-ink [font-variant-numeric:tabular-nums]">{formatCurrency(adjustment.rentaResultante)}</span></div>)}</div></section> : null}
      {canWrite && contract.estado === "ACTIVO" && !renewalAvailable ? <Alert className="mt-7" variant="info">La renovación estará disponible a partir del {formatDate(contract.fechaFin)}. Mientras tanto puedes preparar los niveles INPC necesarios.</Alert> : null}
      {canWrite && contract.estado === "ACTIVO" && renewalAvailable ? <section className="mt-7 rounded-card border border-border bg-surface p-5"><h2 className="text-sm font-semibold text-ink">Renovar con INPC</h2><p className="mt-2 text-sm text-ink-secondary">Se creará un contrato nuevo y este contrato conservará intacto su historial.</p><form action={`/api/contratos/${id}/renovar`} className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" method="post"><input name="indice" type="hidden" value="INPC" /><label className="text-xs font-medium text-ink-secondary">Mes base<input className="mt-2 w-full rounded border border-border px-3 py-2.5 text-sm" defaultValue={baseIndexDate.toISOString().slice(0, 7)} name="mesBase" required type="month" /></label><label className="text-xs font-medium text-ink-secondary">Mes final<input className="mt-2 w-full rounded border border-border px-3 py-2.5 text-sm" defaultValue={finalIndexMonth} name="mesFinal" required type="month" /></label><label className="text-xs font-medium text-ink-secondary">Nuevo plazo<input className="mt-2 w-full rounded border border-border px-3 py-2.5 text-sm" defaultValue="12" min="1" name="plazoMeses" required type="number" /></label><label className="text-xs font-medium text-ink-secondary">Inicio<input className="mt-2 w-full rounded border border-border px-3 py-2.5 text-sm" defaultValue={renewalStart.toISOString().slice(0, 10)} name="fechaInicio" required type="date" /></label><label className="text-xs font-medium text-ink-secondary">Finalización<input className="mt-2 w-full rounded border border-border px-3 py-2.5 text-sm" defaultValue={renewalEnd.toISOString().slice(0, 10)} name="fechaFin" required type="date" /></label><div className="flex items-end"><ConfirmSubmitButton message="¿Crear el contrato renovado con la renta calculada por INPC?">Renovar contrato</ConfirmSubmitButton></div></form></section> : null}
      {canWrite && contract.estado === "ACTIVO" ? <section className="mt-8 border-t border-border pt-5"><form action={expireContractAction.bind(null, id)}><ConfirmSubmitButton message="¿Marcar este contrato como vencido? El historial se conservará.">Marcar contrato como vencido</ConfirmSubmitButton></form></section> : null}
    </>
  );
}
