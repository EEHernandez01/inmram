import Link from "next/link";
import { notFound } from "next/navigation";

import { updateContractAction } from "@/app/_actions/foundation";
import { ContractForm } from "@/components/forms/contract-form";
import { PageHeader } from "@/components/ui/page-header";
import { requireSystemRole, WRITE_ROLES } from "@/lib/auth/authorization";
import { toDateInput } from "@/lib/format";
import { obtenerContrato } from "@/lib/services/foundation";

export default async function EditContractPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSystemRole(WRITE_ROLES);
  const { id } = await params;
  const contract = await obtenerContrato(id);
  if (!contract) notFound();

  return (
    <>
      <PageHeader description={`${contract.unidad.propiedad.direccion} · Unidad ${contract.unidad.identificador}`} eyebrow="Contratos" title="Editar contrato" />
      <section className="mt-7 rounded-card border border-border bg-surface p-5">
        <ContractForm action={updateContractAction.bind(null, id)} defaults={{ arrendatario: contract.arrendatario, emailArrendatario: contract.emailArrendatario, telefonoArrendatario: contract.telefonoArrendatario, aval: contract.aval, fechaInicio: toDateInput(contract.fechaInicio), plazoMeses: contract.plazoMeses, fechaFin: toDateInput(contract.fechaFin), rentaMensualBase: contract.rentaMensualBase.toString(), diaPago: contract.diaPago, depositoGarantia: contract.depositoGarantia.toString(), estado: contract.estado }} propertyId={contract.unidad.propiedadId} submitLabel="Guardar cambios" unitId={contract.unidadId} />
        <Link className="mt-5 inline-block text-sm font-semibold text-brand hover:text-brand-hover" href={`/contratos/${id}`}>Cancelar</Link>
      </section>
    </>
  );
}
