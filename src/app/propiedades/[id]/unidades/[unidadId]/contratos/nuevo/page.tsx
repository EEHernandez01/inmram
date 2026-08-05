import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { createContractAction } from "@/app/_actions/foundation";
import { ContractForm } from "@/components/forms/contract-form";
import { PageHeader } from "@/components/ui/page-header";
import { requireSystemRole, WRITE_ROLES } from "@/lib/auth/authorization";
import { obtenerUnidad } from "@/lib/services/foundation";

export default async function NewContractPage({ params }: { params: Promise<{ id: string; unidadId: string }> }) {
  await requireSystemRole(WRITE_ROLES);
  const { id, unidadId } = await params;
  const unit = await obtenerUnidad(unidadId);
  if (!unit || unit.propiedadId !== id) notFound();
  if (unit.contratos.some((contract) => contract.estado === "ACTIVO")) redirect(`/propiedades/${id}/unidades/${unidadId}`);

  return (
    <>
      <PageHeader description={`${unit.propiedad.direccion} · Unidad ${unit.identificador}`} eyebrow="Contratos" title="Nuevo contrato" />
      <section className="mt-7 rounded-card border border-border bg-surface p-5">
        <ContractForm action={createContractAction} propertyId={id} submitLabel="Guardar contrato" unitId={unidadId} />
        <Link className="mt-5 inline-block text-sm font-semibold text-brand hover:text-brand-hover" href={`/propiedades/${id}/unidades/${unidadId}`}>Cancelar</Link>
      </section>
    </>
  );
}

