import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { formatCurrency, formatDate } from "@/lib/format";
import { listarContratos } from "@/lib/services/foundation";
import { listarAlertasRenovacion } from "@/lib/services/inflation";

export const dynamic = "force-dynamic";

export default async function ContractsPage() {
  const [contracts, alerts] = await Promise.all([listarContratos(), listarAlertasRenovacion()]);
  const activeContracts = contracts.filter((contract) => contract.estado === "ACTIVO").length;
  const expiredContracts = contracts.length - activeContracts;

  return (
    <>
      <PageHeader description="Consulta la vigencia, renta e historial de cada arrendamiento." eyebrow="Fundación" title="Contratos" />

      <section aria-label="Resumen de contratos" className="mt-7 grid gap-4 sm:grid-cols-3">
        {[["Contratos activos", activeContracts, "text-brand"], ["Vencidos", expiredContracts, "text-ink-secondary"], ["Por renovar", alerts.length, alerts.length ? "text-warning" : "text-success"]].map(([label, value, color]) => <div className="rounded-3xl bg-bg p-5 shadow-[6px_6px_13px_#c6cdd6,-6px_-6px_13px_#fff]" key={label as string}><p className="text-xs font-bold uppercase tracking-[.1em] text-ink-secondary">{label}</p><p className={`mt-2 text-3xl font-bold tracking-tight [font-variant-numeric:tabular-nums] ${color}`}>{value}</p></div>)}
      </section>

      {alerts.length > 0 ? <section className="mt-8"><div className="mb-4"><p className="text-[10px] font-bold uppercase tracking-[.13em] text-brand/70">Atención requerida</p><h2 className="mt-1 font-serif text-2xl font-semibold text-ink">Próximos vencimientos</h2></div><div className="grid gap-3 lg:grid-cols-2">{alerts.map((contract) => <Link className={contract.nivel === "CRITICO" ? "rounded-2xl border border-danger/20 bg-danger-soft p-5 transition hover:-translate-y-0.5" : "rounded-2xl border border-warning/20 bg-warning-soft p-5 transition hover:-translate-y-0.5"} href={`/contratos/${contract.id}`} key={contract.id}><div className="flex items-start justify-between gap-4"><div><p className={contract.nivel === "CRITICO" ? "font-bold text-danger" : "font-bold text-warning"}>{contract.arrendatario}</p><p className="mt-1 text-sm text-ink-secondary">{contract.unidad.propiedad.direccion} · Unidad {contract.unidad.identificador}</p></div><span className={contract.nivel === "CRITICO" ? "shrink-0 rounded-full bg-danger px-3 py-1 text-xs font-bold text-white" : "shrink-0 rounded-full bg-warning px-3 py-1 text-xs font-bold text-white"}>{contract.dias} días</span></div></Link>)}</div></section> : null}

      <section className="mt-8"><div className="mb-4"><p className="text-[10px] font-bold uppercase tracking-[.13em] text-brand/70">Portafolio</p><h2 className="mt-1 font-serif text-2xl font-semibold text-ink">Todos los contratos</h2><p className="mt-1 text-sm text-ink-secondary">Selecciona un contrato para consultar sus pagos, ajustes y datos completos.</p></div>
        {contracts.length === 0 ? <EmptyState description="Crea un contrato desde el detalle de una unidad disponible." title="Aún no hay contratos" /> : <div className="space-y-4">{contracts.map((contract) => <article className="rounded-3xl bg-bg p-6 shadow-[7px_7px_15px_#c6cdd6,-7px_-7px_15px_#fff]" key={contract.id}><div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-3"><Link className="font-serif text-xl font-semibold text-ink hover:text-brand" href={`/contratos/${contract.id}`}>{contract.arrendatario}</Link><span className={contract.estado === "VENCIDO" ? "inline-flex rounded-full bg-danger-soft px-2.5 py-1 text-xs font-semibold text-danger" : "inline-flex rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand"}>{contract.estado === "ACTIVO" ? "Activo" : "Vencido"}</span></div><Link className="mt-2 inline-block text-sm font-semibold text-brand hover:text-brand-hover" href={`/propiedades/${contract.unidad.propiedadId}/unidades/${contract.unidadId}`}>{contract.unidad.propiedad.direccion} · Unidad {contract.unidad.identificador}</Link></div><dl className="grid gap-4 sm:grid-cols-3 lg:min-w-[480px]"><div><dt className="text-[10px] font-bold uppercase tracking-[.1em] text-ink-secondary">Vigencia</dt><dd className="mt-1 text-sm font-semibold text-ink">{formatDate(contract.fechaInicio)} – {formatDate(contract.fechaFin)}</dd></div><div><dt className="text-[10px] font-bold uppercase tracking-[.1em] text-ink-secondary">Renta mensual</dt><dd className="mt-1 text-sm font-bold text-ink [font-variant-numeric:tabular-nums]">{formatCurrency(contract.rentaMensualBase)}</dd></div><div className="flex items-end sm:justify-end"><Link className="cursor-pointer rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-hover" href={`/contratos/${contract.id}`}>Ver detalle</Link></div></dl></div></article>)}</div>}
      </section>
    </>
  );
}
