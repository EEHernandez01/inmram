import { notFound, redirect } from "next/navigation";

import { ContractForm } from "@/components/forms/contract-form";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { requireSystemRole, WRITE_ROLES } from "@/lib/auth/authorization";
import { toDateInput } from "@/lib/format";
import { obtenerContrato } from "@/lib/services/foundation";

export default async function EditContractPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  await requireSystemRole(WRITE_ROLES);
  const { id } = await params;
  const query = await searchParams;
  const contract = await obtenerContrato(id);
  if (!contract) notFound();
  if (contract.estado === "CANCELADO") redirect(`/contratos/${id}`);

  return (
    <>
      <PageHeader description={`${contract.unidad.propiedad.direccion} · Unidad ${contract.unidad.identificador}`} eyebrow="Contratos" title="Editar contrato" />
      <section className="mt-7 rounded-card border border-border bg-surface p-5">
        {query.error ? <Alert className="mb-5" variant="danger">{query.error}</Alert> : null}
        <ContractForm cancelHref={`/contratos/${id}`} defaults={{ arrendatario: contract.arrendatario, emailArrendatario: contract.emailArrendatario, telefonoArrendatario: contract.telefonoArrendatario, aval: contract.aval, tipoGarantia: contract.tipoGarantia, valorGarantia: contract.valorGarantia?.toString(), pagareMonto: contract.pagareMonto?.toString(), pagareFechaEmision: contract.pagareFechaEmision ? toDateInput(contract.pagareFechaEmision) : null, pagareFechaVencimiento: contract.pagareFechaVencimiento ? toDateInput(contract.pagareFechaVencimiento) : null, pagareLugarPago: contract.pagareLugarPago, avalTelefono: contract.avalTelefono, avalCorreo: contract.avalCorreo, fechaInicio: toDateInput(contract.fechaInicio), plazoMeses: contract.plazoMeses, fechaFin: toDateInput(contract.fechaFin), rentaMensualBase: contract.rentaMensualBase.toString(), diaPago: contract.diaPago, depositoGarantia: contract.depositoGarantia.toString(), cargoFijoMensual: contract.cargoFijoMensual.toString(), estado: contract.estado }} propertyId={contract.unidad.propiedadId} submitLabel="Guardar cambios" unitId={contract.unidadId} contractId={id} />
      </section>
    </>
  );
}
