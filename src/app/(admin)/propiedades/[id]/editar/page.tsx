import Link from "next/link";
import { notFound } from "next/navigation";

import { PropertyForm } from "@/components/forms/property-form";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { requireSystemRole, WRITE_ROLES } from "@/lib/auth/authorization";
import { listarPropietarios, obtenerPropiedad } from "@/lib/services/foundation";

export default async function EditPropertyPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  await requireSystemRole(WRITE_ROLES);
  const { id } = await params;
  const query = await searchParams;
  const [property, owners] = await Promise.all([
    obtenerPropiedad(id),
    listarPropietarios(),
  ]);
  if (!property) notFound();

  return (
    <>
      <PageHeader action={<Link className="text-sm font-semibold text-brand hover:text-brand-hover" href={`/propiedades/${id}`}>Ver propiedad</Link>} description={property.direccion} eyebrow="Propiedades" title="Editar propiedad" />
      <section className="mt-7 rounded-card border border-border bg-surface p-5">
        {query.error ? <Alert className="mb-5" variant="danger">{query.error}</Alert> : null}
        <PropertyForm action={`/api/propiedades/${id}`} defaults={{ direccion: property.direccion, googlePlaceId: property.googlePlaceId ?? undefined, latitud: property.latitud?.toString(), longitud: property.longitud?.toString(), valorCatastral: property.valorCatastral.toString(), valorComercialTotal: property.valorComercialTotal.toString(), predialAnual: property.predialAnual.toString(), mantenimientoAnual: property.mantenimientoAnual.toString(), propietarioId: property.propietarioId }} existingPhotos={property.archivos.map(({ id: photoId, nombre, url }) => ({ id: photoId, nombre, url }))} owners={owners} placesEnabled={Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)} submitLabel="Guardar cambios" />
        <Link className="mt-5 inline-block text-sm font-semibold text-brand hover:text-brand-hover" href={`/propiedades/${id}`}>Cancelar</Link>
      </section>
    </>
  );
}
