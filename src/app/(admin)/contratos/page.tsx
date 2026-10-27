import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { formatCurrency, formatDate } from "@/lib/format";
import { listarContratos } from "@/lib/services/foundation";
import { listarAlertasRenovacion } from "@/lib/services/inflation";

export const dynamic = "force-dynamic";

const orderOptions = ["ARRENDATARIO_ASC", "ARRENDATARIO_DESC", "PROPIEDAD_ASC", "VENCIMIENTO_ASC", "RENTA_DESC"] as const;
type ContractOrder = (typeof orderOptions)[number];

function getOrder(value?: string): ContractOrder {
  return orderOptions.includes(value as ContractOrder) ? value as ContractOrder : "ARRENDATARIO_ASC";
}

export default async function ContractsPage({ searchParams }: { searchParams: Promise<{ buscar?: string; estado?: string; ordenar?: string }> }) {
  const query = await searchParams;
  const search = query.buscar?.trim().slice(0, 100) ?? "";
  const status = ["ACTIVO", "VENCIDO", "CANCELADO"].includes(query.estado ?? "") ? query.estado : "";
  const order = getOrder(query.ordenar);
  const [contracts, alerts] = await Promise.all([listarContratos(), listarAlertasRenovacion()]);
  const filteredContracts = contracts.filter((contract) => {
    const matchesStatus = !status || contract.estado === status;
    const text = `${contract.arrendatario} ${contract.unidad.identificador} ${contract.unidad.propiedad.direccion}`.toLocaleLowerCase("es-MX");
    return matchesStatus && (!search || text.includes(search.toLocaleLowerCase("es-MX")));
  }).sort((a, b) => {
    const tenant = a.arrendatario.localeCompare(b.arrendatario, "es-MX", { sensitivity: "base", numeric: true });
    const property = `${a.unidad.propiedad.direccion} ${a.unidad.identificador}`.localeCompare(`${b.unidad.propiedad.direccion} ${b.unidad.identificador}`, "es-MX", { sensitivity: "base", numeric: true });
    switch (order) {
      case "ARRENDATARIO_DESC": return -tenant || property;
      case "PROPIEDAD_ASC": return property || tenant;
      case "VENCIMIENTO_ASC": return a.fechaFin.getTime() - b.fechaFin.getTime() || tenant;
      case "RENTA_DESC": return Number(b.rentaMensualBase) - Number(a.rentaMensualBase) || tenant;
      default: return tenant || property;
    }
  });
  const activeContracts = contracts.filter((contract) => contract.estado === "ACTIVO").length;
  const expiredContracts = contracts.filter((contract) => contract.estado === "VENCIDO").length;
  const cancelledContracts = contracts.filter((contract) => contract.estado === "CANCELADO").length;

  return (
    <>
      <PageHeader description="Consulta la vigencia, renta e historial de cada arrendamiento." eyebrow="Fundación" title="Contratos" />

      <section aria-label="Resumen de contratos" className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[["Contratos activos", activeContracts, "text-brand"], ["Vencidos", expiredContracts, "text-ink-secondary"], ["Cancelados", cancelledContracts, "text-warning"], ["Por renovar", alerts.length, alerts.length ? "text-warning" : "text-success"]].map(([label, value, color]) => <div className="rounded-3xl bg-bg p-5 shadow-[6px_6px_13px_#c6cdd6,-6px_-6px_13px_#fff]" key={label as string}><p className="text-xs font-bold uppercase tracking-[.1em] text-ink-secondary">{label}</p><p className={`mt-2 text-3xl font-bold tracking-tight [font-variant-numeric:tabular-nums] ${color}`}>{value}</p></div>)}
      </section>

      {alerts.length > 0 ? <section className="mt-8"><div className="mb-4"><p className="text-[10px] font-bold uppercase tracking-[.13em] text-brand/70">Atención requerida</p><h2 className="mt-1 font-serif text-2xl font-semibold text-ink">Próximos vencimientos</h2></div><div className="grid gap-3 lg:grid-cols-2">{alerts.map((contract) => <Link className={contract.nivel === "CRITICO" ? "rounded-2xl border border-danger/20 bg-danger-soft p-5 transition hover:-translate-y-0.5" : "rounded-2xl border border-warning/20 bg-warning-soft p-5 transition hover:-translate-y-0.5"} href={`/contratos/${contract.id}`} key={contract.id}><div className="flex items-start justify-between gap-4"><div><p className={contract.nivel === "CRITICO" ? "font-bold text-danger" : "font-bold text-warning"}>{contract.unidad.propiedad.direccion} · Unidad {contract.unidad.identificador}</p><p className="mt-1 text-sm text-ink-secondary">{contract.arrendatario}</p></div><span className={contract.nivel === "CRITICO" ? "shrink-0 rounded-full bg-danger px-3 py-1 text-xs font-bold text-white" : "shrink-0 rounded-full bg-warning px-3 py-1 text-xs font-bold text-white"}>{contract.dias} días</span></div></Link>)}</div></section> : null}

      <section className="mt-8"><div className="mb-4"><p className="text-[10px] font-bold uppercase tracking-[.13em] text-brand/70">Portafolio</p><h2 className="mt-1 font-serif text-2xl font-semibold text-ink">Contratos</h2><p className="mt-1 text-sm text-ink-secondary">Filtra por estado o busca por arrendatario, propiedad y unidad.</p></div>
        <form action="/contratos" className="mb-5 grid gap-3 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-[minmax(220px,1fr)_190px_210px_auto]" method="get"><input aria-label="Buscar contratos" className="h-11 rounded-lg border border-border bg-surface px-3 text-sm" defaultValue={search} maxLength={100} name="buscar" placeholder="Nombre, dirección o unidad" type="search"/><select aria-label="Filtrar por estado" className="h-11 rounded-lg border border-border bg-surface px-3 text-sm" defaultValue={status} name="estado"><option value="">Todos los estados</option><option value="ACTIVO">Activos</option><option value="VENCIDO">Vencidos</option><option value="CANCELADO">Cancelados</option></select><select aria-label="Ordenar contratos" className="h-11 rounded-lg border border-border bg-surface px-3 text-sm" defaultValue={order} name="ordenar"><option value="ARRENDATARIO_ASC">Arrendatario: A a Z</option><option value="ARRENDATARIO_DESC">Arrendatario: Z a A</option><option value="PROPIEDAD_ASC">Propiedad: A a Z</option><option value="VENCIMIENTO_ASC">Vencimiento: más próximo</option><option value="RENTA_DESC">Renta: mayor a menor</option></select><button className="h-11 rounded-lg bg-brand px-4 text-sm font-bold text-white hover:bg-brand-hover" type="submit">Aplicar</button></form>
        {contracts.length === 0 ? <EmptyState description="Crea un contrato desde el detalle de una unidad disponible." title="Aún no hay contratos" /> : filteredContracts.length === 0 ? <EmptyState description="Prueba con otro nombre o cambia el filtro de estado." title="Sin coincidencias" /> : <><p className="mb-3 text-sm text-ink-secondary">{filteredContracts.length} {filteredContracts.length === 1 ? "contrato" : "contratos"}</p><div className="space-y-4">{filteredContracts.map((contract) => <article className="rounded-2xl border border-border bg-surface p-5" key={contract.id}><div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-3"><Link className="font-serif text-xl font-semibold text-ink hover:text-brand" href={`/contratos/${contract.id}`}>{contract.unidad.propiedad.direccion} · Unidad {contract.unidad.identificador}</Link><span className={contract.estado === "ACTIVO" ? "inline-flex rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand" : contract.estado === "VENCIDO" ? "inline-flex rounded-full bg-danger-soft px-2.5 py-1 text-xs font-semibold text-danger" : "inline-flex rounded-full bg-warning-soft px-2.5 py-1 text-xs font-semibold text-warning"}>{contract.estado === "ACTIVO" ? "Activo" : contract.estado === "VENCIDO" ? "Vencido" : "Cancelado"}</span></div><Link className="mt-2 inline-block text-sm font-semibold text-brand hover:text-brand-hover" href={`/propiedades/${contract.unidad.propiedadId}/unidades/${contract.unidadId}`}>{contract.arrendatario}</Link></div><dl className="grid gap-4 sm:grid-cols-3 lg:min-w-[480px]"><div><dt className="text-[10px] font-bold uppercase tracking-[.1em] text-ink-secondary">Vigencia</dt><dd className="mt-1 text-sm font-semibold text-ink">{formatDate(contract.fechaInicio)} – {formatDate(contract.fechaFin)}</dd></div><div><dt className="text-[10px] font-bold uppercase tracking-[.1em] text-ink-secondary">Renta mensual</dt><dd className="mt-1 text-sm font-bold text-ink [font-variant-numeric:tabular-nums]">{formatCurrency(contract.rentaMensualBase)}</dd></div><div className="flex items-end sm:justify-end"><Link className="rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-hover" href={`/contratos/${contract.id}`}>Ver detalle</Link></div></dl></div></article>)}</div></>}
      </section>
    </>
  );
}
