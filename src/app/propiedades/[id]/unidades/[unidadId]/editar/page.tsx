import Link from "next/link";
import { notFound } from "next/navigation";

import { UnitForm } from "@/components/forms/unit-form";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { requireSystemRole, WRITE_ROLES } from "@/lib/auth/authorization";
import { obtenerUnidad } from "@/lib/services/foundation";

export default async function EditUnitPage({ params, searchParams }: { params: Promise<{ id: string; unidadId: string }>; searchParams: Promise<{ error?: string }> }) {
  await requireSystemRole(WRITE_ROLES);
  const { id, unidadId } = await params;
  const query = await searchParams;
  const unit = await obtenerUnidad(unidadId);
  if (!unit || unit.propiedadId !== id) notFound();

  return (
    <>
      <PageHeader eyebrow="Unidades" title={`Editar unidad ${unit.identificador}`} />
      <section className="mt-7 rounded-card border border-border bg-surface p-5">
        {query.error ? <Alert className="mb-5" variant="danger">{query.error}</Alert> : null}
        <UnitForm defaults={{ identificador: unit.identificador, tipo: unit.tipo, metrosCuadrados: unit.metrosCuadrados.toString(), descripcion: unit.descripcion, piso: unit.piso }} propertyId={id} submitLabel="Guardar cambios" unitId={unidadId} />
        <Link className="mt-5 inline-block text-sm font-semibold text-brand hover:text-brand-hover" href={`/propiedades/${id}/unidades/${unidadId}`}>Cancelar</Link>
      </section>
    </>
  );
}
