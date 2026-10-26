import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { listarPropiedades, listarContratos } from "@/lib/services/foundation";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const query = (await searchParams).q?.trim().slice(0, 100) ?? "";
  if (query.length < 2) return <><PageHeader eyebrow="Búsqueda" title="Buscar" description="Busca propiedades, unidades y arrendatarios desde un solo lugar." /><div className="mt-7"><EmptyState title="Escribe para comenzar" description="Usa al menos dos caracteres en el buscador superior." /></div></>;
  const [properties, contracts] = await Promise.all([listarPropiedades({ busqueda: query }), listarContratos()]);
  const needle = query.toLocaleLowerCase("es-MX");
  const propertyResults = properties.propiedades;
  const contractResults = contracts.filter((contract) => `${contract.arrendatario} ${contract.unidad.identificador} ${contract.unidad.propiedad.direccion}`.toLocaleLowerCase("es-MX").includes(needle));
  const total = propertyResults.length + contractResults.length;
  return <>
    <PageHeader eyebrow="Búsqueda" title={`Resultados para “${query}”`} description={`${total} ${total === 1 ? "resultado" : "resultados"} en propiedades, unidades y arrendatarios.`} />
    {total === 0 ? <div className="mt-7"><EmptyState title="Sin resultados" description="Prueba con otro nombre, dirección o número de unidad." /></div> : <div className="mt-7 grid gap-7 lg:grid-cols-2">
      <section><h2 className="mb-3 text-lg font-bold text-ink">Propiedades y unidades <span className="text-sm font-medium text-ink-secondary">{propertyResults.length}</span></h2><div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">{propertyResults.map((property) => <Link className="block p-4 hover:bg-bg" href={`/propiedades/${property.id}`} key={property.id}><p className="font-semibold text-ink">{property.direccion}</p><p className="mt-1 text-sm text-ink-secondary">{property.propietario.nombre} · {property.unidades.length} unidades disponibles</p></Link>)}{propertyResults.length === 0 ? <p className="p-4 text-sm text-ink-secondary">No hay coincidencias.</p> : null}</div></section>
      <section><h2 className="mb-3 text-lg font-bold text-ink">Arrendatarios y contratos <span className="text-sm font-medium text-ink-secondary">{contractResults.length}</span></h2><div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">{contractResults.slice(0, 20).map((contract) => <Link className="block p-4 hover:bg-bg" href={`/contratos/${contract.id}`} key={contract.id}><p className="font-semibold text-ink">{contract.arrendatario}</p><p className="mt-1 text-sm text-ink-secondary">{contract.unidad.propiedad.direccion} · Unidad {contract.unidad.identificador}</p></Link>)}{contractResults.length === 0 ? <p className="p-4 text-sm text-ink-secondary">No hay coincidencias.</p> : null}</div></section>
    </div>}
  </>;
}
