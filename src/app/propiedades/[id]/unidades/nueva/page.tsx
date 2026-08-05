import Link from "next/link";
import { notFound } from "next/navigation";

import { createUnitAction } from "@/app/_actions/foundation";
import { UnitForm } from "@/components/forms/unit-form";
import { PageHeader } from "@/components/ui/page-header";
import { requireSystemRole, WRITE_ROLES } from "@/lib/auth/authorization";
import { obtenerPropiedad } from "@/lib/services/foundation";

export default async function NewUnitPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSystemRole(WRITE_ROLES);
  const { id } = await params;
  const property = await obtenerPropiedad(id);
  if (!property) notFound();

  return (
    <>
      <PageHeader description={property.direccion} eyebrow="Unidades" title="Nueva unidad" />
      <section className="mt-7 rounded-card border border-border bg-surface p-5">
        <UnitForm action={createUnitAction} propertyId={id} submitLabel="Guardar unidad" />
        <Link className="mt-5 inline-block text-sm font-semibold text-brand hover:text-brand-hover" href={`/propiedades/${id}`}>Cancelar</Link>
      </section>
    </>
  );
}

