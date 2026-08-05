import Link from "next/link";
import { notFound } from "next/navigation";

import { deletePropertyAction } from "@/app/_actions/foundation";
import { ConfirmSubmitButton } from "@/components/forms/confirm-submit-button";
import { PlacePreview } from "@/components/maps/place-preview";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getSystemUser, WRITE_ROLES } from "@/lib/auth/authorization";
import { formatCurrency } from "@/lib/format";
import { obtenerPropiedad } from "@/lib/services/foundation";

const typeLabels = { DEPARTAMENTO: "Departamento", LOCAL_COMERCIAL: "Local comercial", ACCESORIA: "Accesoria", BODEGA: "Bodega", OFICINA: "Oficina", OTRO: "Otro" } as const;

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ user }, property] = await Promise.all([getSystemUser(), obtenerPropiedad(id)]);
  if (!property) notFound();
  const canWrite = WRITE_ROLES.includes(user.rol as (typeof WRITE_ROLES)[number]);
  const latitude = property.latitud ? Number(property.latitud) : null;
  const longitude = property.longitud ? Number(property.longitud) : null;

  return (
    <>
      <PageHeader
        action={canWrite ? <Link className="inline-flex rounded bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover" href={`/propiedades/${id}/editar`}>Editar propiedad</Link> : null}
        description="Información general y unidades rentables del predio."
        eyebrow="Propiedad"
        title={property.direccion}
      />

      <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Valor catastral", formatCurrency(property.valorCatastral)],
          ["Valor comercial", formatCurrency(property.valorComercialTotal)],
          ["Predial anual", formatCurrency(property.predialAnual)],
          ["Mantenimiento anual", formatCurrency(property.mantenimientoAnual)],
        ].map(([label, amount]) => <div className="rounded-card border border-border bg-surface p-5" key={label}><p className="text-xs font-medium text-ink-secondary">{label}</p><p className="mt-2 text-xl font-bold tracking-tight text-brand [font-variant-numeric:tabular-nums]">{amount}</p></div>)}
      </section>

      {latitude !== null && longitude !== null ? (
        <section className="mt-8">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-ink">Ubicación</h2>
            <p className="mt-1 text-xs text-ink-secondary">Punto registrado y vista disponible del lugar.</p>
          </div>
          <PlacePreview
            address={property.direccion}
            latitude={latitude}
            longitude={longitude}
          />
        </section>
      ) : null}

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-semibold text-ink">Unidades</h2>{canWrite ? <Link className="rounded bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover" href={`/propiedades/${id}/unidades/nueva`}>Nueva unidad</Link> : null}</div>
        {property.unidades.length === 0 ? <EmptyState description="Agrega el primer espacio rentable dentro de este predio." title="Sin unidades registradas" /> : (
          <div className="overflow-x-auto rounded-card border border-border bg-surface"><table className="w-full min-w-[620px] text-left text-sm"><thead className="border-b border-border text-xs font-semibold uppercase tracking-wide text-ink-secondary"><tr><th className="px-5 py-3">Identificador</th><th className="px-5 py-3">Tipo</th><th className="px-5 py-3 text-right">Superficie</th></tr></thead><tbody className="divide-y divide-border">{property.unidades.map((unit) => <tr className="hover:bg-bg/50" key={unit.id}><td className="px-5 py-4"><Link className="font-semibold text-brand hover:text-brand-hover" href={`/propiedades/${id}/unidades/${unit.id}`}>{unit.identificador}</Link></td><td className="px-5 py-4 text-ink-secondary">{typeLabels[unit.tipo]}</td><td className="px-5 py-4 text-right text-ink [font-variant-numeric:tabular-nums]">{unit.metrosCuadrados.toString()} m²</td></tr>)}</tbody></table></div>
        )}
      </section>

      {canWrite && property.unidades.length === 0 ? <section className="mt-8 border-t border-border pt-5"><form action={deletePropertyAction.bind(null, id)}><ConfirmSubmitButton message="¿Eliminar esta propiedad? Esta acción no se puede deshacer.">Eliminar propiedad</ConfirmSubmitButton></form></section> : null}
    </>
  );
}
