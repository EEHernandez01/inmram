import { notFound, redirect } from "next/navigation";

import { ContractForm } from "@/components/forms/contract-form";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { requireSystemRole, WRITE_ROLES } from "@/lib/auth/authorization";
import { obtenerUnidad } from "@/lib/services/foundation";

export default async function NewContractPage({ params, searchParams }: { params: Promise<{ id: string; unidadId: string }>; searchParams: Promise<{ error?: string }> }) {
  await requireSystemRole(WRITE_ROLES);
  const { id, unidadId } = await params;
  const query = await searchParams;
  const unit = await obtenerUnidad(unidadId);
  if (!unit) notFound();
  if (unit.propiedadId !== id) redirect(`/propiedades/${unit.propiedadId}/unidades/${unidadId}/contratos/nuevo`);
  if (unit.contratos.some((contract) => contract.estado === "ACTIVO")) redirect(`/propiedades/${unit.propiedadId}/unidades/${unidadId}`);

  return (
    <>
      <PageHeader description={`${unit.propiedad.direccion} · Unidad ${unit.identificador}`} eyebrow="Contratos" title="Nuevo contrato" />
      <section className="mt-7 rounded-3xl bg-bg p-6 shadow-[7px_7px_15px_#c6cdd6,-7px_-7px_15px_#fff] sm:p-7">
        {query.error ? <Alert className="mb-5" variant="danger">{query.error}</Alert> : null}
        <ContractForm cancelHref={`/propiedades/${unit.propiedadId}/unidades/${unidadId}`} propertyId={unit.propiedadId} submitLabel="Guardar contrato" unitId={unidadId} />
      </section>
    </>
  );
}
