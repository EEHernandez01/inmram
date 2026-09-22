import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { UnitForm } from "@/components/forms/unit-form";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { requireSystemRole, WRITE_ROLES } from "@/lib/auth/authorization";
import { listarOpcionesPropietario, obtenerPropiedad } from "@/lib/services/foundation";

export default async function NewUnitPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  await requireSystemRole(WRITE_ROLES);
  const { id } = await params;
  const query = await searchParams;
  const [property, owners] = await Promise.all([obtenerPropiedad(id), listarOpcionesPropietario()]);
  if (!property) notFound();
  if (property.archivadaEn) redirect(`/propiedades/${id}`);

  return (
    <>
      <PageHeader description={property.direccion} eyebrow="Unidades" title="Nueva unidad" />
      <section className="mt-7 rounded-card border border-border bg-surface p-5">
        {query.error ? <Alert className="mb-5" variant="danger">{query.error}</Alert> : null}
        <UnitForm defaults={{ propietarioId: property.propietarioId }} owners={owners} propertyId={id} submitLabel="Guardar unidad" />
        <Link className="mt-5 inline-block text-sm font-semibold text-brand hover:text-brand-hover" href={`/propiedades/${id}`}>Cancelar</Link>
      </section>
    </>
  );
}
