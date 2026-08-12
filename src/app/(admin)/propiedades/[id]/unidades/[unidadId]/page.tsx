import Link from "next/link";
import { notFound } from "next/navigation";

import { deleteUnitAction } from "@/app/_actions/foundation";
import { ConfirmSubmitButton } from "@/components/forms/confirm-submit-button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getSystemUser, WRITE_ROLES } from "@/lib/auth/authorization";
import { formatCurrency, formatDate } from "@/lib/format";
import { obtenerUnidad } from "@/lib/services/foundation";

const typeLabels = { DEPARTAMENTO: "Departamento", LOCAL_COMERCIAL: "Local comercial", ACCESORIA: "Accesoria", BODEGA: "Bodega", OFICINA: "Oficina", OTRO: "Otro" } as const;

export default async function UnitDetailPage({ params }: { params: Promise<{ id: string; unidadId: string }> }) {
  const { id, unidadId } = await params;
  const [{ user }, unit] = await Promise.all([getSystemUser(), obtenerUnidad(unidadId)]);
  if (!unit || unit.propiedadId !== id) notFound();
  const canWrite = WRITE_ROLES.includes(user.rol as (typeof WRITE_ROLES)[number]);

  return (
    <>
      <PageHeader action={canWrite ? <Link className="rounded bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover" href={`/propiedades/${id}/unidades/${unidadId}/editar`}>Editar unidad</Link> : null} description={unit.propiedad.direccion} eyebrow={typeLabels[unit.tipo]} title={`Unidad ${unit.identificador}`} />

      <section className="mt-7 grid gap-4 sm:grid-cols-3">
        <div className="rounded-card border border-border bg-surface p-5"><p className="text-xs font-medium text-ink-secondary">Superficie</p><p className="mt-2 text-xl font-bold text-brand [font-variant-numeric:tabular-nums]">{unit.metrosCuadrados.toString()} m²</p></div>
        <div className="rounded-card border border-border bg-surface p-5"><p className="text-xs font-medium text-ink-secondary">Piso</p><p className="mt-2 text-sm font-semibold text-ink">{unit.piso || "No especificado"}</p></div>
        <div className="rounded-card border border-border bg-surface p-5"><p className="text-xs font-medium text-ink-secondary">Descripción</p><p className="mt-2 text-sm text-ink">{unit.descripcion || "Sin descripción"}</p></div>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-semibold text-ink">Historial de contratos</h2>{canWrite && !unit.contratos.some((contract) => contract.estado === "ACTIVO") ? <Link className="rounded bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover" href={`/propiedades/${id}/unidades/${unidadId}/contratos/nuevo`}>Nuevo contrato</Link> : null}</div>
        {unit.contratos.length === 0 ? <EmptyState description="La unidad aún no tiene contratos asociados." title="Sin contratos" /> : (
          <div className="overflow-x-auto rounded-card border border-border bg-surface"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-border text-xs font-semibold uppercase tracking-wide text-ink-secondary"><tr><th className="px-5 py-3">Arrendatario</th><th className="px-5 py-3">Vigencia</th><th className="px-5 py-3">Estado</th><th className="px-5 py-3 text-right">Renta</th></tr></thead><tbody className="divide-y divide-border">{unit.contratos.map((contract) => <tr className="hover:bg-bg/50" key={contract.id}><td className="px-5 py-4"><Link className="font-semibold text-brand hover:text-brand-hover" href={`/contratos/${contract.id}`}>{contract.arrendatario}</Link></td><td className="px-5 py-4 text-ink-secondary">{formatDate(contract.fechaInicio)} – {formatDate(contract.fechaFin)}</td><td className="px-5 py-4"><span className={contract.estado === "VENCIDO" ? "inline-flex rounded-pill bg-danger-soft px-2.5 py-1 text-xs font-semibold text-danger" : "inline-flex rounded-pill bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand"}>{contract.estado === "ACTIVO" ? "Activo" : "Vencido"}</span></td><td className="px-5 py-4 text-right font-semibold text-ink [font-variant-numeric:tabular-nums]">{formatCurrency(contract.rentaMensualBase)}</td></tr>)}</tbody></table></div>
        )}
      </section>

      {canWrite && !unit.medidorAgua && unit.contratos.length === 0 ? <section className="mt-8 border-t border-border pt-5"><form action={deleteUnitAction.bind(null, unidadId, id)}><ConfirmSubmitButton message="¿Eliminar esta unidad? Esta acción no se puede deshacer.">Eliminar unidad</ConfirmSubmitButton></form></section> : null}
    </>
  );
}

