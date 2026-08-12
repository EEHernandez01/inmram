import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { updatePropertyFormAction } from "@/app/_actions/foundation";
import { PropertyForm } from "@/components/forms/property-form";
import { PageHeader } from "@/components/ui/page-header";
import { requireSystemRole, WRITE_ROLES } from "@/lib/auth/authorization";
import { obtenerPropiedad } from "@/lib/services/foundation";
import { obtenerPropietarioActual } from "@/lib/services/profile";

export default async function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSystemRole(WRITE_ROLES);
  const { id } = await params;
  const [property, owner] = await Promise.all([
    obtenerPropiedad(id),
    obtenerPropietarioActual().catch(() => null),
  ]);
  if (!owner) redirect("/configuracion/perfil?required=1");
  if (!property) notFound();

  return (
    <>
      <PageHeader eyebrow="Propiedades" title="Editar propiedad" />
      <section className="mt-7 rounded-card border border-border bg-surface p-5">
        <PropertyForm action={updatePropertyFormAction.bind(null, id)} defaults={{ direccion: property.direccion, googlePlaceId: property.googlePlaceId ?? undefined, latitud: property.latitud?.toString(), longitud: property.longitud?.toString(), valorCatastral: property.valorCatastral.toString(), valorComercialTotal: property.valorComercialTotal.toString(), predialAnual: property.predialAnual.toString(), mantenimientoAnual: property.mantenimientoAnual.toString() }} placesEnabled={Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)} submitLabel="Guardar cambios" />
        <Link className="mt-5 inline-block text-sm font-semibold text-brand hover:text-brand-hover" href={`/propiedades/${id}`}>Cancelar</Link>
      </section>
    </>
  );
}
